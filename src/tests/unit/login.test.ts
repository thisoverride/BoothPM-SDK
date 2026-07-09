export {};

function makeCookie (name: string, value: string, domain: string): { name: string; value: string; domain: string } {
  return { name, value, domain };
}

function makePage (overrides: Record<string, jest.Mock> = {}): Record<string, jest.Mock> {
  return {
    goto: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
    waitForNavigation: jest.fn().mockResolvedValue(undefined),
    waitForFunction: jest.fn().mockResolvedValue(undefined),
    cookies: jest.fn().mockResolvedValue([]),
    ...overrides
  };
}

interface Rig {
  login: typeof import('../../lib/core/auth/login').login;
  disconnect: typeof import('../../lib/core/auth/login').disconnect;
  sessionCache: typeof import('../../lib/core/auth/SessionCache');
  launch: jest.Mock;
  close: jest.Mock;
}

/**
 * Freshly resolves the SessionCache mock and the login module together
 * (after a module registry reset), so both refer to the same mock
 * instances - a plain top-level `import` would go stale after
 * `jest.resetModules()`, since `login.ts` re-requires SessionCache from
 * scratch on the next dynamic import.
 */
async function setup (page: Record<string, jest.Mock>, puppeteerFactory?: () => unknown): Promise<Rig> {
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
  jest.doMock('puppeteer', puppeteerFactory ?? (() => ({ __esModule: true, default: { launch } })), { virtual: true });

  const sessionCache = await import('../../lib/core/auth/SessionCache');
  const authLogin = await import('../../lib/core/auth/login');

  return { login: authLogin.login, disconnect: authLogin.disconnect, sessionCache, launch, close };
}

describe('login()', () => {
  afterEach(() => {
    jest.dontMock('puppeteer');
    jest.dontMock('../../lib/core/auth/SessionCache');
  });

  it('returns the cached session without opening a browser when one exists', async () => {
    const { login, sessionCache, launch } = await setup(makePage());
    (sessionCache.readCachedCookies as jest.Mock).mockResolvedValue({ _plaza_session: 'cached' });

    const result = await login();

    expect(result).toEqual({ _plaza_session: 'cached' });
    expect(launch).not.toHaveBeenCalled();
  });

  it('ignores the cache and opens a browser when forceRelogin is set', async () => {
    const page = makePage({ cookies: jest.fn().mockResolvedValue([makeCookie('_plaza_session', 'fresh', '.booth.pm')]) });
    const { login, sessionCache, launch } = await setup(page);
    (sessionCache.readCachedCookies as jest.Mock).mockResolvedValue({ _plaza_session: 'cached' });

    const result = await login({ forceRelogin: true });

    expect(launch).toHaveBeenCalled();
    expect(result).toEqual({ _plaza_session: 'fresh' });
  });

  it('throws a friendly error when puppeteer is not installed', async () => {
    const { login } = await setup(makePage(), () => {
      throw new Error("Cannot find module 'puppeteer'");
    });

    await expect(login()).rejects.toThrow('npm install puppeteer');
  });

  it('opens a visible (non-headless) browser, navigates away to pixiv before waiting to come back, caches and returns only booth.pm cookies', async () => {
    const callOrder: string[] = [];
    const page = makePage({
      waitForNavigation: jest.fn().mockImplementation(async () => { callOrder.push('waitForNavigation'); }),
      waitForFunction: jest.fn().mockImplementation(async () => { callOrder.push('waitForFunction'); }),
      cookies: jest.fn().mockResolvedValue([
        makeCookie('_plaza_session', 'abc', '.booth.pm'),
        makeCookie('unrelated', 'xyz', '.some-other-site.com')
      ])
    });
    const { login, sessionCache, launch, close } = await setup(page);

    const result = await login();

    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ headless: false }));
    expect(page.goto).toHaveBeenCalledWith('https://booth.pm/users/sign_in', expect.anything());
    expect(page.click).toHaveBeenCalledWith('form[action="/users/auth/pixiv"] input[type="submit"]');
    // Regression: must wait to leave booth.pm (navigate to pixiv) BEFORE
    // waiting to come back, otherwise waitForFunction resolves instantly
    // since the page starts out on booth.pm already.
    expect(callOrder).toEqual(['waitForNavigation', 'waitForFunction']);
    expect(result).toEqual({ _plaza_session: 'abc' });
    expect(sessionCache.writeCachedCookies).toHaveBeenCalledWith({ _plaza_session: 'abc' }, undefined);
    expect(close).toHaveBeenCalled();
  });

  it('closes the browser even when the login flow throws', async () => {
    const page = makePage({ click: jest.fn().mockRejectedValue(new Error('no such button')) });
    const { login, close } = await setup(page);

    await expect(login()).rejects.toThrow('no such button');
    expect(close).toHaveBeenCalled();
  });

  it('throws when the login completes but no booth.pm cookies were produced', async () => {
    const page = makePage({ cookies: jest.fn().mockResolvedValue([makeCookie('unrelated', 'xyz', '.some-other-site.com')]) });
    const { login, close } = await setup(page);

    await expect(login()).rejects.toThrow('Login did not produce any booth.pm session cookies.');
    expect(close).toHaveBeenCalled();
  });

  it('forwards a custom timeoutMs to waitForFunction', async () => {
    const page = makePage({ cookies: jest.fn().mockResolvedValue([makeCookie('s', 'v', 'booth.pm')]) });
    const { login } = await setup(page);

    await login({ timeoutMs: 1234 });

    expect(page.waitForFunction).toHaveBeenCalledWith(expect.any(Function), { timeout: 1234 });
  });
});

describe('disconnect()', () => {
  afterEach(() => {
    jest.dontMock('puppeteer');
    jest.dontMock('../../lib/core/auth/SessionCache');
  });

  it('clears the cached session', async () => {
    const { disconnect, sessionCache } = await setup(makePage());

    await disconnect();

    expect(sessionCache.clearCachedCookies).toHaveBeenCalledWith(sessionCache.DEFAULT_SESSION_CACHE_PATH);
  });
});
