import type { BoothProduct } from './services/dto/Dto';
import type { BoothProductCollection, DownloadableData, DownloadStats, ProductSearchFilter } from './services/ProductService';
import type { LoginOptions } from '../core/auth/login';

export type Language = 'en' | 'ja';

export interface BaseConfig {
  lang: Language;
  /**
   * Optional cookies to send with every request (e.g. to bypass anti-bot
   * challenges). Not required for standard usage.
   */
  cookies?: Record<string, string>;
}

export interface Config {
  lang: string;
  cookies?: Record<string, string>;
}

export interface IBoothSDK {
  /**
   * Logs in with pixiv (opening a browser window the first time, then
   * reusing the cached session on subsequent calls) and applies the
   * resulting cookies to this instance.
   * @param {LoginOptions} [options] - Login/cache behavior options.
   * @returns {Promise<void>}
   */
  login: (options?: LoginOptions) => Promise<void>;

  /**
   * Clears the cached pixiv session (if any) and reverts this instance to
   * the cookies it was constructed with (none by default), so it keeps
   * working for all public resources.
   * @returns {Promise<void>}
   */
  disconnect: () => Promise<void>;

  /**
   * Lists products with optional pagination and filtering.
   * @param {number} [index] - The page index for pagination.
   * @param {ProductSearchFilter} [filterOn] - Filter to apply to the product listing.
   * @returns {Promise<BoothProductCollection>} - A promise that resolves to a collection of booth products.
   */
  listProducts: (index: number, filterOn?: ProductSearchFilter) => Promise<BoothProductCollection>;

  /**
   * Retrieves details of a specific product by its ID.
   * @param {number} productId - The ID of the product to retrieve.
   * @returns {Promise<BoothProduct>} - A promise that resolves to the product details.
   */
  getProduct: (productId: number) => Promise<BoothProduct>;

  /**
   * Searches for products based on a search term and optional filtering.
   * @param {string} term - The search term to use.
   * @param {ProductSearchFilter} [filterOn] - Filter to apply to the search results.
   * @returns {Promise<BoothProductCollection>} - A promise that resolves to a collection of search results.
   */
  find: (term: string, filterOn?: ProductSearchFilter) => Promise<BoothProductCollection>;

  /**
   * Saves downloadable data for a specified product.
   * @param {DownloadableData} downloadableData - The data to be downloaded.
   * @returns {Promise<DownloadStats>} - A promise that resolves to download statistics.
   */
  save: (downloadableData: DownloadableData) => Promise<DownloadStats>;
}
