import type { Browser, Page } from 'puppeteer';
import { readCachedCookies, writeCachedCookies } from './SessionCache';

export interface Credentials {
  email: string;
  password: string;
}

export interface LoginWithCredentialsOptions {
  /** Skip the cached session (if any) and force a fresh automated login. */
  forceRelogin?: boolean;
  /** Where the session cookies are cached on disk. Shares the same default as `login()`. */
  cachePath?: string;
  /** Milliseconds to wait for the login to complete before giving up. Defaults to 30 seconds. */
  timeoutMs?: number;
  /** Run the automated browser headless. Defaults to true. */
  headless?: boolean;
}

const SIGN_IN_URL = 'https://booth.pm/users/sign_in';
const PIXIV_OAUTH_BUTTON_SELECTOR = 'form[action="/users/auth/pixiv"] input[type="submit"]';
const EMAIL_INPUT_SELECTOR = 'input[type="text"][autocomplete*="username"]';
const PASSWORD_INPUT_SELECTOR = 'input[type="password"][autocomplete*="current-password"]';
const CAPTCHA_SELECTORS = ['iframe[src*="recaptcha"]', 'iframe[title*="recaptcha" i]', 'iframe[title*="challenge" i]'];
const DEFAULT_TIMEOUT_MS = 30 * 1000;
const POLL_INTERVAL_MS = 500;

async function loadStealthPuppeteer (): Promise<any> {
  try {
    const [{ default: puppeteerExtra }, { default: StealthPlugin }] = await Promise.all([
      import('puppeteer-extra') as unknown as Promise<{ default: any }>,
      import('puppeteer-extra-plugin-stealth') as unknown as Promise<{ default: any }>
    ]);
    puppeteerExtra.use(StealthPlugin());
    return puppeteerExtra;
  } catch {
    throw new Error(
      'loginWithCredentials() requires the optional "puppeteer", "puppeteer-extra" and ' +
      '"puppeteer-extra-plugin-stealth" dependencies. Install with: ' +
      'npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth'
    );
  }
}

async function hasCaptchaChallenge (page: Page): Promise<boolean> {
  for (const selector of CAPTCHA_SELECTORS) {
    if (await page.$(selector) !== null) {
      return true;
    }
  }
  return false;
}

/**
 * Logs in with pixiv by submitting the given credentials through an
 * automated (stealth-mode) browser, instead of the visible,
 * you-type-it-yourself flow used by `login()`.
 *
 * **This is a materially different, riskier operation than `login()`:**
 * the SDK receives and forwards your plaintext password (only ever in
 * memory - it is never written to disk), and submits it through a
 * stealth-mode automated browser (puppeteer-extra + the stealth plugin)
 * specifically to get past the anti-bot protection (Cloudflare +
 * reCAPTCHA Enterprise, confirmed present) that pixiv puts on its login
 * page. This may violate pixiv's Terms of Service and can get the account
 * flagged or restricted - use `login()` unless you have a specific reason
 * not to.
 *
 * If pixiv responds with a CAPTCHA challenge, this fails with a clear
 * error instead of attempting to solve or bypass it.
 *
 * Requires the optional peer dependencies `puppeteer`, `puppeteer-extra`
 * and `puppeteer-extra-plugin-stealth`.
 */
export async function loginWithCredentials (credentials: Credentials, options: LoginWithCredentialsOptions = {}): Promise<Record<string, string>> {
  if (!options.forceRelogin) {
    const cached = await readCachedCookies(options.cachePath);
    if (cached) {
      return cached;
    }
  }

  const puppeteer = await loadStealthPuppeteer();
  const browser: Browser = await puppeteer.launch({ headless: options.headless ?? true });

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

    await page.waitForSelector(EMAIL_INPUT_SELECTOR, { timeout: 15000 });
    await page.type(EMAIL_INPUT_SELECTOR, credentials.email, { delay: 80 });
    await page.type(PASSWORD_INPUT_SELECTOR, credentials.password, { delay: 80 });
    await page.keyboard.press('Enter');

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (page.url().includes('booth.pm')) {
        break;
      }
      if (await hasCaptchaChallenge(page)) {
        throw new Error(
          'pixiv presented a CAPTCHA challenge. Automated login cannot proceed ' +
          'past it - use login() (visible browser, you log in yourself) instead.'
        );
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    if (!page.url().includes('booth.pm')) {
      throw new Error('Timed out waiting for the login to complete.');
    }

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

    await writeCachedCookies(boothCookies, options.cachePath);
    return boothCookies;
  } finally {
    await browser.close();
  }
}
