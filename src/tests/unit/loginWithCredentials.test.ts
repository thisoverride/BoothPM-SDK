import { EventEmitter } from 'events';

interface FakeChild extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: { write: jest.Mock; end: jest.Mock };
}

function makeFakeChild (): { child: FakeChild; stdinWrite: jest.Mock } {
  const child = new EventEmitter() as FakeChild;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const stdinWrite = jest.fn();
  child.stdin = { write: stdinWrite, end: jest.fn() };
  return { child, stdinWrite };
}

/**
 * Builds a `spawn` mock that returns `child` synchronously (as the real
 * child_process.spawn does) but only fires the given events on the next
 * tick - after loginWithCredentials() has finished synchronously
 * attaching its listeners, mirroring how a real subprocess would never
 * emit before the caller has had a chance to listen.
 */
function spawnReturning (child: FakeChild, fireEvents: () => void): jest.Mock {
  return jest.fn().mockImplementation(() => {
    setImmediate(fireEvents);
    return child;
  });
}

interface Rig {
  loginWithCredentials: typeof import('../../lib/core/auth/loginWithCredentials').loginWithCredentials;
  sessionCache: typeof import('../../lib/core/auth/SessionCache');
  spawn: jest.Mock;
}

/**
 * Freshly resolves SessionCache and loginWithCredentials together (after a
 * module registry reset), so both refer to the same mock instances - see
 * the analogous helper in login.test.ts for why a plain top-level import
 * would go stale after jest.resetModules().
 */
async function setup (spawn: jest.Mock): Promise<Rig> {
  jest.resetModules();

  jest.doMock('child_process', () => ({ spawn }));
  jest.doMock('../../lib/core/auth/SessionCache', () => ({
    DEFAULT_SESSION_CACHE_PATH: '/fake/home/.booth-pm-sdk/session.json',
    readCachedCookies: jest.fn().mockResolvedValue(null),
    writeCachedCookies: jest.fn().mockResolvedValue(undefined),
    clearCachedCookies: jest.fn().mockResolvedValue(undefined)
  }));

  const sessionCache = await import('../../lib/core/auth/SessionCache');
  const mod = await import('../../lib/core/auth/loginWithCredentials');

  return { loginWithCredentials: mod.loginWithCredentials, sessionCache, spawn };
}

describe('loginWithCredentials()', () => {
  afterEach(() => {
    jest.dontMock('child_process');
    jest.dontMock('../../lib/core/auth/SessionCache');
  });

  it('returns the cached session without spawning python when one exists', async () => {
    const spawn = jest.fn();
    const { loginWithCredentials, sessionCache } = await setup(spawn);
    (sessionCache.readCachedCookies as jest.Mock).mockResolvedValue({ _plaza_session: 'cached' });

    const result = await loginWithCredentials({ email: 'a@b.com', password: 'x' });

    expect(result).toEqual({ _plaza_session: 'cached' });
    expect(spawn).not.toHaveBeenCalled();
  });

  it('sends credentials over stdin (never as argv) and resolves with the printed cookies', async () => {
    const { child, stdinWrite } = makeFakeChild();
    const spawn = spawnReturning(child, () => {
      child.stdout.emit('data', Buffer.from('{"_plaza_session":"abc"}\n'));
      child.emit('close', 0);
    });
    const { loginWithCredentials, sessionCache } = await setup(spawn);

    const result = await loginWithCredentials({ email: 'a@b.com', password: 'secret' });

    for (const arg of spawn.mock.calls[0]) {
      expect(JSON.stringify(arg)).not.toContain('secret');
    }
    expect(stdinWrite).toHaveBeenCalledWith(JSON.stringify({ email: 'a@b.com', password: 'secret' }) + '\n');
    expect(result).toEqual({ _plaza_session: 'abc' });
    expect(sessionCache.writeCachedCookies).toHaveBeenCalledWith({ _plaza_session: 'abc' }, undefined);
  });

  it('rejects with the script-reported error (e.g. CAPTCHA detected) without retrying to solve it', async () => {
    const { child } = makeFakeChild();
    const spawn = spawnReturning(child, () => {
      child.stdout.emit('data', Buffer.from('{"error":"pixiv presented a CAPTCHA challenge."}\n'));
      child.emit('close', 1);
    });
    const { loginWithCredentials } = await setup(spawn);

    await expect(loginWithCredentials({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrow('pixiv presented a CAPTCHA challenge.');
  });

  it('gives an actionable error when the seleniumbase Python package is missing', async () => {
    const { child } = makeFakeChild();
    const spawn = spawnReturning(child, () => {
      child.stderr.emit('data', Buffer.from('ModuleNotFoundError: No module named \'seleniumbase\'\n'));
      child.emit('close', 1);
    });
    const { loginWithCredentials } = await setup(spawn);

    await expect(loginWithCredentials({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrow('pip install seleniumbase');
  });

  it('gives an actionable error when python3 itself cannot be spawned', async () => {
    const { child } = makeFakeChild();
    const spawn = spawnReturning(child, () => {
      child.emit('error', new Error('spawn python3 ENOENT'));
    });
    const { loginWithCredentials } = await setup(spawn);

    await expect(loginWithCredentials({ email: 'a@b.com', password: 'x' }))
      .rejects.toThrow('requires Python 3 and SeleniumBase installed');
  });

  it('ignores the cache and spawns python when forceRelogin is set', async () => {
    const { child } = makeFakeChild();
    const spawn = spawnReturning(child, () => {
      child.stdout.emit('data', Buffer.from('{"_plaza_session":"fresh"}\n'));
      child.emit('close', 0);
    });
    const { loginWithCredentials, sessionCache } = await setup(spawn);
    (sessionCache.readCachedCookies as jest.Mock).mockResolvedValue({ _plaza_session: 'cached' });

    const result = await loginWithCredentials({ email: 'a@b.com', password: 'x' }, { forceRelogin: true });

    expect(spawn).toHaveBeenCalled();
    expect(result).toEqual({ _plaza_session: 'fresh' });
  });
});
