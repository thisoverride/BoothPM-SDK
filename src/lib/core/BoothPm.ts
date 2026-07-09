import type { BaseConfig, Config, IBoothSDK } from '../@types/BoothSDK';
import type { BoothProduct } from '../@types/services/dto/Dto';
import type { BoothProductCollection, DownloadableData, DownloadStats, ProductSearchFilter } from '../@types/services/ProductService';
import ProductService from '../domain/services/impl/ProductService';
import WishlistService from '../domain/services/impl/WishlistService';
import { AgeRestriction, ListFilter, ProductCategory } from '../utils/Utils';
import HttpClient from './api/HttpClient';
import { disconnect as disconnectSession, login as loginSession, type LoginOptions } from './auth/login';

export class BoothSDK implements IBoothSDK {
  public static readonly CATEGORIES = ProductCategory;
  public static readonly FILTERS = ListFilter;
  public static readonly AGE_RESTRICT = AgeRestriction;
  private readonly _httpClient: HttpClient;
  private readonly _productService: ProductService;
  private readonly _wishlistService: WishlistService;
  private readonly _defaultCookies: Record<string, string>;

  constructor (config: BaseConfig) {
    const resolvedConfig = this._setBaseConfig(config);
    this._defaultCookies = resolvedConfig.cookies ?? {};
    this._httpClient = new HttpClient(resolvedConfig);
    this._productService = new ProductService(this._httpClient);
    this._wishlistService = new WishlistService();
  }

  /**
   * Logs in with pixiv (opening a browser window the first time, then
   * reusing the cached session on subsequent calls - see `login()` for
   * details) and applies the resulting cookies to this instance.
   */
  public async login (options?: LoginOptions): Promise<void> {
    const cookies = await loginSession(options);
    this._httpClient.setCookies(cookies);
  }

  /**
   * Clears the cached pixiv session (if any) and reverts this instance to
   * the cookies it was constructed with (none by default), so it keeps
   * working for all public resources.
   */
  public async disconnect (): Promise<void> {
    await disconnectSession();
    this._httpClient.setCookies(this._defaultCookies);
  }

  public async listProducts (index: number = 1, filterOn?: ProductSearchFilter): Promise<BoothProductCollection> {
    return await this._productService.listProducts(index, filterOn);
  }

  public async getProduct (productId: number): Promise<BoothProduct> {
    return await this._productService.getProduct(productId);
  }

  public async find (term: string, filterOn?: ProductSearchFilter): Promise<BoothProductCollection> {
    return await this._productService.search(term, filterOn);
  }

  public async autocomplete (query: string): Promise<string[]> {
    return await this._productService.autocomplete(query);
  }

  public async save (downloadableData: DownloadableData): Promise<DownloadStats> {
    return await this._productService.download(downloadableData);
  }

  public addToWishlist (productId: number, productName: string): void {
    this._wishlistService.addToWishlist(productId, productName);
  }

  public getWishlistItems (): Array<{ productId: number; productName: string; }> {
    return this._wishlistService.getWishlistItems();
  }

  public clearWishlist (): void {
    this._wishlistService.clearWishlist();
  }

  private _setBaseConfig (conf: BaseConfig): Config {
    if (conf.lang !== 'ja' && conf.lang !== 'en') {
      throw new Error('This language is not supported.');
    }
    return {
      lang: conf.lang,
      cookies: conf.cookies
    };
  }
}
