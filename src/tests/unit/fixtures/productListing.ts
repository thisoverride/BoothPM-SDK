export function buildListingHtml (items: Array<{
  id: number;
  brand: string;
  category: number;
  price: number;
  name: string;
  imageURL: string;
  shopName: string;
  shopURL: string;
  shopImageURL: string;
  isAdult?: boolean;
}>, opts: { resultsCount?: number; totalArticles?: number; ageBlocked?: boolean } = {}): string {
  const ageBlock = opts.ageBlocked === true
    ? '<div id="age-confirmation"><p class="u-tpg-title1 u-m-0">Adult content confirmation</p></div>'
    : '';

  const resultsBlock = opts.resultsCount !== undefined
    ? `<div class="u-d-flex u-align-items-center u-pb-300 u-tpg-body2 u-justify-content-between"><b>${opts.resultsCount}</b> items found</div>`
    : '';

  const totalArticlesBlock = opts.totalArticles !== undefined
    ? `<div class="container"><b>${opts.totalArticles}</b> results</div>`
    : '';

  const cards = items.map(item => `
    <li data-product-id="${item.id}" data-product-brand="${item.brand}" data-product-category="${item.category}" data-product-price="${item.price}">
      <a class="item-card__title-anchor--multiline">${item.name}</a>
      <img class="js-thumbnail-image" data-original="${item.imageURL}" />
      <div class="item-card__shop-info">
        <a class="item-card__shop-name-anchor" href="${item.shopURL}">
          <span class="item-card__shop-name">${item.shopName}</span>
        </a>
        <img class="user-avatar" src="${item.shopImageURL}" />
      </div>
      ${item.isAdult === true ? '<span class="badge adult">R18</span>' : ''}
    </li>
  `).join('\n');

  return `
    <html>
      <body>
        ${ageBlock}
        ${resultsBlock}
        ${totalArticlesBlock}
        <ul class="l-cards-5cols">
          ${cards}
        </ul>
      </body>
    </html>
  `;
}
