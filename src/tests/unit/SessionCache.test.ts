jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn()
  }
}));

import { promises as fs } from 'fs';
import { clearCachedCookies, readCachedCookies, writeCachedCookies } from '../../lib/core/auth/SessionCache';

describe('SessionCache', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('readCachedCookies', () => {
    it('returns the parsed cookies when the cache file exists and is non-empty', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('{"a":"1"}');

      await expect(readCachedCookies('/tmp/session.json')).resolves.toEqual({ a: '1' });
    });

    it('returns null when the cache file does not exist', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(readCachedCookies('/tmp/session.json')).resolves.toBeNull();
    });

    it('returns null when the cached cookies object is empty', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('{}');

      await expect(readCachedCookies('/tmp/session.json')).resolves.toBeNull();
    });
  });

  describe('writeCachedCookies', () => {
    it('creates the parent directory and writes the cookies with restrictive permissions', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await writeCachedCookies({ a: '1' }, '/tmp/booth-cache/session.json');

      expect(fs.mkdir).toHaveBeenCalledWith('/tmp/booth-cache', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith('/tmp/booth-cache/session.json', '{"a":"1"}', { mode: 0o600 });
    });
  });

  describe('clearCachedCookies', () => {
    it('deletes the cache file', async () => {
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await clearCachedCookies('/tmp/session.json');

      expect(fs.unlink).toHaveBeenCalledWith('/tmp/session.json');
    });

    it('does not throw when the cache file does not exist', async () => {
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(clearCachedCookies('/tmp/session.json')).resolves.toBeUndefined();
    });
  });
});
