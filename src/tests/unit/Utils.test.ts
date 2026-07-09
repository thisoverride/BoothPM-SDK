import { AgeRestriction, ListFilter, ProductCategory } from '../../lib/utils/Utils';

describe('Utils enums', () => {
  it('exposes the expected ListFilter values', () => {
    expect(ListFilter.NEW).toBe('new');
    expect(ListFilter.POPULARITY).toBe('popularity');
    expect(ListFilter.LOVES).toBe('wish_lists');
  });

  it('exposes the expected AgeRestriction values', () => {
    expect(AgeRestriction.WITH_ADULT_CONTENT).toBe('include');
    expect(AgeRestriction.ADULT_ONLY).toBe('only');
  });

  it('exposes ProductCategory.ALL used as the "no filter" sentinel', () => {
    expect(ProductCategory.ALL).toBe('All');
  });

  it('has no duplicate values across ProductCategory', () => {
    const values = Object.values(ProductCategory);
    expect(new Set(values).size).toBe(values.length);
  });
});
