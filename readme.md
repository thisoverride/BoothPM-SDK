## はじめに

<p>English version <a href="readme-en.md">Here</a></p>

<img src="banner.jpg">

Booth SDKは、人気のあるeコマースプラットフォーム<a href="[https://booth.pm](https://booth.pm/)">Booth.pm</a>からさまざまな商品情報を抽出するためのウェブスクレイピングツールです。サイト上のすべての無料および有料商品の詳細情報を取得でき、無料商品のダウンロードも可能です。

## 貢献

Booth SDKの機能と使いやすさを向上させるための貢献を心より歓迎します。バグを見つけた場合、機能のリクエストがある場合、またはコードに貢献したい場合は、貢献ガイドラインに従ってください。

## 使用例

以下は、Booth SDKの使用例です。

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

出力結果 :

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

# API リファレンス

## 商品

- `listProducts(index: number = 1, filterOn?: ProductSearchFilter)`: 商品のリストを取得します。インデックスはページインデックスを指定し、デフォルトは1です。`filterOn`を使用して商品リストにフィルターを適用できます。
- `getProduct(productId: number)`: 特定の商品IDの詳細を取得します。
- `find(term: string, filterOn?: ProductSearchFilter)`: 指定された検索用語を使用して商品を検索します。`filterOn`で追加のフィルタリングが可能です。
- `autocomplete(query: string)`: クエリに基づいてオートコンプリートの提案を提供します。
- `save(downloadableData: DownloadableData)`: 指定された商品をダウンロードします。商品情報を含む`downloadableData`オブジェクトが必要です。

## ウィッシュリスト

- `addToWishlist(productId: number, productName: string)`: 商品をウィッシュリストに追加します。
- `getWishlistItems()`: ウィッシュリスト内のすべてのアイテムを取得します。
- `clearWishlist()`: ウィッシュリストをクリアします。
- `removeFromWishlist(productId: number)`: 商品IDでウィッシュリストから商品を削除します。

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。詳細についてはLICENSEファイルをご参照ください。
