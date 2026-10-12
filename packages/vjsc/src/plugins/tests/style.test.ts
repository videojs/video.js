import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import type { Plugin } from 'rolldown';
import { rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { CANDIDATES_ALIAS, parseCandidateManifest, resolveCandidateManifestPath } from '../../styles/candidates';
import { toPosixPath } from '../../utils/path';
import { type StylePlugin, type StylePluginOptions, stylePlugin } from '../style';

const filename = resolve(import.meta.dirname, 'component.tsx');
const moduleId = `${filename}?target=react`;
const designPath = resolve(import.meta.dirname, 'fixtures/design.css');
const designDependency = resolve(import.meta.dirname, 'fixtures/theme.css');

const BUTTON = `import styles from './fixtures/utilities.styles'; export const root = <div className={styles.button} />;`;

describe('stylePlugin', () => {
  it('aliases the default candidate manifest and re-includes it in the Vite watcher', () => {
    const plugin = stylePlugin({ transform: { mode: 'tailwind' }, candidates: true });
    const manifest = resolveCandidateManifestPath(import.meta.dirname);

    expect(plugin.config?.({ root: import.meta.dirname })).toEqual({
      resolve: { alias: [{ find: CANDIDATES_ALIAS, replacement: manifest }] },
      server: { watch: { ignored: [`!${toPosixPath(manifest)}`] } },
    });
  });

  it('keeps candidates from an earlier session until modules record again', async () => {
    const manifest = join(await mkdtemp(join(tmpdir(), 'vjsc-candidates-')), 'candidates.css');
    const plugin = stylePlugin({ transform: { mode: 'tailwind' }, candidates: manifest });

    await writeFile(manifest, '@source inline("persisted-class");\n');
    await transform(BUTTON, plugin);

    expect(parseCandidateManifest(await readFile(manifest, 'utf8'))).toEqual([
      'grid',
      'p-0',
      'persisted-class',
      'shrink-0',
      'size-4',
    ]);
  });

  it('records included style modules before any owner is transformed', async () => {
    const manifest = join(await mkdtemp(join(tmpdir(), 'vjsc-candidates-')), 'candidates.css');
    const plugin = stylePlugin({
      transform: { mode: 'tailwind' },
      candidates: { path: manifest, include: resolve(import.meta.dirname, 'fixtures/*.styles.ts') },
    });

    await writeFile(manifest, '@source inline("stale-class");\n');
    await transform(`export const root = <div />;`, plugin);

    const candidates = parseCandidateManifest(await readFile(manifest, 'utf8'));

    expect(candidates).toEqual(expect.arrayContaining(['grid', 'border-0', 'p-3', 'size-4', 'font-medium']));
    expect(candidates).not.toContain('stale-class');
  });

  it('does not record candidates for CSS output', async () => {
    const manifest = join(await mkdtemp(join(tmpdir(), 'vjsc-candidates-')), 'candidates.css');

    await transform(BUTTON, stylePlugin({ transform: { mode: 'css' }, candidates: manifest }));

    expect(parseCandidateManifest(await readFile(manifest, 'utf8'))).toEqual([]);
  });

  it('writes a candidate manifest for every resolved style module', async () => {
    const manifest = join(await mkdtemp(join(tmpdir(), 'vjsc-candidates-')), 'candidates.css');

    await transform(BUTTON, stylePlugin({ transform: { mode: 'tailwind' }, candidates: manifest }));

    const content = await readFile(manifest, 'utf8');

    expect(content).toContain('@source inline("grid");');
    expect(content).toContain('@source inline("size-4");');
  });

  it('rewrites style references with the Oxc AST and preserves expression source', async () => {
    const { source } = await transform(`
      import styles from './fixtures/utilities.styles';
      export function Example({ active }) {
        return <button className={[styles.button, active && styles.icon, 'hook']} />;
      }
    `);

    expect(source).not.toContain('utilities.styles');
    expect(source).toContain('className={["grid", "p-0", active && "size-4 shrink-0", \'hook\']}');
  });

  it('rewrites static style references outside JSX', async () => {
    const { source } = await transform(`
      import styles from './fixtures/utilities.styles';
      export const buttonClass = styles.button;
    `);

    expect(source).not.toContain('utilities.styles');
    expect(source).toContain('buttonClass = "grid p-0"');
  });

  it('removes a style import the source never references', async () => {
    const { source } = await transform(`import styles from './fixtures/utilities.styles'; export const root = 1;`);

    expect(source).not.toContain('utilities.styles');
  });

  it('preserves authored utility groups in direct JSX class values', async () => {
    const { source } = await transform(BUTTON);

    expect(source).toContain('className={["grid", "p-0"]}');
  });

  it('preserves semantic hooks without utilities in Tailwind output', async () => {
    const { source } = await transform(
      `import styles from './fixtures/hooks.styles'; export const root = <div className={styles.root} />;`
    );

    expect(source).toContain('className={"video-controls"}');
  });

  it('combines normalized variants in selection order', async () => {
    const input = `
      import styles from './fixtures/button.styles';
      export const button = <button className={styles.root} />;
    `;
    const base = await transform(input, stylePlugin({ transform: { mode: 'tailwind' } }));
    const selected = await transform(
      input,
      stylePlugin({ transform: { mode: 'tailwind', variants: ['compact', 'disabled'] } })
    );

    expect(base.source).toContain('p-3');
    expect(base.source).not.toContain('pointer-events-none');
    expect(selected.source).toContain('p-1');
    expect(selected.source).not.toContain('p-3');
    expect(selected.source).toContain('pointer-events-none');
  });

  it.each(['css', 'tailwind'] as const)('preserves custom font sizes with variants in %s output', async (mode) => {
    const plugin = stylePlugin({ transform: { mode, variants: ['minimal'], stylesheet: { input: designPath } } });
    const { source } = await transform(
      `import styles from './fixtures/title.styles'; export const title = <div className={styles.root} />;`,
      plugin
    );

    if (mode === 'tailwind') {
      expect(source).toContain('text-fixture-title');
      expect(source).toContain('text-fixture-foreground');
      expect(source).toContain('font-normal');
      expect(source).not.toContain('font-medium');
    } else {
      const css = plugin.cssSource(virtualCssIds(source)[0]!);

      expect(css).toContain('font-size: 1.5rem');
      expect(css).toContain('font-weight: 400');
      expect(css).toContain('color:');
    }
  });

  it('forwards multiple variants to generated CSS', async () => {
    const plugin = stylePlugin({
      transform: { mode: 'css', variants: ['compact', 'disabled'], stylesheet: { input: designPath } },
    });
    const { source } = await transform(
      `
        import styles from './fixtures/button.styles';
        export const button = <button className={styles.root} />;
      `,
      plugin
    );
    const id = virtualCssIds(source)[0];
    if (!id) throw new Error('Expected a generated semantic stylesheet.');

    const css = await loadPlugin(plugin, id);

    expect(css).toContain('padding: .25rem');
    expect(css).not.toContain('padding: .75rem');
    expect(css).toContain('pointer-events: none');
  });

  it('rejects a class list that composes an override the CSS output emits first', async () => {
    for (const classList of [
      '[styles.first, styles.second]',
      '[...[styles.first, styles.second]]',
      '[styles.first, [styles.second]]',
      '[styles.first, styles.second] as const',
      '[styles.first as string, styles.second]',
      'open ? [styles.first, styles.second] : []',
      '[...(open ? [styles.first, styles.second] : [])]',
      '[open && [styles.first, styles.second]]',
    ]) {
      await expect(
        transform(
          `import styles from './fixtures/choice.styles'; export const root = (open) => <div className={${classList}} />;`,
          cssPlugin()
        )
      ).rejects.toThrow('`.media-a` is composed after `.media-z` to override it');
    }
  });

  it('does not compose alternatives: other arrays, call arguments, and conditional branches', async () => {
    const { source } = await transform(
      `import styles from './fixtures/choice.styles';
      const choose = (first, second) => (Math.random() > 0.5 ? first : second);
      export const alternatives = [styles.first, styles.second];
      export const chosen = <div className={choose(styles.first, styles.second)} />;
      export const toggled = (open) => <div className={open ? [styles.first] : [styles.second]} />;
      export const unreachable = <div className={[styles.first, styles.second] && []} />;`,
      cssPlugin()
    );

    expect(source).toContain('alternatives = ["media-z", "media-a"]');
  });

  it('rejects non-static style binding usage', async () => {
    const source = `import styles from './fixtures/utilities.styles'; export const value = styles;`;

    await expect(transform(source)).rejects.toMatchObject({
      errors: [
        {
          message: expect.stringContaining('must use static references'),
          pos: source.lastIndexOf('styles'),
        },
      ],
    });
  });

  it('tracks imported design-system files and preserves directives', async () => {
    const { source, watchFiles } = await transform(
      `
        'use client';
        ${BUTTON}
      `,
      stylePlugin({ transform: { mode: 'css', stylesheet: { input: designPath } } })
    );

    const directive = source.indexOf(`'use client'`);
    const cssImport = source.indexOf('virtual:vjsc/css');

    expect(watchFiles).toContain(designPath);
    expect(watchFiles).toContain(designDependency);
    expect(directive).toBeGreaterThanOrEqual(0);
    expect(cssImport).toBeGreaterThanOrEqual(0);
    expect(directive).toBeLessThan(cssImport);
  });

  it('imports runtime base CSS before generated semantic styles', async () => {
    const { source } = await transform(
      BUTTON,
      stylePlugin({ transform: { mode: 'css', stylesheet: { input: designPath, base: designDependency } } })
    );

    const base = source.indexOf('/base.css');
    const semantic = source.indexOf('/buttons.css');

    expect(base).toBeGreaterThanOrEqual(0);
    expect(semantic).toBeGreaterThan(base);
  });

  it('releases stale hashed CSS modules when an owner is recompiled', async () => {
    let scope = '.first';
    const plugin = stylePlugin({ transform: () => ({ mode: 'css', stylesheet: { input: designPath, scope } }) });

    const first = await transform(BUTTON, plugin);

    scope = '.second';
    const second = await transform(BUTTON, plugin);
    const firstId = virtualCssIds(first.source)[0];
    const secondId = virtualCssIds(second.source)[0];

    expect(firstId).toBeDefined();
    expect(secondId).toBeDefined();
    expect(secondId).not.toBe(firstId);
    expect(await resolvePluginId(plugin, firstId!)).toBeNull();
    expect(await resolvePluginId(plugin, secondId!)).toBe(`\0${secondId}`);
  });

  it('keeps released CSS resolvable as empty source when the lifecycle retains it', async () => {
    let scope = '.first';
    const changed: string[] = [];
    const plugin = stylePlugin({
      transform: () => ({ mode: 'css', stylesheet: { input: designPath, scope } }),
      lifecycle: { retainReleasedCss: true, onCssChange: (id) => changed.push(id), onOwnerTransform() {} },
    });

    const firstId = virtualCssIds((await transform(BUTTON, plugin)).source)[0]!;

    scope = '.second';
    await transform(BUTTON, plugin);

    expect(plugin.cssSource(firstId)).toBe('');
    expect(changed.filter((id) => id === firstId)).toHaveLength(2);
  });

  it('emits WebKit shadow-host copies only when the output has shadow hosts', async () => {
    const source = `import styles from './fixtures/shadow-host.styles'; export const root = <div className={styles.root} />;`;
    const compiled = async (shadowHosts: boolean) => {
      const plugin = stylePlugin({
        transform: { mode: 'css', stylesheet: { input: designPath, scope: '.media-skin', shadowHosts } },
      });

      return plugin.cssSource(virtualCssIds((await transform(source, plugin)).source)[0]!);
    };

    expect(await compiled(true)).toContain(':where(.media-skin) .media-host');
    expect(await compiled(false)).not.toContain(':where(.media-skin)');
  });

  it('warns once when authored and compiled checks find the same complex selector', async () => {
    const { warnings } = await transform(
      `import styles from './fixtures/complex.styles'; export const root = <div className={styles.root} />;`,
      stylePlugin({ transform: { mode: 'css', stylesheet: { input: designPath } } })
    );

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('[VJSC_STYLE_COMPLEX_SELECTOR]');
    expect(warnings[0]).toContain('`[&_img]:block`, `[&_video]:block`');
    expect(warnings[0]).toContain(`${resolve(import.meta.dirname, 'fixtures/complex.styles.ts')}:7:5`);
    expect(warnings[0]).toContain('Reason:');
    expect(warnings[0]).toContain('Recommendation:');
  });

  it('promotes or silences complex-selector warnings', async () => {
    const input = `import styles from './fixtures/complex.styles'; export const root = <div className={styles.root} />;`;

    await expect(
      transform(input, stylePlugin({ transform: { mode: 'tailwind' }, diagnostics: { complexSelectors: 'error' } }))
    ).rejects.toThrow('[VJSC_STYLE_COMPLEX_SELECTOR]');

    const { warnings } = await transform(
      input,
      stylePlugin({ transform: { mode: 'tailwind' }, diagnostics: { complexSelectors: 'off' } })
    );

    expect(warnings).toEqual([]);
  });

  it('keeps isolation errors active when complex-selector warnings are off', async () => {
    const input = `import styles from './fixtures/peer.styles'; export const root = <div className={styles.root} />;`;

    await expect(
      transform(input, stylePlugin({ transform: { mode: 'tailwind' }, diagnostics: { complexSelectors: 'off' } }))
    ).rejects.toThrow('[VJSC_STYLE_PEER_RELATIONSHIP]');
  });

  it('keeps isolation errors active when diagnostics are disabled', async () => {
    const input = `import styles from './fixtures/peer.styles'; export const root = <div className={styles.root} />;`;

    await expect(
      transform(input, stylePlugin({ transform: { mode: 'tailwind' }, diagnostics: false }))
    ).rejects.toThrow('[VJSC_STYLE_PEER_RELATIONSHIP]');
  });
});

async function transform(
  source: string,
  styles: StylePlugin = stylePlugin({ transform: { mode: 'tailwind' } } satisfies StylePluginOptions)
): Promise<{
  readonly source: string;
  readonly warnings: readonly string[];
  readonly watchFiles: readonly string[];
}> {
  let output: string | undefined;
  const warnings: string[] = [];
  const inspect: Plugin = {
    name: 'fixture:inspect',
    buildEnd() {
      output = this.getModuleInfo(moduleId)?.code ?? undefined;
    },
  };
  const bundle = await rolldown({
    input: 'fixture',
    experimental: { nativeMagicString: true },
    external: /^virtual:vjsc\/css\//,
    transform: { jsx: 'preserve' },
    plugins: [fixturePlugin(source), styles, inspect],
    onLog(level, log) {
      if (level === 'warn') warnings.push(log.message);
    },
  });

  await bundle.generate({ format: 'es' });

  if (output === undefined) throw new Error('Fixture build did not retain editable source.');

  return {
    source: output,
    warnings,
    watchFiles: await bundle.watchFiles,
  };
}

function cssPlugin(): StylePlugin {
  return stylePlugin({ transform: { mode: 'css', stylesheet: { input: designPath } }, diagnostics: false });
}

function virtualCssIds(source: string): string[] {
  return [...source.matchAll(/["'](virtual:vjsc\/css\/[^"']+)["']/g)].map((match) => match[1]!);
}

async function resolvePluginId(plugin: Plugin, id: string): Promise<unknown> {
  const hook = plugin.resolveId;
  if (!hook) return null;

  const handler = typeof hook === 'function' ? hook : hook.handler;

  return (handler as (id: string) => unknown)(id);
}

async function loadPlugin(plugin: Plugin, id: string): Promise<string> {
  const resolved = await resolvePluginId(plugin, id);
  if (typeof resolved !== 'string') throw new Error(`Could not resolve ${id}.`);

  const hook = plugin.load;
  if (!hook) throw new Error('Expected the style plugin to provide a load hook.');

  const handler = typeof hook === 'function' ? hook : hook.handler;
  const result = await (handler as (id: string) => unknown)(resolved);
  if (typeof result !== 'string') throw new Error(`Could not load ${id}.`);

  return result;
}

function fixturePlugin(source: string): Plugin {
  return {
    name: 'fixture:module',
    resolveId(id) {
      return id === 'fixture' ? moduleId : null;
    },
    load(id) {
      return id === moduleId ? { code: source, moduleType: 'tsx' } : null;
    },
  };
}
