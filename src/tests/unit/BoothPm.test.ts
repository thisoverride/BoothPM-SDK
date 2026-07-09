jest.mock('../../lib/core/api/HttpClient');
jest.mock('../../lib/domain/services/impl/ProductService');
jest.mock('../../lib/domain/services/impl/WishlistService');
jest.mock('../../lib/core/auth/login');

import { BoothSDK } from '../../lib/core/BoothPm';
import HttpClient from '../../lib/core/api/HttpClient';
import ProductService from '../../lib/domain/services/impl/ProductService';
import WishlistService from '../../lib/domain/services/impl/WishlistService';
import * as authLogin from '../../lib/core/auth/login';
import { AgeRestriction, ListFilter, ProductCategory } from '../../lib/utils/Utils';

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;
const MockedProductService = ProductService as jest.MockedClass<typeof ProductService>;
const MockedWishlistService = WishlistService as jest.MockedClass<typeof WishlistService>;
const mockedLogin = authLogin.login as jest.Mock;
const mockedDisconnect = authLogin.disconnect as jest.Mock;

describe('BoothSDK', () => {
  beforeEach(() => {
    MockedHttpClient.mockClear();
    MockedProductService.mockClear();
    MockedWishlistService.mockClear();
    mockedLogin.mockReset();
    mockedDisconnect.mockReset().mockResolvedValue(undefined);
  });

  it('exposes the category/filter/age-restriction enums as static members', () => {
    expect(BoothSDK.CATEGORIES).toBe(ProductCategory);
    expect(BoothSDK.FILTERS).toBe(ListFilter);
    expect(BoothSDK.AGE_RESTRICT).toBe(AgeRestriction);
  });

  it('rejects unsupported languages', () => {
    expect(() => new BoothSDK({ lang: 'fr' as any })).toThrow('This language is not supported.');
  });

  it('accepts "en" and "ja" and forwards lang + cookies to the HttpClient', () => {
    // eslint-disable-next-line no-new
    new BoothSDK({ lang: 'en', cookies: { a: '1' } });
    expect(MockedHttpClient).toHaveBeenCalledWith({ lang: 'en', cookies: { a: '1' } });
  });

  it('delegates listProducts/getProduct/find/autocomplete/save to the ProductService instance', async () => {
    const sdk = new BoothSDK({ lang: 'en' });
    const productServiceInstance = MockedProductService.mock.instances[0] as jest.Mocked<ProductService>;

    productServiceInstance.listProducts.mockResolvedValue({ totalArticles: 1, totalPages: 1, items: [] });
    productServiceInstance.getProduct.mockResolvedValue({ id: 1 } as any);
    productServiceInstance.search.mockResolvedValue({ totalArticles: 0, totalPages: 0, items: [] });
    productServiceInstance.autocomplete.mockResolvedValue(['a']);
    productServiceInstance.download.mockResolvedValue({ successfulDownloads: 1, failedDownloads: 0 });

    await sdk.listProducts(2, { sortBy: ListFilter.NEW });
    expect(productServiceInstance.listProducts).toHaveBeenCalledWith(2, { sortBy: ListFilter.NEW });

    await sdk.getProduct(42);
    expect(productServiceInstance.getProduct).toHaveBeenCalledWith(42);

    await sdk.find('hair', { sortBy: ListFilter.LOVES });
    expect(productServiceInstance.search).toHaveBeenCalledWith('hair', { sortBy: ListFilter.LOVES });

    await sdk.autocomplete('vro');
    expect(productServiceInstance.autocomplete).toHaveBeenCalledWith('vro');

    const downloadable = { boothProduct: { id: 1 } as any, path: './downloads' };
    await sdk.save(downloadable);
    expect(productServiceInstance.download).toHaveBeenCalledWith(downloadable);
  });

  it('delegates wishlist methods to the WishlistService instance', () => {
    const sdk = new BoothSDK({ lang: 'en' });
    const wishlistServiceInstance = MockedWishlistService.mock.instances[0] as jest.Mocked<WishlistService>;
    wishlistServiceInstance.getWishlistItems.mockReturnValue([{ productId: 1, productName: 'x' }]);

    sdk.addToWishlist(1, 'x');
    expect(wishlistServiceInstance.addToWishlist).toHaveBeenCalledWith(1, 'x');

    expect(sdk.getWishlistItems()).toEqual([{ productId: 1, productName: 'x' }]);

    sdk.clearWishlist();
    expect(wishlistServiceInstance.clearWishlist).toHaveBeenCalled();
  });

  it('login() applies the cookies returned by the auth module to the HttpClient instance', async () => {
    mockedLogin.mockResolvedValue({ _plaza_session: 'abc' });
    const sdk = new BoothSDK({ lang: 'en' });
    const httpClientInstance = MockedHttpClient.mock.instances[0] as jest.Mocked<HttpClient>;

    await sdk.login({ forceRelogin: true });

    expect(mockedLogin).toHaveBeenCalledWith({ forceRelogin: true });
    expect(httpClientInstance.setCookies).toHaveBeenCalledWith({ _plaza_session: 'abc' });
  });

  it('disconnect() clears the cached session and reverts the HttpClient to the cookies the instance was constructed with', async () => {
    const sdk = new BoothSDK({ lang: 'en', cookies: { original: '1' } });
    const httpClientInstance = MockedHttpClient.mock.instances[0] as jest.Mocked<HttpClient>;

    await sdk.disconnect();

    expect(mockedDisconnect).toHaveBeenCalled();
    expect(httpClientInstance.setCookies).toHaveBeenCalledWith({ original: '1' });
  });

  it('disconnect() reverts to no cookies when the instance was constructed without any', async () => {
    const sdk = new BoothSDK({ lang: 'en' });
    const httpClientInstance = MockedHttpClient.mock.instances[0] as jest.Mocked<HttpClient>;

    await sdk.disconnect();

    expect(httpClientInstance.setCookies).toHaveBeenCalledWith({});
  });
});
