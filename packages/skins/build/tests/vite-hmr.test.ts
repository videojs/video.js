import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { isObject, isString, isUndefined } from '@videojs/utils/predicate';
import react from '@vitejs/plugin-react';
import { createServer, type ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { vjscPlugin } from 'vjsc/vite';

const packageDir = resolve(import.meta.dirname, '../..');
const cssUrl = '/fixture.tsx?style=css';
const tailwindUrl = '/fixture.tsx?style=tailwind';

describe('Skins Vite HMR', () => {
  let fixture: Awaited<ReturnType<typeof createFixture>>;
  let server: ViteDevServer | undefined;

  beforeEach(async () => {
    fixture = await createFixture();
    server = await createServer({
      configFile: false,
      root: fixture.root,
      logLevel: 'silent',
      optimizeDeps: { include: [], noDiscovery: true },
      plugins: [
        ...vjscPlugin({
          transform: {
            components: () => [],
            styles(module) {
              const style = module.params.get('style');
              if (style === 'tailwind') return { mode: 'tailwind' };

              if (style !== 'css') return null;

              return {
                mode: 'css',
                stylesheet: { input: fixture.design },
              };
            },
          },
        }),
        react(),
      ],
      server: { middlewareMode: true },
    });
  }, 30_000);

  afterEach(async () => {
    await server?.close();
    server = undefined;
    await rm(fixture.root, { recursive: true, force: true });
  }, 30_000);

  it('recompiles component, style, and design changes without stale CSS', async () => {
    if (!server) throw new Error('Expected a Vite server.');

    const send = vi.spyOn(server.environments.client.hot, 'send');

    const initialCss = await transformedCode(server, cssUrl);
    const initialTailwind = await transformedCode(server, tailwindUrl);
    const initialCssRequest = virtualCssRequest(initialCss);
    const initialCssModule = await loadedCss(server, initialCssRequest);

    expect(initialCss).toContain('before');
    expect(initialTailwind).toContain('text-preview');
    expect(initialCssModule).toContain('color:');

    await fixture.update(fixture.component, moduleSource('after'));
    await invalidate(server, fixture.component, [cssUrl, tailwindUrl]);
    await vi.waitFor(() => expect(send.mock.calls.some(isHmrCall)).toBe(true));

    expect(await transformedCode(server, cssUrl)).toContain('after');
    expect(await transformedCode(server, tailwindUrl)).toContain('after');

    send.mockClear();
    await fixture.update(fixture.styles, styleSource('bg-preview'));
    await invalidate(server, fixture.styles, [cssUrl, tailwindUrl]);
    await vi.waitFor(() => expect(send.mock.calls.some(isGeneratedCssHmrCall)).toBe(true));

    const updatedCss = await transformedCode(server, cssUrl);
    const updatedTailwind = await transformedCode(server, tailwindUrl);
    const updatedCssRequest = virtualCssRequest(updatedCss);
    const updatedCssModule = await loadedCss(server, updatedCssRequest);

    expect(updatedTailwind).toContain('bg-preview');
    expect(updatedTailwind).not.toContain('text-preview');
    expect(updatedCss).not.toContain(initialCssRequest);
    expect(updatedCssRequest).not.toBe(initialCssRequest);
    expect(updatedCssModule).toContain('background-color:');
    expect(await loadedCssSource(server, initialCssRequest)).toBe('');
    expect(send.mock.calls.some(isFullReloadCall)).toBe(false);

    send.mockClear();
    await fixture.update(fixture.styles, styleSource('text-preview'));
    await invalidate(server, fixture.styles, [cssUrl, tailwindUrl]);
    await vi.waitFor(() => expect(send.mock.calls.some(isGeneratedCssHmrCall)).toBe(true));

    const restoredCss = await transformedCode(server, cssUrl);

    expect(virtualCssRequest(restoredCss)).toBe(initialCssRequest);
    expect(await loadedCssSource(server, initialCssRequest)).toContain('color:');
    expect(await loadedCssSource(server, updatedCssRequest)).toBe('');
    expect(send.mock.calls.some(isFullReloadCall)).toBe(false);

    send.mockClear();
    await fixture.update(fixture.design, designSource('#040506'));
    await invalidate(server, fixture.design, [cssUrl]);
    await vi.waitFor(() => expect(send.mock.calls.some(isHmrCall)).toBe(true));

    const redesignedCss = await transformedCode(server, cssUrl);
    const redesignedCssRequest = virtualCssRequest(redesignedCss);
    const redesignedCssModule = await loadedCss(server, redesignedCssRequest);

    expect(redesignedCss).not.toContain(updatedCssRequest);
    expect(redesignedCssRequest).not.toBe(updatedCssRequest);
    expect(redesignedCssModule).not.toBe(updatedCssModule);
    await expect(loadedCss(server, updatedCssRequest)).rejects.toThrow();
  }, 30_000);

  it('reports transform errors at the authored source location', async () => {
    if (!server) throw new Error('Expected a Vite server.');

    await fixture.update(
      fixture.component,
      `import styles from './fixture.styles';\nconst unresolved = styles;\nexport const Fixture = <div />;\n`
    );

    await expect(server.transformRequest(cssUrl)).rejects.toMatchObject({
      plugin: 'vjsc:styles',
      id: expect.stringContaining('fixture.tsx'),
      loc: expect.objectContaining({ line: 2 }),
      frame: expect.stringContaining('const unresolved = styles;'),
    });
  }, 30_000);
});

async function createFixture() {
  const root = await mkdtemp(resolve(packageDir, 'node_modules/vjsc-vite-hmr-'));
  const component = resolve(root, 'fixture.tsx');
  const styles = resolve(root, 'fixture.styles.ts');
  const design = resolve(root, 'design.css');
  let modified = Date.now() / 1_000;

  const update = async (file: string, source: string): Promise<void> => {
    await writeFile(file, source);
    modified += 1;
    await utimes(file, modified, modified);
  };

  await update(component, moduleSource('before'));
  await update(styles, styleSource('text-preview'));
  await update(design, designSource('#010203'));

  return { root, component, styles, design, update };
}

function moduleSource(marker: string): string {
  return `import styles from './fixture.styles';\nexport const marker = '${marker}';\nexport function Fixture() { return <div className={styles.root} />; }\nif (import.meta.hot) import.meta.hot.accept();\n`;
}

function styleSource(utility: string): string {
  return `
import { styles } from 'vjsc/styles';
export default styles({
  file: 'fixture.css',
  layer: 'components',
  rules: { root: { className: 'fixture-root', utilities: '${utility}' } },
});
`;
}

function designSource(color: string): string {
  return `
@import "tailwindcss" theme(inline);
@theme inline { --color-preview: ${color}; }
`;
}

async function transformedCode(server: ViteDevServer, url: string): Promise<string> {
  const result = await server.transformRequest(url);
  if (!result) throw new Error(`Vite did not transform \`${url}\`.`);

  return result.code;
}

function virtualCssRequest(code: string): string {
  const request = code.match(/["'](\/@id\/__x00__virtual:vjsc\/css\/[^"']+)["']/)?.[1];
  if (!request) throw new Error('Expected transformed source to import virtual VJSC CSS.');

  return request.replace(/\?t=\d+$/, '');
}

async function loadedCss(server: ViteDevServer, request: string): Promise<string> {
  const code = await loadedCssSource(server, request);
  if (!code) throw new Error(`Vite loaded empty CSS for \`${request}\`.`);

  return code;
}

async function loadedCssSource(server: ViteDevServer, request: string): Promise<string> {
  const publicId = request.replace('/@id/__x00__', '');
  const resolved = await server.pluginContainer.resolveId(publicId);
  if (!resolved) throw new Error(`Vite did not resolve \`${publicId}\`.`);

  const loaded = await server.pluginContainer.load(resolved.id);
  const code = isString(loaded) ? loaded : loaded?.code;
  if (isUndefined(code)) throw new Error(`Vite did not load \`${resolved.id}\`.`);

  return code;
}

async function invalidate(server: ViteDevServer, file: string, urls: readonly string[]): Promise<void> {
  const modules = await Promise.all(urls.map((url) => server.moduleGraph.getModuleByUrl(url)));
  if (modules.some((module) => !module)) throw new Error(`Expected Vite modules for ${urls.join(', ')}.`);

  const timestamps = modules.map((module) => module!.lastInvalidationTimestamp);

  server.watcher.emit('change', file);

  await vi.waitFor(() => {
    for (const [index, module] of modules.entries()) {
      expect(module!.lastInvalidationTimestamp).toBeGreaterThan(timestamps[index]!);
    }
  });
}

function isHmrCall(call: readonly unknown[]): boolean {
  const payload = call[0];

  return isObject(payload) && 'type' in payload && (payload.type === 'update' || payload.type === 'full-reload');
}

function isGeneratedCssHmrCall(call: readonly unknown[]): boolean {
  const payload = call[0];
  if (!isObject(payload) || !('type' in payload) || payload.type !== 'update') return false;

  return JSON.stringify(payload).includes('virtual:vjsc/css');
}

function isFullReloadCall(call: readonly unknown[]): boolean {
  const payload = call[0];

  return isObject(payload) && 'type' in payload && payload.type === 'full-reload';
}
