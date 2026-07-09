import type { BoothProduct, Category, Downloadable, Images, Shop } from '../../../@types/services/dto/Dto';

export default class BoothProductDto implements BoothProduct {
  public readonly id: number;
  public readonly description: string;
  public readonly category: Category;
  public readonly name: string;
  public readonly price: string;
  public readonly images: Images[];
  public readonly shop: Shop;
  public readonly isAdult: boolean;
  public readonly liked: number;
  public readonly downloadable: Downloadable[] | null;

  constructor (
    id: number,
    description: string,
    category: Category,
    productName: string,
    price: string,
    images: Images[],
    shop: Shop,
    isAdult: boolean,
    liked: number,
    downloadable: Downloadable[] | null
  ) {
    this.id = id;
    this.description = description;
    this.category = category;
    this.name = productName;
    this.price = price;
    this.images = images;
    this.shop = shop;
    this.isAdult = isAdult;
    this.liked = liked;
    this.downloadable = downloadable;
  }
}
