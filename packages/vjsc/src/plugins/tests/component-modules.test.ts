import { mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import type { Plugin } from 'rolldown';
import { rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { moduleFilename } from '../../utils/module-id';
import { componentModulesPlugin } from '../component-modules';

describe('componentModulesPlugin', () => {
  it('gives every query variant of one file its own module metadata', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-component-modules-'));
    const entry = join(root, 'entry.tsx');
    const child = join(root, 'child.tsx');

    writeFileSync(entry, `import { Child } from './child'; export const Entry = () => <Child />;`);
    writeFileSync(child, `export const Child = () => <span />;`);

    const metas = new Map<string, unknown>();
    const record: Plugin = {
      name: 'fixture:record',
      transform: {
        filter: { id: /child\.tsx\?/ },
        handler(_code, id) {
          const previous = this.getModuleInfo(id)?.meta;

          return { meta: { ...previous, variants: [...((previous?.variants as string[]) ?? []), id.split('?')[1]] } };
        },
      },
      buildEnd() {
        for (const id of this.getModuleIds()) {
          if (id.includes('child.tsx?')) metas.set(id.split('?')[1]!, this.getModuleInfo(id)?.meta);
        }
      },
    };
    const bundle = await rolldown({
      input: [`${entry}?theme=default`, `${entry}?theme=minimal`],
      transform: { jsx: 'preserve' },
      plugins: [componentModulesPlugin(), record],
    });

    await bundle.generate({ format: 'es' });
    await bundle.close();

    expect(metas.get('theme=default')).toEqual({ variants: ['theme=default'] });
    expect(metas.get('theme=minimal')).toEqual({ variants: ['theme=minimal'] });
  });

  it('keeps resolver metadata from other plugins without sharing it between variants', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-component-modules-'));
    const entry = join(root, 'entry.tsx');
    const child = join(root, 'child.tsx');

    writeFileSync(entry, `import { Child } from './child'; export const Entry = () => <Child />;`);
    writeFileSync(child, `export const Child = () => <span />;`);

    const resolver: Plugin = {
      name: 'fixture:resolver',
      resolveId(id) {
        return id === './child' ? { id: child, meta: { fixture: { resolved: true }, vjsc: { stale: true } } } : null;
      },
    };
    const metas = new Map<string, Record<string, unknown> | undefined>();
    const record: Plugin = {
      name: 'fixture:record',
      buildEnd() {
        for (const id of this.getModuleIds()) {
          if (id.includes('child.tsx?')) metas.set(id.split('?')[1]!, this.getModuleInfo(id)?.meta);
        }
      },
    };
    const bundle = await rolldown({
      input: [`${entry}?theme=default`, `${entry}?theme=minimal`],
      transform: { jsx: 'preserve' },
      plugins: [componentModulesPlugin(), resolver, record],
    });

    await bundle.generate({ format: 'es' });
    await bundle.close();

    expect(metas.get('theme=default')).toEqual({ fixture: { resolved: true } });
    expect(metas.get('theme=minimal')).toEqual({ fixture: { resolved: true } });
    expect(metas.get('theme=default')).not.toBe(metas.get('theme=minimal'));
  });

  it('propagates the full transform query through relative source dependencies', async () => {
    const root = mkdtempSync(join(tmpdir(), 'vjsc-component-modules-'));
    const entry = join(root, 'entry.tsx');
    const child = join(root, 'child.tsx');
    const model = join(root, 'model.ts');

    writeFileSync(
      entry,
      `import { Child } from './child'; import type { Label } from './model'; export const Entry = ({ label }: { label: Label }) => <Child>{label}</Child>;`
    );
    writeFileSync(child, `export const Child = ({ children }: { children?: unknown }) => <span>{children}</span>;`);
    writeFileSync(model, `export type Label = string;`);

    const transformed: string[] = [];
    const capture: Plugin = {
      name: 'fixture:capture',
      transform: {
        filter: { id: /\.[cm]?[jt]sx?(?:\?|$)/ },
        handler(_code, id) {
          transformed.push(id);
          return null;
        },
      },
      buildEnd() {
        transformed.push(...this.getModuleIds());
      },
    };
    const bundle = await rolldown({
      input: `${entry}?style=tailwind&target=react`,
      experimental: { nativeMagicString: true },
      transform: { jsx: 'preserve' },
      plugins: [componentModulesPlugin(), capture],
    });

    await bundle.generate({ format: 'es' });

    const selected = transformed
      .filter((id) => id.includes('?style=tailwind&target=react'))
      .map((id) => basename(moduleFilename(id)));

    expect(selected).toEqual(expect.arrayContaining(['entry.tsx', 'child.tsx']));
    expect(selected).not.toContain('model.ts');
  });

  it('lets a dependency inherit a narrower query than its importer', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'vjsc-component-modules-')));
    const entry = join(root, 'entry.tsx');
    const child = join(root, 'child.tsx');

    writeFileSync(entry, `import { Child } from './child'; export const Entry = () => <Child />;`);
    writeFileSync(child, `export const Child = () => <span />;`);

    const ids: string[] = [];
    const capture: Plugin = {
      name: 'fixture:capture',
      buildEnd() {
        ids.push(...this.getModuleIds());
      },
    };
    const bundle = await rolldown({
      input: [`${entry}?skin=a&theme=default`, `${entry}?skin=b&theme=default`],
      transform: { jsx: 'preserve' },
      plugins: [
        componentModulesPlugin({
          inherit: (importer, filename) =>
            filename === child ? { theme: importer.params.get('theme')! } : importer.params,
        }),
        capture,
      ],
    });

    await bundle.generate({ format: 'es' });
    await bundle.close();

    expect(ids.filter((id) => id.includes('child.tsx')).map((id) => id.split('?')[1])).toEqual(['theme=default']);
  });

  it('asks the selector once per module id', async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'vjsc-component-modules-')));
    const entry = join(root, 'entry.tsx');

    writeFileSync(join(root, 'first.tsx'), `export const First = () => <b />;`);
    writeFileSync(join(root, 'second.tsx'), `export const Second = () => <i />;`);
    writeFileSync(
      entry,
      `import { First } from './first'; import { Second } from './second'; export const Entry = () => <><First /><Second /></>;`
    );

    const asked: string[] = [];
    const bundle = await rolldown({
      input: `${entry}?target=react`,
      experimental: { nativeMagicString: true },
      transform: { jsx: 'preserve' },
      plugins: [
        componentModulesPlugin({
          select(module) {
            asked.push(basename(module.filename));
            return true;
          },
        }),
      ],
    });

    await bundle.generate({ format: 'es' });

    expect(asked.filter((name) => name === 'entry.tsx')).toHaveLength(1);
    expect(asked.filter((name) => name === 'first.tsx')).toHaveLength(1);
  });
});
