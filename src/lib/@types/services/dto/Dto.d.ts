/**
 * Represents a product's category.
 * @interface
 */
export interface Category {
  /**
   * The category's numeric identifier on Booth.
   * @type {number}
   */
  id: number;
  /**
   * The category's display name.
   * @type {string}
   */
  name: string;
}

/**
 * Represents a product image, in its original and resized forms.
 * @interface
 */
export interface Images {
  /**
   * URL of the full-size image.
   * @type {string}
   */
  original: string;
  /**
   * URL of the resized (thumbnail) image.
   * @type {string}
   */
  resized: string;
}

/**
 * Represents the shop that publishes a product.
 * @interface
 */
export interface Shop {
  /**
   * The shop's display name.
   * @type {string}
   */
  name: string;
  /**
   * The shop's Booth subdomain (e.g. "honeyrosy" for honeyrosy.booth.pm).
   * @type {string}
   */
  subdomain: string;
  /**
   * URL of the shop's thumbnail/avatar image.
   * @type {string}
   */
  thumbnail: string;
  /**
   * URL of the shop's page.
   * @type {string}
   */
  url: string;
}

/**
 * Represents a single downloadable file attached to a product.
 * @interface
 */
export interface Downloadable {
  /**
   * The file's base name, without extension.
   * @type {string}
   */
  fileName: string;
  /**
   * The file's extension (e.g. ".zip").
   * @type {string}
   */
  fileExtension: string;
  /**
   * The file's full name, including extension.
   * @type {string}
   */
  name: string;
  /**
   * Human-readable file size (e.g. "3.92 MB").
   * @type {string}
   */
  fileSize: string;
  /**
   * URL to download the file from.
   * @type {string}
   */
  url: string;
  /**
   * Optional local path the file was (or will be) saved to.
   * @type {string}
   */
  path?: string;
}

/**
 * Represents the full details of a single Booth product, as returned by
 * {@link IBoothSDK.getProduct}.
 * @interface
 */
export interface BoothProduct {
  /**
   * The product's numeric identifier on Booth.
   * @type {number}
   */
  id: number;
  /**
   * The product's description text.
   * @type {string}
   */
  description: string;
  /**
   * The category the product belongs to.
   * @type {Category}
   */
  category: Category;
  /**
   * The product's display name.
   * @type {string}
   */
  name: string;
  /**
   * The product's price, as displayed on Booth (e.g. "0 JPY").
   * @type {string}
   */
  price: string;
  /**
   * The product's images.
   * @type {Images[]}
   */
  images: Images[];
  /**
   * The shop that publishes the product.
   * @type {Shop}
   */
  shop: Shop;
  /**
   * Whether the product is restricted to adult audiences.
   * @type {boolean}
   */
  isAdult: boolean;
  /**
   * The number of users who have wishlisted the product.
   * @type {number}
   */
  liked: number;
  /**
   * The product's free/downloadable files, or null when the product has
   * no downloadable variation.
   * @type {Downloadable[] | null}
   */
  downloadable: Downloadable[] | null;
}

/**
 * Represents a summarized product entry, as returned in listing/search
 * results by {@link IBoothSDK.listProducts} and {@link IBoothSDK.find}.
 * @interface
 */
export interface BoothProductOverview {
  /**
   * The product's numeric identifier on Booth.
   * @type {number}
   */
  productId: number;
  /**
   * The name of the brand/shop that publishes the product.
   * @type {string}
   */
  productBrand: string;
  /**
   * The product's category identifier.
   * @type {number}
   */
  productCategory: number;
  /**
   * The product's display name.
   * @type {string}
   */
  productName: string;
  /**
   * The product's price, in yen.
   * @type {number}
   */
  productPrice: number;
  /**
   * URL of the product's thumbnail image.
   * @type {string}
   */
  imageURL: string;
  /**
   * The name of the shop that publishes the product.
   * @type {string}
   */
  shopName: string;
  /**
   * URL of the shop's page.
   * @type {string}
   */
  shopURL: string;
  /**
   * Whether the product is restricted to adult audiences.
   * @type {boolean}
   */
  isAdult: boolean;
  /**
   * The number of users who have wishlisted the product.
   * @type {number}
   */
  liked: number;
  /**
   * URL of the shop's thumbnail/avatar image.
   * @type {string}
   */
  shopImageURL: string;
}
