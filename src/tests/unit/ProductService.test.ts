jest.mock('fs', () => ({
  createWriteStream: jest.fn(),
  promises: {
    access: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined)
  }
}));

import { EventEmitter } from 'events';
import fs from 'fs';
import ProductService from '../../lib/domain/services/impl/ProductService';
import type HttpClient from '../../lib/core/api/HttpClient';
import { ListFilter, ProductCategory } from '../../lib/utils/Utils';
import { buildListingHtml } from './fixtures/productListing';

function makeHttpClient (get: jest.Mock, stream?: jest.Mock): HttpClient {
  return { get, stream: stream ?? jest.fn() } as unknown as HttpClient;
}

describe('ProductService.listProducts / search (HTML scraping)', () => {
  it('parses listing cards, pagination and merges liked counts from the wishlist endpoint', async () => {
    const html = buildListingHtml([
      { id: 111, brand: 'BrandA', category: 5, price: 500, name: 'Hair Texture', imageURL: 'img1.jpg', shopName: 'ShopA', shopURL: 'https://shopa.booth.pm', shopImageURL: 'avatar1.jpg' },
      { id: 222, brand: 'BrandB', category: 5, price: 0, name: 'Free Model', imageURL: 'img2.jpg', shopName: 'ShopB', shopURL: 'https://shopb.booth.pm', shopImageURL: 'avatar2.jpg', isAdult: true }
    ], { resultsCount: 180 });

    const get = jest.fn(async (endpoint: string) => {
      if (endpoint.includes('wish_lists.json')) {
        return { item_ids: [111, 222], wishlists_counts: { 111: 7, 222: 0 } };
      }
      return html;
    });

    const service = new ProductService(makeHttpClient(get));
    const result = await service.listProducts(1, { sortBy: ListFilter.POPULARITY });

    expect(result.totalArticles).toBe(180);
    expect(result.totalPages).toBe(Math.ceil(180 / 60));
    expect(result.items).toHaveLength(2);

    expect(result.items[0]).toMatchObject({
      productId: 111,
      productBrand: 'BrandA',
      productCategory: 5,
      productName: 'Hair Texture',
      productPrice: 500,
      imageURL: 'img1.jpg',
      shopName: 'ShopA',
      shopURL: 'https://shopa.booth.pm',
      shopImageURL: 'avatar1.jpg',
      isAdult: false,
      liked: 7
    });

    expect(result.items[1]).toMatchObject({
      productId: 222,
      isAdult: true,
      liked: 0
    });
  });

  it('regression: totalArticles and totalPages stay consistent with each other (not 0 vs. an unrelated huge number)', async () => {
    // Mirrors booth.pm's real markup: a single "Results N 件" <b> right
    // before #js-market-result-pulldown is the only source of truth for
    // both totalArticles and totalPages.
    const html = buildListingHtml([], { resultsCount: 2487365 });
    const get = jest.fn(async (endpoint: string) => (
      endpoint.includes('wish_lists.json') ? { item_ids: [], wishlists_counts: {} } : html
    ));
    const service = new ProductService(makeHttpClient(get));

    const result = await service.listProducts(1);

    expect(result.totalArticles).toBe(2487365);
    expect(result.totalPages).toBe(Math.ceil(2487365 / 60));
  });

  it('returns zeroed counts (not garbage) when the results marker is missing from the page', async () => {
    const html = buildListingHtml([]);
    const get = jest.fn(async (endpoint: string) => (
      endpoint.includes('wish_lists.json') ? { item_ids: [], wishlists_counts: {} } : html
    ));
    const service = new ProductService(makeHttpClient(get));

    const result = await service.listProducts(1);

    expect(result.totalArticles).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('throws when the age-verification wall is present in the response', async () => {
    const html = buildListingHtml([], { ageBlocked: true });
    const get = jest.fn(async () => html);
    const service = new ProductService(makeHttpClient(get));

    await expect(service.listProducts(1)).rejects.toThrow('Adulte_Content_is_not_enabled');
  });

  it('rejects an invalid sortBy filter before making any request', async () => {
    const get = jest.fn();
    const service = new ProductService(makeHttpClient(get));

    await expect(service.listProducts(1, { sortBy: 'not-a-real-filter' as ListFilter }))
      .rejects.toThrow('Invalid_filter_provided.');
    expect(get).not.toHaveBeenCalled();
  });

  it('rejects an invalid category filter before making any request', async () => {
    const get = jest.fn();
    const service = new ProductService(makeHttpClient(get));

    await expect(service.listProducts(1, { category: 'Not A Category' as ProductCategory }))
      .rejects.toThrow('Invalid_filter_provided.');
    expect(get).not.toHaveBeenCalled();
  });

  it('search() rejects an empty term without making a request', async () => {
    const get = jest.fn();
    const service = new ProductService(makeHttpClient(get));

    await expect(service.search('')).rejects.toThrow('Term_is_not_provided.');
    expect(get).not.toHaveBeenCalled();
  });

  it('search() returns a parsed collection for a valid term', async () => {
    const html = buildListingHtml([
      { id: 333, brand: 'BrandC', category: 1, price: 100, name: 'Comic', imageURL: 'img.jpg', shopName: 'ShopC', shopURL: 'https://shopc.booth.pm', shopImageURL: 'avatar.jpg' }
    ], { resultsCount: 1 });

    const get = jest.fn(async (endpoint: string) => (
      endpoint.includes('wish_lists.json') ? { item_ids: [333], wishlists_counts: {} } : html
    ));
    const service = new ProductService(makeHttpClient(get));

    const result = await service.search('comic');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe(333);
  });
});

describe('ProductService.getProduct', () => {
  it('rejects a non-numeric product id without making a request', async () => {
    const get = jest.fn();
    const service = new ProductService(makeHttpClient(get));

    await expect(service.getProduct(NaN)).rejects.toThrow('Product_id_is_not_a_number');
    expect(get).not.toHaveBeenCalled();
  });

  it('maps the raw API payload into a BoothProductDto', async () => {
    const wsData = {
      id: 123,
      description: 'line one\nline two',
      category: { id: 9, name: 'VRoid' },
      name: 'Pastel Hair',
      price: '0 JPY',
      images: [{ original: 'o1', resized: 'r1' }],
      shop: { name: 'HoneyRosy', subdomain: 'honeyrosy', thumbnail_url: 'thumb.jpg', url: 'https://honeyrosy.booth.pm' },
      is_adult: false,
      wish_lists_count: 10415,
      // booth.pm's real API returns snake_case keys here (verified against
      // the live endpoint), not the SDK's camelCase Downloadable shape.
      variations: [
        {
          downloadable: {
            no_musics: [
              { file_name: 'Pastel', file_extension: '.zip', name: 'Pastel.zip', file_size: '3.92 MB', url: 'https://booth.pm/downloadables/1' }
            ]
          }
        }
      ]
    };

    const get = jest.fn().mockResolvedValue(wsData);
    const service = new ProductService(makeHttpClient(get));

    const product = await service.getProduct(123);

    expect(product.id).toBe(123);
    expect(product.description).toBe('line one line two');
    expect(product.category).toEqual({ id: 9, name: 'VRoid' });
    expect(product.shop).toEqual({ name: 'HoneyRosy', subdomain: 'honeyrosy', thumbnail: 'thumb.jpg', url: 'https://honeyrosy.booth.pm' });
    expect(product.isAdult).toBe(false);
    expect(product.liked).toBe(10415);
    expect(product.downloadable).toEqual([
      { fileName: 'Pastel', fileExtension: '.zip', name: 'Pastel.zip', fileSize: '3.92 MB', url: 'https://booth.pm/downloadables/1' }
    ]);
  });

  it('sets downloadable to null when the product has no free download variation', async () => {
    const wsData = {
      id: 999,
      description: 'paid item',
      category: { id: 1, name: 'Goods' },
      name: 'Paid Thing',
      price: '1,000 JPY',
      images: [],
      shop: { name: 'Shop', subdomain: 'shop', thumbnail_url: 't.jpg', url: 'https://shop.booth.pm' },
      is_adult: false,
      wish_lists_count: 0,
      variations: []
    };
    const get = jest.fn().mockResolvedValue(wsData);
    const service = new ProductService(makeHttpClient(get));

    const product = await service.getProduct(999);
    expect(product.downloadable).toBeNull();
  });
});

describe('ProductService.autocomplete', () => {
  it('rejects an empty term without making a request', async () => {
    const get = jest.fn();
    const service = new ProductService(makeHttpClient(get));

    await expect(service.autocomplete('')).rejects.toThrow('Term_is_null');
    expect(get).not.toHaveBeenCalled();
  });

  it('returns the suggestion list from the http client', async () => {
    const get = jest.fn().mockResolvedValue(['vroid', 'vroid hair']);
    const service = new ProductService(makeHttpClient(get));

    await expect(service.autocomplete('vro')).resolves.toEqual(['vroid', 'vroid hair']);
  });
});

describe('ProductService.download', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns zero stats when the product has no downloadable links', async () => {
    const service = new ProductService(makeHttpClient(jest.fn()));

    const stats = await service.download({
      boothProduct: { downloadable: null } as any
    });

    expect(stats).toEqual({ successfulDownloads: 0, failedDownloads: 0 });
  });

  it('counts a successful download exactly once when the write stream finishes', async () => {
    const fileStream = new EventEmitter();
    (fs.createWriteStream as jest.Mock).mockReturnValue(fileStream);

    const sourceStream = { pipe: jest.fn((dest: EventEmitter) => { process.nextTick(() => dest.emit('finish')); }) };
    const stream = jest.fn().mockResolvedValue(sourceStream);
    const service = new ProductService(makeHttpClient(jest.fn(), stream));

    const stats = await service.download({
      path: './downloads',
      boothProduct: { downloadable: [{ fileName: 'f', fileExtension: '.zip', name: 'f.zip', fileSize: '1KB', url: 'https://booth.pm/downloadables/1' }] } as any
    });

    expect(stats).toEqual({ successfulDownloads: 1, failedDownloads: 0 });
  });

  it('counts a failed download exactly once (not twice) when the write stream errors', async () => {
    const fileStream = new EventEmitter();
    (fs.createWriteStream as jest.Mock).mockReturnValue(fileStream);

    const sourceStream = { pipe: jest.fn((dest: EventEmitter) => { process.nextTick(() => dest.emit('error', new Error('disk full'))); }) };
    const stream = jest.fn().mockResolvedValue(sourceStream);
    const service = new ProductService(makeHttpClient(jest.fn(), stream));

    const stats = await service.download({
      path: './downloads',
      boothProduct: { downloadable: [{ fileName: 'f', fileExtension: '.zip', name: 'f.zip', fileSize: '1KB', url: 'https://booth.pm/downloadables/1' }] } as any
    });

    expect(stats).toEqual({ successfulDownloads: 0, failedDownloads: 1 });
  });
});
