import BoothProductDto from '../../lib/domain/services/dto/BoothProductDto';
import BoothProductOverviewDto from '../../lib/domain/services/dto/BoothProductOverviewDto';

describe('BoothProductDto', () => {
  it('maps constructor arguments to readonly fields, including a null downloadable', () => {
    const dto = new BoothProductDto(
      1,
      'desc',
      { id: 1, name: 'Cat' },
      'Product',
      '0 JPY',
      [{ original: 'o', resized: 'r' }],
      { name: 'Shop', subdomain: 'shop', thumbnail: 't', url: 'u' },
      true,
      5,
      null
    );

    expect(dto).toMatchObject({
      id: 1,
      description: 'desc',
      category: { id: 1, name: 'Cat' },
      name: 'Product',
      price: '0 JPY',
      isAdult: true,
      liked: 5,
      downloadable: null
    });
  });
});

describe('BoothProductOverviewDto', () => {
  it('maps constructor arguments to readonly fields', () => {
    const dto = new BoothProductOverviewDto(
      1,
      'BrandA',
      3,
      'Product',
      false,
      1000,
      'image.jpg',
      'ShopA',
      'https://shopa.booth.pm',
      'avatar.jpg',
      12
    );

    expect(dto).toMatchObject({
      productId: 1,
      productBrand: 'BrandA',
      productCategory: 3,
      productName: 'Product',
      isAdult: false,
      productPrice: 1000,
      imageURL: 'image.jpg',
      shopName: 'ShopA',
      shopURL: 'https://shopa.booth.pm',
      shopImageURL: 'avatar.jpg',
      liked: 12
    });
  });
});
