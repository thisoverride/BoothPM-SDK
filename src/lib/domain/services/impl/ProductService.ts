import fs from 'fs';
import * as cheerio from 'cheerio';
import BaseService from '../base/BaseClient';
import type HttpClient from '../../../core/api/HttpClient';
import type { BoothProductCollection, DownloadableData, DownloadStats, LikedProduct, ProductSearchFilter } from '../../../@types/services/ProductService';
import type { BoothProduct, BoothProductOverview, Category, Downloadable, Images, Shop } from '../../../@types/services/dto/Dto';
import ApiEndpoints from '../../../core/api/ApiEndPoint';
import BoothProductDto from '../dto/BoothProductDto';
import DirManager from '../../../utils/DirManager';
import BoothProductOverviewDto from '../dto/BoothProductOverviewDto';
import { ListFilter, ProductCategory } from '../../../utils/Utils';

export default class ProductService extends BaseService {
  private readonly _httpclient: HttpClient;

  constructor (httpclient: HttpClient) {
    super();
    this._httpclient = httpclient;
  }

  public async listProducts (index: number, filterOn?: ProductSearchFilter): Promise<BoothProductCollection> {
    if (!this._validateFilter(filterOn)) {
      throw new Error('Invalid_filter_provided.');
    }

    const wsData = await this.performRequest(async () =>
      await this._httpclient.get(ApiEndpoints.products.listProducts(index, filterOn))
    );
    return await this._extractProducts(wsData);
  }

  public async getProduct (articleId: number): Promise<BoothProduct> {
    if (!Number(articleId)) {
      throw new Error('Product_id_is_not_a_number');
    }

    const wsData: any = await this.performRequest(async () =>
      await this._httpclient.get(ApiEndpoints.products.getById(articleId)));

    const category: Category = {
      id: wsData.category.id,
      name: wsData.category.name
    };

    const images: Images[] = wsData.images.map((image: Images) => ({
      original: image.original,
      resized: image.resized
    }));

    const shop: Shop = {
      name: wsData.shop.name,
      subdomain: wsData.shop.subdomain,
      thumbnail: wsData.shop.thumbnail_url,
      url: wsData.shop.url
    };

    const variations = wsData.variations || [];
    const downloadable = variations[0]?.downloadable || {};
    const noMusics: Downloadable[] | null = (downloadable.no_musics as Downloadable[]) ?? null;
    const cleanedDescription = wsData.description.replace(/\n/g, ' ');

    const boothProduct = new BoothProductDto(
      Number(wsData.id),
      String(cleanedDescription),
      category,
      String(wsData.name),
      String(wsData.price),
      images,
      shop,
      Boolean(wsData.is_adult),
      Number(wsData.wish_lists_count),
      noMusics
    );

    return boothProduct;
  }

  public async search (term: string, filterOn?: ProductSearchFilter): Promise<BoothProductCollection> {
    if (!term) {
      throw new Error('Term_is_not_provided.');
    }

    if (!this._validateFilter(filterOn)) {
      throw new Error('Invalid_filter_provided.');
    }

    const wsData = await this.performRequest(async () =>
      await this._httpclient.get(ApiEndpoints.products.search(term, filterOn))
    );

    return await this._extractProducts(wsData);
  }

  public async download (downloadableData: DownloadableData): Promise<DownloadStats> {
    const downloadLinks: Downloadable[] | null = downloadableData.boothProduct.downloadable;

    let successfulDownloads: number = 0;
    let failedDownloads: number = 0;
    if (!downloadLinks) {
      return { successfulDownloads, failedDownloads };
    }
    for (const linkInfo of downloadLinks) {
      try {
        const wsData: any = await this.performRequest(async () =>
          await this._httpclient.stream(ApiEndpoints.products.save(linkInfo.url as string)));
        if (!await DirManager.folderExists(`${downloadableData.path}`)) {
          await DirManager.createDir((`${downloadableData.path}`));
        }
        const fileStream: fs.WriteStream = fs.createWriteStream(`${downloadableData.path}/${linkInfo.name}`);

        wsData.pipe(fileStream);

        await new Promise<void>((resolve, reject) => {
          fileStream.on('finish', () => {
            successfulDownloads++;
            resolve();
          });
          fileStream.on('error', (error) => {
            reject(error);
          });
        });
      } catch (e) {
        failedDownloads++;
      }
    }
    return { successfulDownloads, failedDownloads };
  }

  public async autocomplete (term: string): Promise<string[]> {
    if (!term) {
      throw new Error('Term_is_null');
    }
    const wsData = await this.performRequest<string[]>(async () =>
      await this._httpclient.get(ApiEndpoints.products.autoCompleteSuggestion(term), undefined, false)
    );
    return wsData;
  }

  private async _extractProducts (html: any): Promise<BoothProductCollection> {
    const $ = cheerio.load(html as string);

    const ageVerification: string = $('#age-confirmation .u-tpg-title1.u-m-0').text();
    if (ageVerification) {
      throw new Error('Adulte_Content_is_not_enabled');
    }
    const resultRaw: string = $('div.u-d-flex.u-align-items-center.u-pb-300.u-tpg-body2.u-justify-content-between b').text();
    const resultsNumber: number = parseInt(resultRaw?.match(/\d+/g)?.join('') || '0', 10);

    const elements = $('.l-cards-5cols li[data-product-id]');
    let totalArticle: string = $('.container b').text();
    let count: number = 0;

    if (totalArticle && totalArticle.trim() !== '') {
      totalArticle = totalArticle.replace(/\D/g, '');
      count = Math.ceil(Number(totalArticle) / 60);
    }

    const itemsData: BoothProductOverview[] = [];
    elements.each((_index, element) => {
      const productId = $(element).attr('data-product-id');
      const productBrand = $(element).attr('data-product-brand');
      const productCategory = $(element).attr('data-product-category');
      const productName = $(element)
        .find('.item-card__title-anchor--multiline')
        .text()
        .trim();
      const productPrice = $(element).attr('data-product-price');
      const imageURL = $(element)
        .find('.js-thumbnail-image')
        .attr('data-original');
      const shopName = $(element)
        .find('.item-card__shop-info .item-card__shop-name')
        .text()
        .trim();
      const isAdult = $(element)
        .find('.badge.adult')
        .text()
        .trim();
      const shopURL = $(element)
        .find('.item-card__shop-info .item-card__shop-name-anchor')
        .attr('href');
      const shopImageURL = $(element)
        .find('.item-card__shop-info .user-avatar')
        .attr('src');

      const boothProductOverview = new BoothProductOverviewDto(
        Number(productId),
        String(productBrand),
        Number(productCategory),
        productName,
        isAdult !== '',
        Number(productPrice),
        String(imageURL),
        shopName,
        String(shopURL),
        String(shopImageURL),
        0
      );

      itemsData.push(boothProductOverview);
    });

    const tmpProductId: number[] = itemsData.map((product) => product.productId);
    const wsData: LikedProduct = await this.performRequest<LikedProduct>(async () =>
      await this._httpclient.get(ApiEndpoints.products.wishLists(tmpProductId), undefined, false));

    itemsData.forEach(item => {
      item.liked = wsData.wishlists_counts[item.productId] || 0;
    });

    const BoothProductCollection: BoothProductCollection = {
      totalArticles: resultsNumber,
      totalPages: count,
      items: itemsData
    };

    return BoothProductCollection;
  }

  private _validateFilter (filterOn?: ProductSearchFilter): boolean {
    if (filterOn?.sortBy && !Object.values(ListFilter).includes(filterOn.sortBy)) {
      return false;
    }
    if (filterOn?.category && !Object.values(ProductCategory).includes(filterOn.category)) {
      return false;
    }
    return true;
  }
}
