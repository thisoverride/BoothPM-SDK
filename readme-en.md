## Introduction

<p>Japanese version <a href="readme.md">here</a></p>


<img src="https://raw.githubusercontent.com/thisoverride/BoothPM-SDK/main/banner.jpg">

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
      fileName: 'Pastel_Balayage_Color_Hair_Texture',
      fileExtension: '.zip',
      fileSize: '3.92 MB',
      name: 'Pastel_Balayage_Color_Hair_Texture.zip',
      url: 'https://booth.pm/downloadables/2336025'
    }
  ]
};
```

## Config

- `lang`: `'en' | 'ja'`. Required.
- `cookies`: `Record<string, string>` (optional). Not needed for regular browsing; use it if you need to send your own cookies with every request (e.g. an age-verified session).

```jsx
const booth = new BoothSDK({ lang: 'en', cookies: { my_cookie: 'value' } });
```

## Login (optional)

If you want to log in with your own pixiv account, use the SDK instance's `login()`/`disconnect()`. It opens a real browser window and lets you log in yourself as usual (your password is never seen by the SDK).

This requires the optional `puppeteer` dependency, which you only need to install if you use this feature:

```bash
npm install puppeteer
```

```jsx
import BoothSDK from 'booth-pm-sdk';

const booth = new BoothSDK({ lang: 'en' });

await booth.login(); // a browser window opens the first time, log in with pixiv as usual
const product = await booth.getProduct(3563200); // subsequent requests use the authenticated session

await booth.disconnect(); // drops the session; the SDK keeps working for public resources
```

### `loginWithCredentials()` (advanced, not recommended)

There is also `loginWithCredentials()`, which logs in by submitting an email/password directly through an automated browser ([puppeteer-extra](https://github.com/berstend/puppeteer-extra) + the stealth plugin). **It is a materially different, riskier operation than `login()`**:

- The SDK handles your password (in memory only - never written to disk).
- pixiv's login page has confirmed Cloudflare + reCAPTCHA Enterprise anti-bot protection, and this function submits credentials through a stealth-mode automated browser specifically to get past it. This may violate pixiv's Terms of Service and can get the account flagged or restricted.
- If a CAPTCHA is detected, it fails with a clear error instead of attempting to bypass it.
- Runs headless by default (pass `headless: false` to show the browser).

Use `login()` unless you have a specific reason not to. This requires additional optional peer dependencies:

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

```jsx
import { loginWithCredentials } from 'booth-pm-sdk';

const cookies = await loginWithCredentials({ email: 'you@example.com', password: '...' });
const booth = new BoothSDK({ lang: 'en', cookies });
```

- `booth.login(options?: { timeoutMs?: number; forceRelogin?: boolean; cachePath?: string })`: opens a browser window the first time and waits for you to finish logging in (defaults to a 5 minute timeout). The resulting session cookies are cached to `~/.booth-pm-sdk/session.json` (override with `cachePath`, written with `0600` permissions), so **subsequent calls reuse the cached session and return immediately without opening a browser**. Pass `forceRelogin: true` to bypass the cache and log in again regardless.
- `booth.disconnect()`: clears the cached session and reverts to whatever `cookies` the instance was constructed with (none by default). The SDK keeps working for all public resources afterward.
- The standalone `login()`/`disconnect()` functions (`import { login, disconnect } from 'booth-pm-sdk'`) use the same cache and are available if you'd rather manage cookies yourself.

# API Reference

## Authentication

- `login(options?)`: logs in with pixiv (opens a browser only the first time; reuses the cached session afterward). See the "Login (optional)" section above.
- `disconnect()`: clears the cached session and reverts to the default cookie state.

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

## Known limitations

This SDK scrapes Booth.pm's public HTML, so it can break whenever the site changes its markup.

- `listProducts`/`find` throw when they hit the age-verification wall for adult content. That said, the per-item `isAdult` flag on listing/search results (read from a badge in the card markup) could not be verified against real adult content, since unauthenticated requests always hit that wall. For a value you can trust, use the `isAdult` returned by `getProduct` (read directly from Booth's product API) instead.
- `login()` depends on a CSS selector for the button on booth.pm's sign-in page. Like the rest of the scraping logic, it can break if Booth changes that page's markup.

## License

This project is licensed under the MIT license. Please see the LICENSE file for more details.
