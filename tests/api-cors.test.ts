import { afterEach, describe, expect, it } from 'vitest';
import {
  configuredAppOrigin,
  corsResponseHeaders,
  isAllowedApiOrigin,
} from '../lib/api-cors';

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }
});

describe('API CORS', () => {
  it('allows the exact Capacitor and localhost development origins', () => {
    expect(isAllowedApiOrigin('capacitor://localhost')).toBe(true);
    expect(isAllowedApiOrigin('http://localhost')).toBe(true);
    expect(isAllowedApiOrigin('https://localhost')).toBe(true);
  });

  it('rejects untrusted and lookalike custom-scheme origins', () => {
    expect(isAllowedApiOrigin('capacitor://evil.example')).toBe(false);
    expect(isAllowedApiOrigin('capacitor://localhost.evil.example')).toBe(false);
    expect(isAllowedApiOrigin('capacitor://localhost/path')).toBe(false);
    expect(isAllowedApiOrigin('https://untrusted.example')).toBe(false);
    expect(isAllowedApiOrigin('not a URL')).toBe(false);
  });

  it('normalizes and allows the configured web app origin', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://game.example.test/path';

    expect(configuredAppOrigin()).toBe('https://game.example.test');
    expect(isAllowedApiOrigin('https://game.example.test')).toBe(true);
  });

  it('reflects the trusted origin in response headers', () => {
    expect(corsResponseHeaders('capacitor://localhost')).toMatchObject({
      'Access-Control-Allow-Origin': 'capacitor://localhost',
      'Vary': 'Origin',
    });
  });
});
