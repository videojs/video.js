import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { createElement, createRef, type SVGProps } from 'react';
import { describe, expect, it } from 'vite-plus/test';

// Use the framework package's React DOM 19, matching the generated icons' React dependency.
const { createRoot } = createRequire(resolve(import.meta.dirname, '../../../react/package.json'))(
  'react-dom/client'
) as {
  createRoot(container: Element): { render(node: ReturnType<typeof createElement>): void; unmount(): void };
};
const { flushSync } = createRequire(resolve(import.meta.dirname, '../../../react/package.json'))('react-dom') as {
  flushSync(callback: () => void): void;
};

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

    expect(source).toContain('from "react/jsx-runtime"');
    expect(source).not.toContain('<svg');
    expect(types).toContain('React.ForwardRefExoticComponent');
    expect(files.some((file) => file.endsWith('.tsx'))).toBe(false);

    const moduleUrl = pathToFileURL(resolve(distRoot, 'react', family, 'play.js')).href;
    const { default: PlayIcon } = (await import(moduleUrl)) as {
      default: (props: SVGProps<SVGSVGElement>) => ReturnType<typeof createElement>;
    };

    // React 19 passes `ref` as a prop to plain components, so rendering alone can't prove React 18 forwarding.
    expect((PlayIcon as unknown as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.forward_ref'));

    const container = document.createElement('div');
    const root = createRoot(container);
    const ref = createRef<SVGSVGElement>();

    document.body.append(container);

    try {
      flushSync(() => root.render(createElement(PlayIcon, { ref, className: 'play-icon', 'aria-label': 'Play' })));

      const svg = container.querySelector('svg');

      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('class')).toBe('play-icon');
      expect(svg?.getAttribute('aria-label')).toBe('Play');
      expect(ref.current).toBe(svg);
    } finally {
      flushSync(() => root.unmount());
      container.remove();
    }
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
    const exports = await readFile(resolve(distRoot, 'html/default/index.js'), 'utf8');

    const specifiers = [...exports.matchAll(/from ['"]([^'"]+)['"]/g)].map((match) => match[1]!);

    expect(specifiers).toContain('./airplay-enter.js');
    expect(specifiers).toContain('./captions-off.js');
    expect(specifiers).toEqual([...specifiers].sort());
  });
});
