import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const distDir = resolve(process.cwd(), 'dist');

describe.runIf(existsSync(distDir))('PWA build output', () => {
  it('generates a service worker', () => {
    expect(existsSync(resolve(distDir, 'sw.js'))).toBe(true);
  });

  it('generates a web manifest', () => {
    expect(existsSync(resolve(distDir, 'manifest.webmanifest'))).toBe(true);
  });

  it('generates the SW registration script', () => {
    expect(existsSync(resolve(distDir, 'registerSW.js'))).toBe(true);
  });

  it('index.html has the correct title', () => {
    const html = readFileSync(resolve(distDir, 'index.html'), 'utf-8');
    expect(html).toContain('<title>Snake Run</title>');
  });

  it('index.html contains manifest link and SW registration', () => {
    const html = readFileSync(resolve(distDir, 'index.html'), 'utf-8');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('vite-plugin-pwa:register-sw');
  });

  it('manifest contains correct subpath-critical values', () => {
    const raw = readFileSync(resolve(distDir, 'manifest.webmanifest'), 'utf-8');
    const manifest = JSON.parse(raw);
    expect(manifest.name).toBe('Snake Run');
    expect(manifest.start_url).toBe('/snake-run/');
    expect(manifest.scope).toBe('/snake-run/');
    expect(manifest.display).toBe('standalone');
  });
});
