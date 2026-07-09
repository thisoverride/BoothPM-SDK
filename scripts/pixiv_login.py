#!/usr/bin/env python3
"""
Automates a pixiv login (via booth.pm's "sign in with pixiv" button) using
SeleniumBase, and prints the resulting booth.pm session cookies as JSON on
stdout.

Credentials are read from stdin as a single JSON line: {"email": "...",
"password": "..."}. They are never written to disk and never passed as
command-line arguments (which would be visible to other processes on the
same machine via the process list).

This performs an automated credential submission, which pixiv's anti-bot
protection (Cloudflare + reCAPTCHA Enterprise, confirmed present on the
login page) is specifically designed to detect. If a CAPTCHA challenge or
an error is detected after submitting, this script fails loudly rather
than attempting to solve or bypass it. Automating login this way may
violate pixiv's Terms of Service and can result in the account being
flagged or restricted - this is the caller's decision and risk to take,
not something this script tries to hide.

Requires: pip install seleniumbase
"""
import json
import random
import sys
import time

SIGN_IN_URL = "https://booth.pm/users/sign_in"
PIXIV_OAUTH_BUTTON = 'form[action="/users/auth/pixiv"] input[type="submit"]'
EMAIL_INPUT = 'input[type="text"][autocomplete*="username"]'
PASSWORD_INPUT = 'input[type="password"][autocomplete*="current-password"]'
CAPTCHA_INDICATORS = [
    'iframe[src*="recaptcha"]',
    'iframe[title*="recaptcha" i]',
    'iframe[title*="challenge" i]'
]
LOGIN_TIMEOUT_S = 30


def human_type(sb, selector, text):
    for char in text:
        sb.add_text(selector, char)
        time.sleep(random.uniform(0.05, 0.18))


def fail(message):
    print(json.dumps({"error": message}))
    sys.exit(1)


def main():
    raw = sys.stdin.readline()
    try:
        credentials = json.loads(raw)
        email = credentials["email"]
        password = credentials["password"]
    except (json.JSONDecodeError, KeyError):
        fail("Expected a JSON line on stdin: {\"email\": \"...\", \"password\": \"...\"}")
        return

    from seleniumbase import SB

    with SB(uc=True, headless=False, incognito=True) as sb:
        sb.open(SIGN_IN_URL)
        sb.uc_click(PIXIV_OAUTH_BUTTON)
        sb.wait_for_element(EMAIL_INPUT, timeout=15)

        human_type(sb, EMAIL_INPUT, email)
        human_type(sb, PASSWORD_INPUT, password)
        sb.sleep(random.uniform(0.3, 0.8))
        sb.send_keys(PASSWORD_INPUT, "\n")

        deadline = time.time() + LOGIN_TIMEOUT_S
        while time.time() < deadline:
            if "booth.pm" in sb.get_current_url():
                break
            for indicator in CAPTCHA_INDICATORS:
                if sb.is_element_visible(indicator):
                    fail(
                        "pixiv presented a CAPTCHA challenge. Automated login "
                        "cannot proceed past it - use the SDK's login() "
                        "(visible browser, you log in yourself) instead."
                    )
                    return
            time.sleep(0.5)
        else:
            fail("Timed out waiting for the login to complete (no CAPTCHA detected, but never reached booth.pm).")
            return

        cookies = sb.get_cookies()
        booth_cookies = {
            c["name"]: c["value"]
            for c in cookies
            if "booth.pm" in c.get("domain", "")
        }

        if not booth_cookies:
            fail("Login did not produce any booth.pm session cookies.")
            return

        print(json.dumps(booth_cookies))


if __name__ == "__main__":
    main()
