import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const distRoot = resolve(import.meta.dirname, '../../dist');

describe('generated icon modules', () => {
  it.each(['default', 'neutral'])('builds constrained VJSC components for the %s family', async (family) => {
    const [source, types] = await Promise.all([
      readFile(resolve(distRoot, 'vjsc', family, 'index.js'), 'utf8'),
      readFile(resolve(distRoot, 'vjsc', family, 'index.d.ts'), 'utf8'),
    ]);

    expect(source).toContain(`import { createComponent } from 'vjsc/components';`);
    expect(source).toContain(`export const PlayIcon = createComponent({ name: 'PlayIcon' });`);
    expect(source).toContain(`export const RestartIcon = createComponent({ name: 'RestartIcon' });`);
    expect(types).toContain(`export declare const PlayIcon: Component<EmptyProps>;`);
  });

  it.each(['default', 'neutral'])('builds ref-forwarding React components for the %s family', async (family) => {
    const [source, types, files] = await Promise.all([
      readFile(resolve(distRoot, 'react', family, 'play.js'), 'utf8'),
      readFile(resolve(distRoot, 'react', family, 'play.d.ts'), 'utf8'),
      readdir(resolve(distRoot, 'react', family)),
    ]);

    expect(source).toContain('forwardRef');
    expect(source).toContain('from "react/jsx-runtime"');
    expect(source).toContain('const ForwardRef = forwardRef(PlayIcon)');
    expect(source).toContain('export default ForwardRef');
    expect(source).not.toContain('<svg');
    expect(types).toContain('React.ForwardRefExoticComponent');
    expect(files.some((file) => file.endsWith('.tsx'))).toBe(false);
  });

  it('builds HTML strings without a React type dependency', async () => {
    const [source, types] = await Promise.all([
      readFile(resolve(distRoot, 'html/default/play.js'), 'utf8'),
      readFile(resolve(distRoot, 'html/default/index.d.ts'), 'utf8'),
    ]);

    expect(source).toContain('export const playIcon = "<svg');
    expect(source).toContain('aria-hidden=\\"true\\"');
    expect(types).toContain('export declare const playIcon: string;');
    expect(types).not.toContain('react');
  });

  it('builds an executable static renderer', async () => {
    const moduleUrl = pathToFileURL(resolve(distRoot, 'render/default/index.js')).href;
    const { renderIcon } = (await import(moduleUrl)) as {
      renderIcon(name: string, attributes?: Record<string, string>): string;
    };

    expect(renderIcon('play')).toContain('aria-hidden="true"');
    expect(renderIcon('play', { class: 'icon', title: `&<>"'\`` })).toContain(
      'class="icon" title="&amp;&lt;&gt;&quot;&#39;&#96;"'
    );
    expect(renderIcon('missing')).toBe('');
  });

  it('builds element registrations around the authored runtime', async () => {
    const [base, root, family, icons] = await Promise.all([
      readFile(resolve(distRoot, 'element/base.js'), 'utf8'),
      readFile(resolve(distRoot, 'element/index.js'), 'utf8'),
      readFile(resolve(distRoot, 'element/neutral/index.js'), 'utf8'),
      readFile(resolve(distRoot, 'element/neutral/icons.js'), 'utf8'),
    ]);

    expect(base).toContain('export class MediaIconElement extends HTMLElement');
    expect(root).toContain(`registerLoader?.("neutral"`);
    expect(family).toContain(`register?.("neutral", icons)`);
    expect(icons).toContain('aria-hidden=\\"true\\"');
    expect(existsSync(resolve(distRoot, 'rolldown'))).toBe(false);
  });

  it('writes families and exports deterministically', async () => {
    const families = await readdir(resolve(distRoot, 'html'));
    const exports = await readFile(resolve(distRoot, 'html/default/index.js'), 'utf8');

    expect(families).toEqual([...families].sort());
    expect(exports.indexOf('airplay-enter')).toBeLessThan(exports.indexOf('captions-off'));
  });
});
