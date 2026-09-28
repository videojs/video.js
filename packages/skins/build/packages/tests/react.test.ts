import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';
import type { Graph } from 'vjsc/graph';

import type { SkinModuleMeta } from '../../../src/meta.ts';
import { skinClassNameMergeImport } from '../../imports.ts';
import { skinSourceDirectory } from '../../skin.ts';
import { createReactPackageSkins } from '../react.ts';

describe('createReactPackageSkins', () => {
  it('writes one finalized graph to stable package sources', async () => {
    const root = resolve(import.meta.dirname, 'fixture');
    const graph = fixtureGraph(root);
    const files = new Map(
      (
        await createReactPackageSkins(graph, {
          workspaceDir: resolve(import.meta.dirname, '../../../../..'),
          baseStyles: [],
        })
      ).map((file) => [file.path, file.content])
    );

    expect(files.get('packages/react/src/presets/video/skin.tsx')).toContain('export interface VideoSkinProps');
    expect(files.get('packages/react/src/presets/video/skin.tsx')).toContain('<Skin {...props} />');
    expect(files.get('packages/react/src/internal/skins/default-video/skin.tsx')).toContain(
      "from '../shared/components/button'"
    );
    expect(files.get('packages/react/src/internal/skins/shared/components/button.tsx')).toContain(
      "from '../../../skin-primitives'"
    );
    expect(files.get('packages/react/src/internal/skins/shared/components/button.tsx')).not.toContain(
      '@videojs/react/ui/playback-rate-radio-group'
    );
    expect(files.get('packages/react/src/internal/skins/shared/components/button.tsx')).toContain(
      `import { cn } from '@videojs/utils/style'`
    );
    expect(files.get('packages/react/src/internal/skins/default-video/components/themed.tsx')).toContain('default');
    expect(files.get('packages/react/src/internal/skins/minimal-video/components/themed.tsx')).toContain('minimal');
  });

  it('generates a module per skin when its source is shared but a dependency is not', async () => {
    const graph = fixtureGraph(resolve(import.meta.dirname, 'fixture'));
    const files = new Map(
      (
        await createReactPackageSkins(graph, {
          workspaceDir: resolve(import.meta.dirname, '../../../../..'),
          baseStyles: [],
        })
      ).map((file) => [file.path, file.content])
    );

    // `label.tsx` reads the same in every skin, but it imports the themed module, which differs per skin.
    expect(files.has('packages/react/src/internal/skins/shared/components/label.tsx')).toBe(false);
    expect(files.get('packages/react/src/internal/skins/minimal-video/components/label.tsx')).toContain(
      "from './themed'"
    );
    expect(files.get('packages/react/src/internal/skins/default-video/components/label.tsx')).toContain(
      "from './themed'"
    );
  });
});

function fixtureGraph(root: string): Graph<SkinModuleMeta> {
  const modules = new Map();

  for (const theme of ['default', 'minimal'] as const) {
    for (const preset of ['audio', 'live-audio', 'live-video', 'video'] as const) {
      const skin = `${theme}-${preset}` as const;
      const rootId = `${root}/skins/${skinSourceDirectory(skin)}/skin.tsx?skin=${skin}&style=css&target=react`;
      const buttonId = `${root}/components/button.tsx?skin=${skin}&style=css&target=react`;
      const themedId = `${root}/components/themed.tsx?skin=${skin}&style=css&target=react`;
      const labelId = `${root}/components/label.tsx?skin=${skin}&style=css&target=react`;
      const rootSource = `import { Button } from '../../components/button';\nimport { Label } from '../../components/label';\nimport { Themed } from '../../components/themed';\nexport function ${pascalCase(theme)}${pascalCase(preset)}Skin() { return <><Button /><Label />{Themed}</>; }`;
      const labelSource =
        "import { Themed } from './themed';\nexport function Label() { return <span>{Themed}</span>; }";
      const buttonSource = `import { PlayButton } from '@videojs/react';\nimport { PlaybackRateRadioGroup } from '@videojs/react/ui/playback-rate-radio-group';\nimport { cn } from '${skinClassNameMergeImport}';\nexport function Button() { return <PlaybackRateRadioGroup.Root className={cn('button')}><PlayButton /></PlaybackRateRadioGroup.Root>; }`;

      modules.set(rootId, {
        id: rootId,
        filename: `${root}/skins/${skinSourceDirectory(skin)}/skin.tsx`,
        sourcePath: `skins/${skinSourceDirectory(skin)}/skin.tsx`,
        params: { skin, style: 'css', target: 'react' },
        source: rootSource,
        imports: [
          { ...importReference(rootSource, '../../components/button'), resolvedId: buttonId },
          { ...importReference(rootSource, '../../components/label'), resolvedId: labelId },
          { ...importReference(rootSource, '../../components/themed'), resolvedId: themedId },
        ],
        styles: { files: [], assets: [] },
        meta: {
          type: 'skin',
          name: skin,
          title: skin,
          description: skin,
          style: { scope: '.media-skin', theme, preset },
        },
      });
      modules.set(buttonId, {
        id: buttonId,
        filename: `${root}/components/button.tsx`,
        sourcePath: 'components/button.tsx',
        params: { skin, style: 'css', target: 'react' },
        source: buttonSource,
        imports: [
          importReference(buttonSource, '@videojs/react'),
          importReference(buttonSource, '@videojs/react/ui/playback-rate-radio-group'),
          importReference(buttonSource, skinClassNameMergeImport),
        ],
        styles: { files: [], assets: [] },
      });
      modules.set(labelId, {
        id: labelId,
        filename: `${root}/components/label.tsx`,
        sourcePath: 'components/label.tsx',
        params: { skin, style: 'css', target: 'react' },
        source: labelSource,
        imports: [{ ...importReference(labelSource, './themed'), resolvedId: themedId }],
        styles: { files: [], assets: [] },
      });
      modules.set(themedId, {
        id: themedId,
        filename: `${root}/components/themed.tsx`,
        sourcePath: 'components/themed.tsx',
        params: { skin, style: 'css', target: 'react' },
        source: `export const Themed = '${theme}';`,
        imports: [],
        styles: { files: [], assets: [] },
      });
    }
  }

  return { root, modules, assets: new Map() };
}

function importReference(source: string, specifier: string) {
  const start = source.indexOf(`'${specifier}'`);

  return { specifier, kind: 'static' as const, start, end: start + specifier.length + 2, quote: "'", bindings: [] };
}

function pascalCase(value: string): string {
  return value.replace(/(?:^|-)([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}
