import type { Category, Downloadable, Images, Shop } from '../../@types/services/dto/Dto';

export default class BoothProductDto {
  private readonly id: number;
  private readonly description: string;
  private readonly category: Category;
  private readonly name: string;
  private readonly price: string;
  private readonly images: Images[];
  private readonly shop: Shop;
  private readonly isAdult?: boolean;
  private readonly liked: number;
  private readonly downloadable: Downloadable;

  constructor (
    id: number,
    description: string,
    category: Category,
    productName: string,
    price: string,
    images: Images[],
    shop: Shop,
    isAdult: boolean | undefined,
    liked: number,
    downloadable: Downloadable
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