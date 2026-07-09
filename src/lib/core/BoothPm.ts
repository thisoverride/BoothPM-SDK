import type { BaseConfig, Config, IBoothSDK } from '../@types/BoothSDK';
import type { BoothProduct } from '../@types/services/dto/Dto';
import type { BoothProductCollection, DownloadableData, DownloadStats, ProductSearchFilter } from '../@types/services/ProductService';
import ProductService from '../domain/services/impl/ProductService';
import WishlistService from '../domain/services/impl/WishlistService';
import { AgeRestriction, ListFilter, ProductCategory } from '../utils/Utils';
import HttpClient from './api/HttpClient';

export class BoothSDK implements IBoothSDK {
  public static readonly CATEGORIES = ProductCategory;
  public static readonly FILTERS = ListFilter;
  public static readonly AGE_RESTRICT = AgeRestriction;
  private readonly _httpClient: HttpClient;
  private readonly _productService: ProductService;
  private readonly _wishlistService: WishlistService;

  constructor (config: BaseConfig) {
    this._httpClient = new HttpClient(this._setBaseConfig(config));
    this._productService = new ProductService(this._httpClient);
    this._wishlistService = new WishlistService();
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
