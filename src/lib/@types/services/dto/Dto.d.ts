export interface Category {
  id: number;
  name: string;
}

export interface Images {
  original: string;
  resized: string;
}

export interface Shop {
  name: string;
  subdomain: string;
  thumbnail: string;
  url: string;
}

export interface Downloadable {
  fileName: string;
  fileExtension: string;
  name: string;
  fileSize: string;
  url: string;
  path?: string;
}

export interface BoothProduct {
  id: number;
  description: string;
  category: Category;
  name: string;
  price: string;
  images: Images[];
  shop: Shop;
  isAdult: boolean;
  liked: number;
  downloadable: Downloadable[] | null;
}

export interface BoothProductOverview {
  productId: number;
  productBrand: string;
  productCategory: number;
  productName: string;
  productPrice: number;
  imageURL: string;
  shopName: string;
  shopURL: string;
  isAdult: boolean;
  liked: number;
  shopImageURL: string;
}
