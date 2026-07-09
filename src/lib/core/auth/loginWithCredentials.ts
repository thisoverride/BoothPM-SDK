import { spawn } from 'child_process';
import path from 'path';
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
  /** Path to the `python3` executable. Defaults to "python3". */
  pythonExecutable?: string;
}

const SCRIPT_PATH = path.join(__dirname, 'pixiv_login.py');

/**
 * Logs in with pixiv by submitting the given credentials through an
 * automated (SeleniumBase-driven) browser, instead of the visible,
 * you-type-it-yourself flow used by `login()`.
 *
 * **This is a materially different, riskier operation than `login()`:**
 * the SDK receives and forwards your plaintext password (only ever in
 * memory and over the subprocess's stdin - it is never written to disk
 * or passed as a command-line argument), and submits it through a
 * stealth-mode automated browser specifically to get past the
 * anti-bot protection (Cloudflare + reCAPTCHA Enterprise, confirmed
 * present) that pixiv puts on its login page. This may violate pixiv's
 * Terms of Service and can get the account flagged or restricted - use
 * `login()` unless you have a specific reason not to.
 *
 * If pixiv responds with a CAPTCHA challenge, this fails with a clear
 * error instead of attempting to solve or bypass it.
 *
 * Requires Python 3 and SeleniumBase installed separately:
 * `pip install seleniumbase`
 */
export async function loginWithCredentials (credentials: Credentials, options: LoginWithCredentialsOptions = {}): Promise<Record<string, string>> {
  if (!options.forceRelogin) {
    const cached = await readCachedCookies(options.cachePath);
    if (cached) {
      return cached;
    }
  }

  const cookies = await runPixivLoginScript(credentials, options.pythonExecutable ?? 'python3');
  await writeCachedCookies(cookies, options.cachePath);
  return cookies;
}

async function runPixivLoginScript (credentials: Credentials, pythonExecutable: string): Promise<Record<string, string>> {
  return await new Promise((resolve, reject) => {
    const child = spawn(pythonExecutable, [SCRIPT_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('error', (error) => {
      reject(new Error(
        `loginWithCredentials() requires Python 3 and SeleniumBase installed. ` +
        `Install with: pip install seleniumbase (original error: ${error.message})`
      ));
    });

    child.on('close', (code) => {
      if (/ModuleNotFoundError.*seleniumbase/i.test(stderr)) {
        reject(new Error('loginWithCredentials() requires the "seleniumbase" Python package. Install with: pip install seleniumbase'));
        return;
      }

      const lastLine = stdout.trim().split('\n').pop() ?? '';
      let parsed: any;
      try {
        parsed = JSON.parse(lastLine);
      } catch {
        reject(new Error(`pixiv_login.py produced unexpected output (exit code ${String(code)}): ${stderr || stdout}`));
        return;
      }

      if (parsed.error) {
        reject(new Error(parsed.error as string));
        return;
      }

      resolve(parsed as Record<string, string>);
    });

    child.stdin.write(JSON.stringify(credentials) + '\n');
    child.stdin.end();
  });
}
