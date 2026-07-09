import type { Browser, Page } from 'puppeteer';
import { clearCachedCookies, DEFAULT_SESSION_CACHE_PATH, readCachedCookies, writeCachedCookies } from './SessionCache';

export interface LoginOptions {
  /**
   * Milliseconds to wait for the user to complete the pixiv login before
   * giving up. Defaults to 5 minutes.
   */
  timeoutMs?: number;
  /**
   * Skip the cached session (if any) and force a fresh browser login.
   * Defaults to false.
   */
  forceRelogin?: boolean;
  /**
   * Where the session cookies are cached on disk between calls. Defaults to
   * `~/.booth-pm-sdk/session.json` (outside of any project directory, so it
   * can't accidentally end up committed to source control).
   */
  cachePath?: string;
}

const SIGN_IN_URL = 'https://booth.pm/users/sign_in';
const PIXIV_OAUTH_BUTTON_SELECTOR = 'form[action="/users/auth/pixiv"] input[type="submit"]';
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

async function loadPuppeteer (): Promise<typeof import('puppeteer')> {
  try {
    return (await import('puppeteer')).default as unknown as typeof import('puppeteer');
  } catch {
    throw new Error(
      'login() requires the optional "puppeteer" dependency. Install it with: npm install puppeteer'
    );
  }
}

async function performBrowserLogin (timeoutMs: number): Promise<Record<string, string>> {
  const puppeteer = await loadPuppeteer();
  const browser: Browser = await puppeteer.launch({ headless: false });

  try {
    const page: Page = await browser.newPage();
    await page.goto(SIGN_IN_URL, { waitUntil: 'networkidle2' });

    // Leave booth.pm for pixiv's login page first. Waiting to "come back to
    // booth.pm" without this step would resolve immediately, since we
    // start out on booth.pm already.
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click(PIXIV_OAUTH_BUTTON_SELECTOR)
    ]);

    // The user completes the pixiv login (credentials, 2FA, any anti-bot
    // challenge) themselves in the visible window. Wait for the OAuth
    // callback to land back on booth.pm.
    await page.waitForFunction(
      () => window.location.hostname.endsWith('booth.pm'),
      { timeout: timeoutMs }
    );

    const cookies = await page.cookies();
    const boothCookies: Record<string, string> = {};
    for (const cookie of cookies) {
      if (cookie.domain.replace(/^\./, '').endsWith('booth.pm')) {
        boothCookies[cookie.name] = cookie.value;
      }
    }

    if (Object.keys(boothCookies).length === 0) {
      throw new Error('Login did not produce any booth.pm session cookies.');
    }

    return boothCookies;
  } finally {
    await browser.close();
  }
}

/**
 * Returns a booth.pm session, logging in with pixiv only when necessary.
 *
 * On the first call, this opens a visible browser window on Booth's sign-in
 * page and lets the user log in with their own pixiv account (credentials,
 * 2FA, any anti-bot challenge are all handled by the user in the real
 * browser - this SDK never sees or stores a password). The resulting
 * session cookies are cached to disk (see `cachePath`), so subsequent calls
 * reuse them without opening a browser again. Pass `forceRelogin: true` to
 * bypass the cache and log in again regardless.
 */
export async function login (options: LoginOptions = {}): Promise<Record<string, string>> {
  if (!options.forceRelogin) {
    const cached = await readCachedCookies(options.cachePath);
    if (cached) {
      return cached;
    }
  }

  const cookies = await performBrowserLogin(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  await writeCachedCookies(cookies, options.cachePath);
  return cookies;
}

/**
 * Clears the cached session cookies written by `login()`. After this, the
 * next `login()` call will open the browser again.
 */
export async function disconnect (cachePath: string = DEFAULT_SESSION_CACHE_PATH): Promise<void> {
  await clearCachedCookies(cachePath);
}
