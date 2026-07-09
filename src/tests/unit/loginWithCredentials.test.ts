export {};

function makeCookie (name: string, value: string, domain: string): { name: string; value: string; domain: string } {
  return { name, value, domain };
}

function makePage (overrides: Record<string, any> = {}): Record<string, any> {
  return {
    goto: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
    waitForNavigation: jest.fn().mockResolvedValue(undefined),
    waitForSelector: jest.fn().mockResolvedValue(undefined),
    type: jest.fn().mockResolvedValue(undefined),
    keyboard: { press: jest.fn().mockResolvedValue(undefined) },
    url: jest.fn().mockReturnValue('https://booth.pm/users/auth/pixiv/callback'),
    $: jest.fn().mockResolvedValue(null),
    cookies: jest.fn().mockResolvedValue([]),
    ...overrides
  };
}

interface CredentialsTestRig {
  loginWithCredentials: typeof import('../../lib/core/auth/loginWithCredentials').loginWithCredentials;
  sessionCache: typeof import('../../lib/core/auth/SessionCache');
  launch: jest.Mock;
  close: jest.Mock;
  use: jest.Mock;
}

/**
 * Freshly resolves SessionCache and loginWithCredentials together (after a
 * module registry reset), so both refer to the same mock instances - see
 * the analogous helper in login.test.ts for why a plain top-level import
 * would go stale after jest.resetModules().
 */
async function setup (page: Record<string, any>, extraFactory?: () => unknown): Promise<CredentialsTestRig> {
  jest.resetModules();

  jest.doMock('../../lib/core/auth/SessionCache', () => ({
    DEFAULT_SESSION_CACHE_PATH: '/fake/home/.booth-pm-sdk/session.json',
    readCachedCookies: jest.fn().mockResolvedValue(null),
    writeCachedCookies: jest.fn().mockResolvedValue(undefined),
    clearCachedCookies: jest.fn().mockResolvedValue(undefined)
  }));

  const close = jest.fn().mockResolvedValue(undefined);
  const newPage = jest.fn().mockResolvedValue(page);
  const launch = jest.fn().mockResolvedValue({ newPage, close });
  const use = jest.fn();

  jest.doMock('puppeteer-extra', () => ({ __esModule: true, default: { launch, use } }), { virtual: true });
  jest.doMock('puppeteer-extra-plugin-stealth', () => ({ __esModule: true, default: extraFactory ?? (() => ({})) }), { virtual: true });

  const sessionCache = await import('../../lib/core/auth/SessionCache');
  const mod = await import('../../lib/core/auth/loginWithCredentials');

  return { loginWithCredentials: mod.loginWithCredentials, sessionCache, launch, close, use };
}

describe('loginWithCredentials()', () => {
  afterEach(() => {
    jest.dontMock('puppeteer-extra');
    jest.dontMock('puppeteer-extra-plugin-stealth');
    jest.dontMock('../../lib/core/auth/SessionCache');
  });

  it('returns the cached session without launching a browser when one exists', async () => {
    const { loginWithCredentials, sessionCache, launch } = await setup(makePage());
    (sessionCache.readCachedCookies as jest.Mock).mockResolvedValue({ _plaza_session: 'cached' });

    const result = await loginWithCredentials({ email: 'a@b.com', password: 'x' });

    expect(result).toEqual({ _plaza_session: 'cached' });
    expect(launch).not.toHaveBeenCalled();
  });

  it('applies the stealth plugin, runs headless by default, types the credentials and caches the resulting booth.pm cookies', async () => {
    const page = makePage({
      cookies: jest.fn().mockResolvedValue([
        makeCookie('_plaza_session', 'abc', '.booth.pm'),
        makeCookie('unrelated', 'xyz', '.some-other-site.com')
      ])
    });
    const { loginWithCredentials, sessionCache, launch, use } = await setup(page);

    const result = await loginWithCredentials({ email: 'a@b.com', password: 'secret' });

    expect(use).toHaveBeenCalled();
    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ headless: true }));
    expect(page.goto).toHaveBeenCalledWith('https://booth.pm/users/sign_in', expect.anything());
    expect(page.click).toHaveBeenCalledWith('form[action="/users/auth/pixiv"] input[type="submit"]');
    expect(page.type).toHaveBeenCalledWith(expect.stringContaining('username'), 'a@b.com', expect.anything());
    expect(page.type).toHaveBeenCalledWith(expect.stringContaining('current-password'), 'secret', expect.anything());
    expect(result).toEqual({ _plaza_session: 'abc' });
    expect(sessionCache.writeCachedCookies).toHaveBeenCalledWith({ _plaza_session: 'abc' }, undefined);
  });

  it('respects headless: false when explicitly requested', async () => {
    const page = makePage({ cookies: jest.fn().mockResolvedValue([makeCookie('s', 'v', 'booth.pm')]) });
    const { loginWithCredentials, launch } = await setup(page);

    await loginWithCredentials({ email: 'a@b.com', password: 'x' }, { headless: false });

    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ headless: false }));
  });

  it('rejects with a clear error and does not attempt to solve a detected CAPTCHA', async () => {
    const page = makePage({
      url: jest.fn().mockReturnValue('https://accounts.pixiv.net/login'),
      $: jest.fn().mockResolvedValue({})
    });
    const { loginWithCredentials, close } = await setup(page);

    await expect(loginWithCredentials({ email: 'a@b.com', password: 'x' }, { timeoutMs: 2000 }))
      .rejects.toThrow('pixiv presented a CAPTCHA challenge');
    expect(close).toHaveBeenCalled();
  });

  it('rejects when the login never reaches booth.pm and no CAPTCHA was detected', async () => {
    const page = makePage({ url: jest.fn().mockReturnValue('https://accounts.pixiv.net/login') });
    const { loginWithCredentials, close } = await setup(page);

    await expect(loginWithCredentials({ email: 'a@b.com', password: 'x' }, { timeoutMs: 1000 }))
      .rejects.toThrow('Timed out waiting for the login to complete.');
    expect(close).toHaveBeenCalled();
  });

  it('rejects when the login completes but no booth.pm cookies were produced', async () => {
    const page = makePage({ cookies: jest.fn().mockResolvedValue([makeCookie('unrelated', 'xyz', '.some-other-site.com')]) });
    const { loginWithCredentials, close } = await setup(page);

    await expect(loginWithCredentials({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrow('Login did not produce any booth.pm session cookies.');
    expect(close).toHaveBeenCalled();
  });

  it('closes the browser even when a step throws', async () => {
    const page = makePage({ click: jest.fn().mockRejectedValue(new Error('no such button')) });
    const { loginWithCredentials, close } = await setup(page);

    await expect(loginWithCredentials({ email: 'a@b.com', password: 'x' })).rejects.toThrow('no such button');
    expect(close).toHaveBeenCalled();
  });

  it('gives an actionable error when puppeteer-extra is not installed', async () => {
    jest.resetModules();
    jest.doMock('../../lib/core/auth/SessionCache', () => ({
      DEFAULT_SESSION_CACHE_PATH: '/fake/home/.booth-pm-sdk/session.json',
      readCachedCookies: jest.fn().mockResolvedValue(null),
      writeCachedCookies: jest.fn().mockResolvedValue(undefined),
      clearCachedCookies: jest.fn().mockResolvedValue(undefined)
    }));
    jest.doMock('puppeteer-extra', () => {
      throw new Error("Cannot find module 'puppeteer-extra'");
    }, { virtual: true });

    const { loginWithCredentials } = await import('../../lib/core/auth/loginWithCredentials');

    await expect(loginWithCredentials({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrow('npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth');
  });

  it('ignores the cache and logs in again when forceRelogin is set', async () => {
    const page = makePage({ cookies: jest.fn().mockResolvedValue([makeCookie('_plaza_session', 'fresh', '.booth.pm')]) });
    const { loginWithCredentials, sessionCache, launch } = await setup(page);
    (sessionCache.readCachedCookies as jest.Mock).mockResolvedValue({ _plaza_session: 'cached' });

    const result = await loginWithCredentials({ email: 'a@b.com', password: 'x' }, { forceRelogin: true });

    expect(launch).toHaveBeenCalled();
    expect(result).toEqual({ _plaza_session: 'fresh' });
  });
});
