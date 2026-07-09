jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

import fs from 'fs';
import WishlistService from '../../lib/domain/services/impl/WishlistService';

describe('WishlistService', () => {
  let service: WishlistService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WishlistService();
  });

  it('getWishlistItems returns an empty array when the local file does not exist', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(service.getWishlistItems()).toEqual([]);
  });

  it('getWishlistItems maps stored entries to { productId, productName }', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([
      { productId: 1, productName: 'Hair Texture', addedAt: '2024-01-01T00:00:00.000Z' }
    ]));

    expect(service.getWishlistItems()).toEqual([{ productId: 1, productName: 'Hair Texture' }]);
  });

  it('addToWishlist appends a new item and persists the whole list', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([
      { productId: 1, productName: 'Existing', addedAt: '2024-01-01T00:00:00.000Z' }
    ]));

    service.addToWishlist(2, 'New Item');

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [path, payload] = (fs.writeFileSync as jest.Mock).mock.calls[0];
    expect(path).toBe('./wishlist.json');
    const saved = JSON.parse(payload as string);
    expect(saved).toHaveLength(2);
    expect(saved[1]).toMatchObject({ productId: 2, productName: 'New Item' });
  });

  it('clearWishlist persists an empty array', () => {
    service.clearWishlist();
    const [, payload] = (fs.writeFileSync as jest.Mock).mock.calls[0];
    expect(JSON.parse(payload as string)).toEqual([]);
  });

  it('removeFromWishlist drops only the matching productId', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([
      { productId: 1, productName: 'Keep', addedAt: '2024-01-01T00:00:00.000Z' },
      { productId: 2, productName: 'Remove', addedAt: '2024-01-01T00:00:00.000Z' }
    ]));

    service.removeFromWishlist(2);

    const [, payload] = (fs.writeFileSync as jest.Mock).mock.calls[0];
    const saved = JSON.parse(payload as string);
    expect(saved).toHaveLength(1);
    expect(saved[0].productId).toBe(1);
  });
});
