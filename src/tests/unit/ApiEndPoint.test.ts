import ApiEndpoints from '../../lib/core/api/ApiEndPoint';
import { AgeRestriction, ListFilter, ProductCategory } from '../../lib/utils/Utils';

describe('ApiEndpoints.products.listProducts', () => {
  it('defaults to the "items" listing sorted by popularity', () => {
    const url = ApiEndpoints.products.listProducts();
    expect(url).toBe('items?page=1&sort=popularity');
  });

  it('switches to a category browse URL when a category other than ALL is given', () => {
    const url = ApiEndpoints.products.listProducts(2, { category: ProductCategory.MODELS_3D, sortBy: ListFilter.NEW });
    expect(url).toBe(`browse/${encodeURIComponent('3D Models')}?page=2&sort=new`);
  });

  it('ignores the category segment when ProductCategory.ALL is given', () => {
    const url = ApiEndpoints.products.listProducts(1, { category: ProductCategory.ALL, sortBy: ListFilter.LOVES });
    expect(url).toBe('items?page=1&sort=wish_lists');
  });

  it('appends adult and max_price query params when requested', () => {
    const url = ApiEndpoints.products.listProducts(1, {
      sortBy: ListFilter.POPULARITY,
      ageRestriction: AgeRestriction.WITH_ADULT_CONTENT,
      onlyFreeProducts: true
    });
    expect(url).toBe('items?page=1&sort=popularity&adult=include&max_price=0');
  });
});

describe('ApiEndpoints.products.search', () => {
  it('builds a plain search URL with the term in the path when no category is set', () => {
    const url = ApiEndpoints.products.search('vroid hair');
    expect(url).toBe('search/vroid hair?sort=popularity');
  });

  it('builds a category browse URL with the term as a query param when a category is set', () => {
    const url = ApiEndpoints.products.search('hair', { category: ProductCategory.MODELS_3D, sortBy: ListFilter.NEW });
    expect(url).toBe(`browse/${encodeURIComponent('3D Models')}?sort=new&q=hair`);
  });

  it('applies onlyFreeProducts and ageRestriction filters', () => {
    const url = ApiEndpoints.products.search('hair', {
      sortBy: ListFilter.POPULARITY,
      onlyFreeProducts: true,
      ageRestriction: AgeRestriction.ADULT_ONLY
    });
    expect(url).toBe('search/hair?sort=popularity&max_price=0&adult=only');
  });
});

describe('ApiEndpoints.products misc endpoints', () => {
  it('builds a wishLists URL with repeated item_ids[] params', () => {
    const url = ApiEndpoints.products.wishLists([1, 2, 3]);
    expect(url).toBe('https://accounts.booth.pm/wish_lists.json?item_ids%5B%5D=1&item_ids%5B%5D=2&item_ids%5B%5D=3');
  });

  it('builds an autocomplete suggestion URL with the term URL-encoded', () => {
    const url = ApiEndpoints.products.autoCompleteSuggestion('vroid hair');
    expect(url).toBe('https://booth.pm/autocomplete/tag.json?term=vroid%20hair');
  });

  it('builds a getById URL from the item id', () => {
    expect(ApiEndpoints.products.getById(12345)).toBe('items/12345');
  });

  it('save() passes the given URL through unchanged', () => {
    expect(ApiEndpoints.products.save('https://booth.pm/downloadables/1')).toBe('https://booth.pm/downloadables/1');
  });
});
