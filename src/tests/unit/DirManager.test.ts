jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    rm: jest.fn(),
    unlink: jest.fn()
  }
}));

import { promises as fs } from 'fs';
import DirManager from '../../lib/utils/DirManager';

describe('DirManager', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('folderExists returns true when fs.access resolves', async () => {
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    await expect(DirManager.folderExists('./downloads')).resolves.toBe(true);
  });

  it('folderExists returns false when fs.access rejects', async () => {
    (fs.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));
    await expect(DirManager.folderExists('./missing')).resolves.toBe(false);
  });

  it('readfile returns the file contents on success', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('hello');
    await expect(DirManager.readfile('./file.txt')).resolves.toBe('hello');
  });

  it('readfile returns null on failure', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('boom'));
    await expect(DirManager.readfile('./missing.txt')).resolves.toBeNull();
  });

  it('writeFile returns true on success and forwards args', async () => {
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    await expect(DirManager.writeFile('./file.txt', 'data')).resolves.toBe(true);
    expect(fs.writeFile).toHaveBeenCalledWith('./file.txt', 'data', 'utf8');
  });

  it('writeFile returns false on failure', async () => {
    (fs.writeFile as jest.Mock).mockRejectedValue(new Error('boom'));
    await expect(DirManager.writeFile('./file.txt', 'data')).resolves.toBe(false);
  });

  it('createDir returns true on success and creates recursively', async () => {
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    await expect(DirManager.createDir('./downloads')).resolves.toBe(true);
    expect(fs.mkdir).toHaveBeenCalledWith('./downloads', { recursive: true });
  });

  it('createDir returns false on failure', async () => {
    (fs.mkdir as jest.Mock).mockRejectedValue(new Error('boom'));
    await expect(DirManager.createDir('./downloads')).resolves.toBe(false);
  });

  it('deleteDir returns true on success', async () => {
    (fs.rm as jest.Mock).mockResolvedValue(undefined);
    await expect(DirManager.deleteDir('./downloads')).resolves.toBe(true);
    expect(fs.rm).toHaveBeenCalledWith('./downloads', { recursive: true, force: true });
  });

  it('deleteDir returns false on failure', async () => {
    (fs.rm as jest.Mock).mockRejectedValue(new Error('boom'));
    await expect(DirManager.deleteDir('./downloads')).resolves.toBe(false);
  });

  it('deleteFile returns true on success', async () => {
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    await expect(DirManager.deleteFile('./file.txt')).resolves.toBe(true);
  });

  it('deleteFile returns false on failure', async () => {
    (fs.unlink as jest.Mock).mockRejectedValue(new Error('boom'));
    await expect(DirManager.deleteFile('./file.txt')).resolves.toBe(false);
  });
});
