import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

export const DEFAULT_SESSION_CACHE_PATH = path.join(os.homedir(), '.booth-pm-sdk', 'session.json');

export async function readCachedCookies (cachePath: string = DEFAULT_SESSION_CACHE_PATH): Promise<Record<string, string> | null> {
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    const cookies = JSON.parse(raw);
    return Object.keys(cookies).length > 0 ? cookies : null;
  } catch {
    return null;
  }
}

export async function writeCachedCookies (cookies: Record<string, string>, cachePath: string = DEFAULT_SESSION_CACHE_PATH): Promise<void> {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(cookies), { mode: 0o600 });
}

export async function clearCachedCookies (cachePath: string = DEFAULT_SESSION_CACHE_PATH): Promise<void> {
  try {
    await fs.unlink(cachePath);
  } catch {
    // Nothing cached, nothing to do.
  }
}
