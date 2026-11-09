import { afterEach, describe, expect, it, vi } from 'vitest';

// sitePath reads the environment once at module scope, so each case re-imports
// it after stubbing.
async function importWithEnv(env: Record<string, string | undefined>) {
  vi.resetModules();
  // Pin both variables so the invoking shell's base path can't leak in.
  for (const key of ['NEXT_PUBLIC_BASE_PATH', 'NEXT_BASE_PATH']) {
    vi.stubEnv(key, env[key] ?? '');
  }
  return (await import('../app/services/sitePath')).withBasePath;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('withBasePath', () => {
  it('returns the path unchanged when no base path is configured', async () => {
    const withBasePath = await importWithEnv({});

    expect(withBasePath('/blogs/')).toBe('/blogs/');
  });

  // The bug this guards: NEXT_BASE_PATH is private, so Next strips it from the
  // browser bundle. A client component reading it would prefix during the
  // static render and not after hydration. next.config republishes the value
  // under a NEXT_PUBLIC_ name, which is what must be read.
  it('reads the republished public variable, which survives into the browser bundle', async () => {
    const withBasePath = await importWithEnv({
      NEXT_PUBLIC_BASE_PATH: '/preview',
    });

    expect(withBasePath('/blogs/')).toBe('/preview/blogs/');
  });

  it('falls back to the private variable for server-only callers and scripts', async () => {
    const withBasePath = await importWithEnv({ NEXT_BASE_PATH: '/preview' });

    expect(withBasePath('/blogs/')).toBe('/preview/blogs/');
  });

  it('agrees whichever variable carries the value', async () => {
    const fromPublic = await importWithEnv({ NEXT_PUBLIC_BASE_PATH: '/preview' });
    const publicResult = fromPublic('/images/logo.png');

    vi.unstubAllEnvs();
    const fromPrivate = await importWithEnv({ NEXT_BASE_PATH: '/preview' });

    expect(publicResult).toBe(fromPrivate('/images/logo.png'));
  });

  it('normalizes surrounding slashes', async () => {
    const withBasePath = await importWithEnv({
      NEXT_PUBLIC_BASE_PATH: 'preview/',
    });

    expect(withBasePath('/blogs/')).toBe('/preview/blogs/');
  });

  it('treats an empty republished value as no base path', async () => {
    const withBasePath = await importWithEnv({ NEXT_PUBLIC_BASE_PATH: '' });

    expect(withBasePath('/blogs/')).toBe('/blogs/');
  });

  it('leaves relative and absolute URLs alone', async () => {
    const withBasePath = await importWithEnv({
      NEXT_PUBLIC_BASE_PATH: '/preview',
    });

    expect(withBasePath('blogs/')).toBe('blogs/');
    expect(withBasePath('https://example.com/logo.png')).toBe(
      'https://example.com/logo.png',
    );
  });
});
