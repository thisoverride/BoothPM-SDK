import type { AgeRestriction, ListFilter, ProductCategory } from '../../utils/Utils';
import type { BoothProduct, BoothProductOverview } from './dto/Dto';

/**
 * Represents a downloadable item with an optional path.
 */
export interface DownloadableData {
  /**
   * The optional path where the downloadable item can be found.
   */
  path?: string;
  /**
   * The booth product item associated with the download.
   */
  boothProduct: BoothProduct;
}

/**
 * Represents a collection of booth products.
 */
export interface BoothProductCollection {
  /**
   * The total number of articles.
   * @type {number}
   */
  totalArticles: number;
  /**
   * The total number of pages.
   * @type {number}
   */
  totalPages: number;
  /**
   * An array of booth products.
   * @type {BoothProductOverview[]}
   */
  items: BoothProductOverview[];
}

/**
 * Represents download statistics.
 * @interface
 */
export interface DownloadStats {
  /**
   * The number of successful downloads.
   * @type {number}
   */
  successfulDownloads: number;
  /**
   * The number of failed downloads.
   * @type {number}
   */
  failedDownloads: number;
}

/**
 * Represents search filter options for products.
 * @interface
 */
export interface ProductSearchFilter {
  /**
   * Specifies how the results should be sorted.
   * @type {ListFilter}
   */
  sortBy?: ListFilter;
  /**
   * Filter products by category.
   * @type {ProductCategory}
   */
  category?: ProductCategory;
  /**
   * Filter products by age restriction.
   * @type {AgeRestriction}
   */
  ageRestriction?: AgeRestriction;
  /**
   * If true, only show free products.
   * @type {boolean}
   */
  onlyFreeProducts?: boolean;
}

/**
 * Represents a product that has been liked by users.
 * @interface
 */
export interface LikedProduct {
  /**
   * Array of product IDs that have been liked.
   * @type {number[]}
   */
  item_ids: number[];
  /**
   * Records the number of times each product has been wishlisted.
   * @type {Record<string, number>}
   */
  wishlists_counts: Record<string, number>;
}
