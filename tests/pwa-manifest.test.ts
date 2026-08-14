import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type ManifestIcon = { src: string; sizes?: string; type?: string; purpose?: string };
type Manifest = { display?: string; start_url?: string; icons?: ManifestIcon[] };

function pngSignature(path: string) {
  return readFileSync(path).subarray(0, 8).toString('hex');
}

describe('PWA release manifest', () => {
  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as Manifest;

  it('keeps standalone launch behavior', () => {
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
  });

  it('ships Chromium-standard 192px and 512px raster install icons', () => {
    const icons = manifest.icons ?? [];
    expect(icons).toContainEqual(expect.objectContaining({
      src: '/icons/timefillergames-192.png',
      sizes: '192x192',
      type: 'image/png',
    }));
    expect(icons).toContainEqual(expect.objectContaining({
      src: '/icons/timefillergames-512.png',
      sizes: '512x512',
      type: 'image/png',
    }));
    expect(pngSignature('public/icons/timefillergames-192.png')).toBe('89504e470d0a1a0a');
    expect(pngSignature('public/icons/timefillergames-512.png')).toBe('89504e470d0a1a0a');
  });

  it('retains the scalable maskable master mark', () => {
    expect(manifest.icons ?? []).toContainEqual(expect.objectContaining({
      src: '/brand/timefillergames-mark.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'maskable',
    }));
  });
});
