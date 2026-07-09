## Introduction

<p>Japanese version <a href="readme.md">here</a></p>


<img src="banner.jpg">

Booth SDK is a web scraping tool designed to extract various product information from the popular e-commerce platform <a href="[https://booth.pm](https://booth.pm/)">Booth.pm</a>. It allows you to obtain detailed information about all free and paid products available on the site and also enables the download of free products.

## Contributions

We warmly welcome contributions aimed at improving the functionality and usability of the Booth SDK. If you find bugs, have feature requests, or want to contribute to the code, please follow our contribution guidelines.

## Usage Example

Here is an example of how to use the Booth SDK.

```jsx
import BoothSDK, { type BoothProductOverview, type BoothProductCollection } from 'booth-pm-sdk';

void (async () => {
  const booth = new BoothSDK({ lang: 'en' });

  const listResult: BoothProductCollection = await booth.listProducts(0, {
    sortBy: BoothSDK.FILTERS.LOVES,
    category: BoothSDK.CATEGORIES.MODELS_3D,
    onlyFreeProducts: true
  });
  
  const { productId }: BoothProductOverview = listResult.items[8];
  const product = await booth.getProduct(productId);
  await booth.save({ boothProduct: product, path: './downloads' });
})();
```

Output :

```jsx
{
  id: 3652121,
  description: 'Pastel Balayage Color Hair Textures and highlight sets. 9 colors. Each can be used separately. The Vroid beta version is compatible. According to terms of use, individual editing and use are possible. If you have any questions about the use of our products, please contact BOOTH store. If you want to use it commercially, please purchase the file you are selling under a commercial license on this link. Only licenses are different, and the contents of the file are the same. ▶ https://honeyrosy.booth.pm/items/4378160 Please check the Terms of Use and then check it. ▶ https://honeyrosy.fanbox.cc/posts/3391912 You can download the thumnail model eyes texture from this URL. ▶ https://honeyrosy.booth.pm/items/3653967',
  category: {
    id: 212,
    name: 'VRoid'
  },
  name: '[無料/Free]【VRoid】Pastel Balayage Hair Textures&Highlight 髪のテクスチャ&ハイライト',
  price: '0 JPY',
  images: [
    {
      original: 'https://booth.pximg.net/45f6a0ab-9644-4b2f-af0f-8336e5564073/i/3652121/784bcd7b-bdf5-4554-aaa1-65a0680f05ea_base_resized.jpg',
      resized: 'https://booth.pximg.net/c/72x72_a2_g5/45f6a0ab-9644-4b2f-af0f-8336e5564073/i/3652121/784bcd7b-bdf5-4554-aaa1-65a0680f05ea_base_resized.jpg'
    },
    {
      original: 'https://booth.pximg.net/45f6a0ab-9644-4b2f-af0f-8336e5564073/i/3652121/9aadcb4b-169c-4f74-b629-e8d9e106f767_base_resized.jpg',
      resized: 'https://booth.pximg.net/c/72x72_a2_g5/45f6a0ab-9644-4b2f-af0f-8336e5564073/i/3652121/9aadcb4b-169c-4f74-b629-e8d9e106f767_base_resized.jpg'
    },
    {
      original: 'https://booth.pximg.net/45f6a0ab-9644-4b2f-af0f-8336e5564073/i/3652121/452d9d2e-4616-44f9-88dc-acda4b8025ec_base_resized.jpg',
      resized: 'https://booth.pximg.net/c/72x72_a2_g5/45f6a0ab-9644-4b2f-af0f-8336e5564073/i/3652121/452d9d2e-4616-44f9-88dc-acda4b8025ec_base_resized.jpg'
    },
    {
      original: 'https://booth.pximg.net/45f6a0ab-9644-4b2f-af0f-8336e5564073/i/3652121/2b698f96-edd1-4665-86ea-20fb07a54e59_base_resized.jpg',
      resized: 'https://booth.pximg.net/c/72x72_a2_g5/45f6a0ab-9644-4b2f-af0f-8336e5564073/i/3652121/2b698f96-edd1-4665-86ea-20fb07a54e59_base_resized.jpg'
    }
  ],
  shop: {
    name: 'HoneyRosy',
    subdomain: 'honeyrosy',
    thumbnail: 'https://booth.pximg.net/c/48x48/users/11512009/icon_image/a7f9d289-1a8e-401d-bcd5-ea8615578fd6_base_resized.jpg',
    url: 'https://honeyrosy.booth.pm/'
  },
  isAdult: false,
  liked: 10415,
  downloadable: [
    {
      file_name: 'Pastel_Balayage_Color_Hair_Texture',
      file_extension: '.zip',
      file_size: '3.92 MB',
      name: 'Pastel_Balayage_Color_Hair_Texture.zip',
      url: 'https://booth.pm/downloadables/2336025'
    }
  ]
};
```
# API Reference

## Product

- `listProducts(index: number = 1, filterOn?: ProductSearchFilter)`: Retrieves a list of products. The index specifies the page index and defaults to 1. `filterOn` allows you to apply filters to the product list.
- `getProduct(productId: number)`: Retrieves details of a specific product by its ID.
- `find(term: string, filterOn?: ProductSearchFilter)`: Searches for products using the provided search term. `filterOn` allows for additional filtering.
- `autocomplete(query: string)`: Provides autocomplete suggestions based on the query.
- `save(downloadableData: DownloadableData)`: Downloads a specified product. Requires the `downloadableData` object containing product information.

## Wishlist

- `addToWishlist(productId: number, productName: string)`: Adds a product to the wishlist.
- `getWishlistItems()`: Retrieves all items in the wishlist.
- `clearWishlist()`: Clears the wishlist.
- `removeFromWishlist(productId: number)`: Removes a product from the wishlist by its product ID.

## License

This project is licensed under the MIT license. Please see the LICENSE file for more details.
