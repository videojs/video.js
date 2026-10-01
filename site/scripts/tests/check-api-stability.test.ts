import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  applyTagChange,
  collectImports,
  collectPackageEntries,
  collectPageCoverage,
  collectPublicExports,
  type Coverage,
  declaredApis,
  documentedStability,
  findDeclarations,
  findStaleApis,
  findUnexportedExports,
  findSourceDeclarations,
  findUnstableImports,
  fixSourceFile,
  isCoveredName,
  matchesModulePattern,
  parseFrontmatter,
  PROPAGATE_THROUGH_HERITAGE,
  type PublicExport,
  resolveStabilities,
  type Stability,
  type TagChange,
  tagChange,
  tagViolation,
} from '../check-api-stability.ts';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

/** Write `files` under a fresh temporary root laid out like the monorepo (`packages/<pkg>/{dist,src}`). */
function fixture(files: Record<string, string>): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'api-stability-')));

  directories.push(root);

  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }

  return root;
}

function exportsOf(root: string, entries: Record<string, string>): PublicExport[] {
  const publicEntries = Object.entries(entries).map(([specifier, path]) => ({
    specifier,
    declarationFile: join(root, path),
  }));

  return collectPublicExports(publicEntries, root).exports;
}

function byName(records: readonly PublicExport[], name: string): PublicExport {
  const record = records.find((candidate) => candidate.name === name);
  if (!record) throw new Error(`No export named ${name}`);

  return record;
}

function page(frontmatter: string, body = ''): string {
  return `---\n${frontmatter}\n---\n${body}`;
}

function coverage(overrides: Partial<Coverage> = {}): Coverage {
  return { stable: new Set(), unstable: new Set(), stableModules: [], unstableModules: [], ...overrides };
}

function record(name: string, options: { exportedNames?: string[]; specifiers?: string[]; file?: string } = {}) {
  return {
    name,
    exportedNames: new Set(options.exportedNames ?? [name]),
    specifiers: new Set(options.specifiers ?? ['@videojs/react']),
    file: options.file,
  };
}

function edit(source: string, name: string, change: TagChange): string {
  const sourceFile = ts.createSourceFile('file.ts', source, ts.ScriptTarget.Latest, true);

  return applyTagChange(source, sourceFile, findDeclarations(sourceFile, name)[0]!, change);
}

function tag(source: string, name: string, tagName: 'internal' | 'experimental' = 'internal'): string {
  return edit(source, name, { add: tagName, remove: [] });
}

describe('parseFrontmatter', () => {
  it('reads block and inline apis lists', () => {
    expect(parseFrontmatter(page('title: Video preset\napis:\n  - videoFeatures\n  - "VideoFeatures"')).apis).toEqual([
      'videoFeatures',
      'VideoFeatures',
    ]);
    expect(parseFrontmatter(page("apis: [selectTime, '@videojs/react/i18n/locales/*']")).apis).toEqual([
      'selectTime',
      '@videojs/react/i18n/locales/*',
    ]);
  });

  it('reads nested frameworkTitle values and stability', () => {
    const frontmatter = parseFrontmatter(
      page('title: PlayButton\nframeworkTitle:\n  html: media-play-button\nstability: unstable')
    );

    expect(frontmatter.title).toBe('PlayButton');
    expect(frontmatter.frameworkTitle).toEqual(['media-play-button']);
    expect(frontmatter.stability).toBe('unstable');
  });
});

describe('collectPageCoverage', () => {
  it('covers the subject from the title, framework title, and doc component props', () => {
    const { names } = collectPageCoverage(
      page(
        'title: PlayButton\nframeworkTitle:\n  html: media-play-button',
        '<ComponentImports component="PlayButton" html={["play-button", "play-button-icon"]} />'
      )
    );

    expect([...names]).toEqual(expect.arrayContaining(['PlayButton', 'PlayButtonIcon']));
  });

  it('names an HTML element subject without its `media-` prefix only from the framework title', () => {
    expect([...collectPageCoverage(page('title: media-text')).names]).toEqual(['MediaText']);
    expect(collectPageCoverage(page('title: PlayButton\nframeworkTitle:\n  html: media-play-button')).names).toEqual(
      new Set(['PlayButton'])
    );
    expect(collectPageCoverage(page('title: Menus\nframeworkTitle:\n  html: media-menu')).names).toEqual(
      new Set(['Menus', 'Menu'])
    );
  });

  it('covers parts written against a subject, including nested parts', () => {
    const { names } = collectPageCoverage(
      page('title: Slider', '```tsx\n<Slider.Thumbnail.Root />\n<Other.Part />\n```')
    );

    expect(names).toContain('SliderThumbnail');
    expect(names).toContain('SliderThumbnailRoot');
    expect(names).not.toContain('OtherPart');
  });

  it('covers selectors only on feature pages', () => {
    const body = 'Pass `selectVolume` to `usePlayer`.';

    expect(
      collectPageCoverage(page('title: Volume', `<FeatureReference feature="volume" />\n${body}`)).names
    ).toContain('selectVolume');
    expect(collectPageCoverage(page('title: usePlayer', body)).names).not.toContain('selectVolume');
  });

  it("doesn't cover a feature page's title, which is a label rather than an export", () => {
    const { names } = collectPageCoverage(page('title: Volume', '<FeatureReference feature="volume" />'));

    expect(names).toContain('volumeFeature');
    expect(names).not.toContain('Volume');
  });

  it('ignores names that only appear in prose or example code', () => {
    const { names } = collectPageCoverage(
      page('title: usePlayer', 'Use a helper.\n\n```ts\nimport { helper } from "x";\n```')
    );

    expect(names).not.toContain('helper');
  });

  it('covers names in code headings and in the first column of the Exports tables', () => {
    const { names } = collectPageCoverage(
      page(
        'title: Media capability guards',
        [
          '## Guards',
          '### `isMediaPauseCapable`',
          '### Using `isMediaSeekCapable`',
          '```md\n## `fencedHeading`\n```',
          '| Guard | Adds |\n| --- | --- |\n| `isMediaVolumeCapable` | `volume` |',
          '## Exports',
          '| Export | Description |\n| --- | --- |\n| `VideoPlayer`, `VideoPlayerProps` | The `player`. |',
          '| Entry point | Registers |\n| --- | --- |\n| `@videojs/html/video/player` | `<video-player>` |',
          '## Skins',
          '| `VideoSkin` | Not an export table. |',
        ].join('\n\n')
      )
    );

    expect(names).toContain('isMediaPauseCapable');
    expect(names).toContain('VideoPlayer');
    expect(names).toContain('VideoPlayerProps');

    for (const name of ['isMediaSeekCapable', 'fencedHeading', 'isMediaVolumeCapable', 'player', 'VideoSkin']) {
      expect(names).not.toContain(name);
    }
  });

  it('splits apis into names and module patterns and reports unstable pages', () => {
    const result = collectPageCoverage(
      page("title: Locales\nstability: unstable\napis: [Locale, '@videojs/html/i18n/locales/*']")
    );

    expect(result.names).toContain('Locale');
    expect(result.modules).toEqual(['@videojs/html/i18n/locales/*']);
    expect(result.unstable).toBe(true);
  });
});

describe('isCoveredName', () => {
  const covered = new Set(['PlayButton', 'useHotkey', 'useQualityOptions']);

  it('matches subjects and their companion types', () => {
    expect(isCoveredName('PlayButton', covered)).toBe(true);
    expect(isCoveredName('PlayButtonProps', covered)).toBe(true);
    expect(isCoveredName('PlayButtonElement', covered)).toBe(true);
  });

  it('matches hook companions by case and `use` prefix', () => {
    expect(isCoveredName('UseHotkeyOptions', covered)).toBe(true);
    expect(isCoveredName('QualityOptionsResult', covered)).toBe(true);
  });

  it('does not match unrelated names, a bare `use` prefix, or a differently cased name', () => {
    expect(isCoveredName('PlayButtonCore', covered)).toBe(false);
    expect(isCoveredName('Hotkey', covered)).toBe(false);
    expect(isCoveredName('UseHotkey', covered)).toBe(false);
  });
});

describe('matchesModulePattern', () => {
  it('matches one path segment per wildcard', () => {
    expect(matchesModulePattern('@videojs/react/i18n/locales/ja', ['@videojs/react/i18n/locales/*'])).toBe(true);
    expect(matchesModulePattern('@videojs/react/i18n/locales/ja/register', ['@videojs/react/i18n/locales/*'])).toBe(
      false
    );
  });
});

describe('documentedStability', () => {
  it('prefers stable coverage over unstable coverage', () => {
    const docs = coverage({ stable: new Set(['Video']), unstable: new Set(['Video', 'DashVideo']) });

    expect(documentedStability(record('VideoProps'), docs)).toBe('stable');
    expect(documentedStability(record('DashVideo'), docs)).toBe('experimental');
    expect(documentedStability(record('createButton'), docs)).toBe('internal');
  });

  it("covers a companion only when the subject's framework package declares it", () => {
    const docs = coverage({ stable: new Set(['Menu', 'useStore']) });

    expect(documentedStability(record('MenuProps', { file: '/repo/packages/react/src/menu.tsx' }), docs)).toBe(
      'stable'
    );
    expect(documentedStability(record('MenuProps', { file: 'C:\\repo\\packages\\react\\src\\menu.tsx' }), docs)).toBe(
      'stable'
    );
    expect(
      documentedStability(
        record('MenuOptions', { file: '/repo/packages/core/src/menu.ts', specifiers: ['@videojs/html'] }),
        docs
      )
    ).toBe('internal');
    expect(
      documentedStability(
        record('StoreOptions', { file: '/repo/packages/store/src/store.ts', specifiers: ['@videojs/store'] }),
        docs
      )
    ).toBe('internal');
  });

  it('covers an export under any of its public names', () => {
    const docs = coverage({ stable: new Set(['AudioTrackRadioGroup']) });

    expect(
      documentedStability(record('AudioTrackRadioGroupLegacy', { exportedNames: ['AudioTrackRadioGroup'] }), docs)
    ).toBe('stable');
  });

  it('covers default exports by module pattern', () => {
    const docs = coverage({ stableModules: ['@videojs/react/i18n/locales/*'] });

    expect(documentedStability(record('default', { specifiers: ['@videojs/react/i18n/locales/ja'] }), docs)).toBe(
      'stable'
    );
    expect(documentedStability(record('default', { specifiers: ['@videojs/core/vjsc'] }), docs)).toBe('internal');
    expect(documentedStability(record('all', { specifiers: ['@videojs/react/i18n/locales/all'] }), docs)).toBe(
      'internal'
    );
  });

  it('covers every export of an exact entry point', () => {
    const docs = coverage({ stableModules: ['@videojs/react/icons'] });

    expect(documentedStability(record('PlayIcon', { specifiers: ['@videojs/react/icons'] }), docs)).toBe('stable');
    expect(documentedStability(record('PlayIcon', { specifiers: ['@videojs/react/icons/minimal'] }), docs)).toBe(
      'internal'
    );
  });

  it('keeps exports only internal packages expose internal, whatever their name', () => {
    const docs = coverage({ stable: new Set(['PlayButton', 'Video']), stableModules: ['@videojs/core/*'] });

    expect(documentedStability(record('PlayButtonState', { specifiers: ['@videojs/core'] }), docs)).toBe('internal');
    expect(documentedStability(record('Video', { specifiers: ['@videojs/media', '@videojs/core/dom'] }), docs)).toBe(
      'internal'
    );
    expect(documentedStability(record('default', { specifiers: ['@videojs/core/vjsc'] }), docs)).toBe('internal');
    expect(
      documentedStability(record('PlayButtonState', { specifiers: ['@videojs/core', '@videojs/react'] }), docs)
    ).toBe('stable');
  });

  it('matches a documented name across framework-facing packages', () => {
    const docs = coverage({ stable: new Set(['PlayButton']) });

    expect(documentedStability(record('PlayButton', { specifiers: ['@videojs/html'] }), docs)).toBe('stable');
    expect(documentedStability(record('PlayButtonProps', { specifiers: ['@videojs/react'] }), docs)).toBe('stable');
    expect(documentedStability(record('PlayButton', { specifiers: ['@videojs/element'] }), docs)).toBe('internal');
  });
});

describe('findStaleApis', () => {
  const surface = {
    exports: [
      record('PlayIcon', { specifiers: ['@videojs/react/icons'] }),
      record('PlayButtonState', { specifiers: ['@videojs/core'] }),
    ],
    unresolved: ['@videojs/mux-data#MuxDataOptions'],
  };

  it('reports names and module patterns that match no framework-facing export', () => {
    const stale = findStaleApis(
      [
        {
          file: 'icons.mdx',
          apis: ['PlayIcon', 'PlayButtonState', 'RemovedIcon', '@videojs/react/icons', '@videojs/react/emoji/*'],
        },
        { file: 'mux-data.mdx', apis: ['MuxDataOptions', '@videojs/mux-data'] },
      ],
      surface
    );

    expect(stale).toEqual([
      { file: 'icons.mdx', api: 'PlayButtonState' },
      { file: 'icons.mdx', api: 'RemovedIcon' },
      { file: 'icons.mdx', api: '@videojs/react/emoji/*' },
    ]);
  });
});

describe('declaredApis', () => {
  it('reads apis entries, code headings, and Exports-table names, so a rename in any of them goes stale', () => {
    const source = page(
      'title: Presets\napis: [PlayIcon]',
      [
        '### `MinimalVideoSkin`',
        '',
        '## Exports',
        '',
        '| Export | Description |',
        '|---|---|',
        '| `VideoSkin` | The skin |',
        '',
        '```ts',
        '### `NotAHeading`',
        '```',
      ].join('\n')
    );

    expect(declaredApis(source)).toEqual(['PlayIcon', 'MinimalVideoSkin', 'VideoSkin']);
  });
});

describe('tagChange', () => {
  it('accepts @internal or @deprecated for internal exports, and replaces @experimental', () => {
    expect(tagChange(new Set(), 'internal')).toEqual({ add: 'internal', remove: [] });
    expect(tagChange(new Set(['deprecated']), 'internal')).toBeUndefined();
    expect(tagChange(new Set(['experimental']), 'internal')).toEqual({ add: 'internal', remove: ['experimental'] });
  });

  it('replaces @internal with @experimental for exports documented on unstable pages', () => {
    expect(tagChange(new Set(['internal']), 'experimental')).toEqual({ add: 'experimental', remove: ['internal'] });
    expect(tagChange(new Set(['internal', 'experimental']), 'experimental')).toEqual({ remove: ['internal'] });
    expect(tagChange(new Set(['experimental']), 'experimental')).toBeUndefined();
  });

  it('removes tags that contradict a stable page', () => {
    expect(tagChange(new Set(), 'stable')).toBeUndefined();
    expect(tagChange(new Set(['deprecated']), 'stable')).toBeUndefined();
    expect(tagChange(new Set(['internal', 'experimental']), 'stable')).toEqual({
      remove: ['internal', 'experimental'],
    });
  });
});

describe('tagViolation', () => {
  it('explains a missing tag, including on only some declarations', () => {
    expect(tagViolation({ declarationTags: [new Set()] }, 'internal')).toBe('needs @internal');
    expect(tagViolation({ declarationTags: [new Set(['internal']), new Set()] }, 'internal')).toBe(
      'needs @internal on 1 of 2 declarations'
    );
    expect(tagViolation({ declarationTags: [new Set(['internal'])] }, 'internal')).toBeUndefined();
  });

  it('reports a tag that contradicts the page', () => {
    expect(tagViolation({ declarationTags: [new Set(['internal'])] }, 'stable')).toBe(
      'is documented on a reference page but tagged @internal — remove the tag'
    );
    expect(tagViolation({ declarationTags: [new Set(['experimental'])] }, 'internal')).toBe(
      'is neither documented nor referenced but tagged @experimental — use @internal'
    );
    expect(tagViolation({ declarationTags: [new Set(['internal'])] }, 'experimental')).toBe(
      'is documented on an unstable page but tagged @internal — use @experimental'
    );
  });

  it('names the export that made it stable or experimental, counting the others', () => {
    const referrers = [record('PlayButtonProps'), record('PlayButton'), record('usePlayButton')];

    expect(tagViolation({ declarationTags: [new Set(['internal'])] }, 'stable', referrers.slice(0, 1))).toBe(
      'is stable because PlayButtonProps (@videojs/react) references it — remove @internal'
    );
    expect(tagViolation({ declarationTags: [new Set(['internal'])] }, 'stable', referrers)).toBe(
      'is stable because PlayButtonProps (@videojs/react) references it (+2 more) — remove @internal'
    );
    expect(tagViolation({ declarationTags: [new Set(['internal'])] }, 'experimental', referrers.slice(0, 1))).toBe(
      'is experimental because PlayButtonProps (@videojs/react) references it — use @experimental instead of @internal'
    );
    expect(tagViolation({ declarationTags: [new Set()] }, 'experimental', referrers.slice(0, 1))).toBe(
      'needs @experimental because PlayButtonProps (@videojs/react) references it'
    );
  });
});

describe('applyTagChange', () => {
  it('creates a JSDoc block when the declaration has none', () => {
    expect(tag('export function foo() {}\n', 'foo')).toBe('/** @internal */\nexport function foo() {}\n');
  });

  it('expands a single-line comment and separates the tag from the description', () => {
    expect(tag('/** Does foo. */\nexport const foo = 1;\n', 'foo')).toBe(
      '/**\n * Does foo.\n *\n * @internal\n */\nexport const foo = 1;\n'
    );
  });

  it('appends after existing tags and keeps indentation', () => {
    expect(tag('/** @param a - A. */\nexport function foo(a: number) {}\n', 'foo', 'experimental')).toBe(
      '/**\n * @param a - A.\n * @experimental\n */\nexport function foo(a: number) {}\n'
    );
    expect(tag('class A {}\n  /**\n   * Does foo.\n   *   indented\n   */\n  export const foo = 1;\n', 'foo')).toBe(
      'class A {}\n  /**\n   * Does foo.\n   *   indented\n   *\n   * @internal\n   */\n  export const foo = 1;\n'
    );
  });

  it('inserts where the formatter keeps the tag: after an @example block and before @see', () => {
    const example = '/**\n * Does foo.\n *\n * @example\n *   ```ts\n *   @decorator foo();\n *   ```\n */\n';

    expect(tag(`${example}export const foo = 1;\n`, 'foo')).toBe(
      '/**\n * Does foo.\n *\n * @example\n *   ```ts\n *   @decorator foo();\n *   ```\n *\n * @internal\n */\nexport const foo = 1;\n'
    );
    expect(
      tag('/**\n * Does foo.\n *\n * @param a - A.\n * @see bar\n */\nexport function foo(a: number) {}\n', 'foo')
    ).toBe(
      '/**\n * Does foo.\n *\n * @param a - A.\n * @internal\n * @see bar\n */\nexport function foo(a: number) {}\n'
    );
  });

  it('tags a default export', () => {
    expect(tag("export default { a: 'b' };\n", 'default')).toBe("/** @internal */\nexport default { a: 'b' };\n");
  });

  it('removes a tag, deleting a comment it leaves empty and collapsing one that fits a line', () => {
    const remove: TagChange = { remove: ['internal'] };

    expect(edit('/** @internal */\nexport const foo = 1;\n', 'foo', remove)).toBe('export const foo = 1;\n');
    expect(edit('/**\n * Does foo.\n *\n * @internal\n */\nexport const foo = 1;\n', 'foo', remove)).toBe(
      '/** Does foo. */\nexport const foo = 1;\n'
    );
    expect(
      edit(
        '/**\n * Does foo.\n *\n * @internal\n * @param a - A.\n */\nexport function foo(a: number) {}\n',
        'foo',
        remove
      )
    ).toBe('/**\n * Does foo.\n *\n * @param a - A.\n */\nexport function foo(a: number) {}\n');
  });

  it('keeps the text a removed tag carried as the description', () => {
    expect(
      edit('/** @internal Adapter for presets. */\nexport const foo = 1;\n', 'foo', { remove: ['internal'] })
    ).toBe('/** Adapter for presets. */\nexport const foo = 1;\n');
  });

  it('replaces @internal with @experimental in place', () => {
    expect(
      edit('/**\n * Does foo.\n *\n * @internal\n * @see bar\n */\nexport const foo = 1;\n', 'foo', {
        add: 'experimental',
        remove: ['internal'],
      })
    ).toBe('/**\n * Does foo.\n *\n * @experimental\n * @see bar\n */\nexport const foo = 1;\n');
    expect(
      edit('/** @experimental */\nexport const foo = 1;\n', 'foo', { add: 'internal', remove: ['experimental'] })
    ).toBe('/** @internal */\nexport const foo = 1;\n');
  });

  it('creates a JSDoc block above directive comments so they still apply to the declaration', () => {
    expect(tag('// @ts-expect-error -- untyped\nexport const foo: string = 1;\n', 'foo')).toBe(
      '/** @internal */\n// @ts-expect-error -- untyped\nexport const foo: string = 1;\n'
    );
    expect(tag('// Explains foo.\nexport const foo = 1;\n', 'foo')).toBe(
      '// Explains foo.\n/** @internal */\nexport const foo = 1;\n'
    );
  });
});

describe('findDeclarations', () => {
  it('finds the declaration behind `export default x`', () => {
    const sourceFile = ts.createSourceFile(
      'file.ts',
      '/** Messages. */\nconst messages = {};\n\nexport default messages;\n',
      ts.ScriptTarget.Latest,
      true
    );
    const [declaration] = findDeclarations(sourceFile, 'default');

    expect(declaration && ts.isVariableStatement(declaration)).toBe(true);
  });

  it('finds names bound by a destructured export, including renamed ones', () => {
    const sourceFile = ts.createSourceFile(
      'player.ts',
      'export const { Player: VideoPlayer, usePlayer } = createPlayer();\n',
      ts.ScriptTarget.Latest,
      true
    );

    expect(findDeclarations(sourceFile, 'VideoPlayer')).toHaveLength(1);
    expect(findDeclarations(sourceFile, 'usePlayer')).toHaveLength(1);
    expect(findDeclarations(sourceFile, 'Player')).toHaveLength(0);
  });
});

describe('fixSourceFile', () => {
  function fix(source: string, fixes: Record<string, Stability>): string {
    const file = join(fixture({ 'file.ts': source }), 'file.ts');

    fixSourceFile(file, new Map(Object.entries(fixes)));

    return readFileSync(file, 'utf8');
  }

  it('tags every overload signature of a function, but not its implementation', () => {
    const file = join(
      fixture({
        'overloads.ts': '/** One. */\nexport function foo(): void;\nexport function foo(a?: number): void {}\n',
      }),
      'overloads.ts'
    );

    expect(fixSourceFile(file, new Map([['foo', 'internal']]))).toBe(1);
    expect(readFileSync(file, 'utf8')).toBe(
      '/**\n * One.\n *\n * @internal\n */\nexport function foo(): void;\nexport function foo(a?: number): void {}\n'
    );
  });

  it('tags each untagged declaration of a merged name', () => {
    expect(fix('/** @internal */\nexport const Foo = 1;\nexport interface Foo {}\n', { Foo: 'internal' })).toBe(
      '/** @internal */\nexport const Foo = 1;\n/** @internal */\nexport interface Foo {}\n'
    );
  });

  it('removes a tag from a documented export and replaces it on an unstable one', () => {
    expect(
      fix('/** @internal */\nexport const foo = 1;\n\n/** @internal */\nexport const bar = 1;\n', {
        foo: 'stable',
        bar: 'experimental',
      })
    ).toBe('export const foo = 1;\n\n/** @experimental */\nexport const bar = 1;\n');
  });
});

describe('findSourceDeclarations', () => {
  const root = join(import.meta.dirname, '..', '..', '..');

  it('maps a built declaration that mirrors src', () => {
    const declarations = findSourceDeclarations(
      join(root, 'packages/utils/dist/object/shallow-equal.d.ts'),
      'shallowEqual'
    );

    expect(declarations?.file).toBe(join(root, 'packages/utils/src/object/shallow-equal.ts'));
  });

  it('finds the authored module behind a renamed or bundled entry', () => {
    expect(findSourceDeclarations(join(root, 'packages/core/dist/dev/i18n/text/airplay.d.ts'), 'startText')?.file).toBe(
      join(root, 'packages/core/src/core/i18n/text/airplay.ts')
    );
    expect(
      findSourceDeclarations(
        join(root, 'packages/adapters/mux-video/dist/dev/mux/dist/dev/source.d.ts'),
        'MuxDrmParams'
      )?.file
    ).toBe(join(root, 'packages/adapters/mux/src/source.ts'));
  });
});

describe('collectPackageEntries', () => {
  it('expands wildcard exports to one entry per declaration file and skips private packages', () => {
    const root = fixture({
      'pkg/package.json': JSON.stringify({
        name: '@videojs/pkg',
        exports: {
          '.': { types: './dist/index.d.ts' },
          './ui/*': { types: './dist/ui/*/index.d.ts' },
          './styles.css': './dist/styles.css',
        },
      }),
      'pkg/dist/index.d.ts': '',
      'pkg/dist/ui/play-button/index.d.ts': '',
      'pkg/dist/ui/play-button/parts.d.ts': '',
      'pkg/dist/ui/time/index.d.ts': '',
      'private/package.json': JSON.stringify({ name: '@videojs/private', private: true, exports: { '.': './a.d.ts' } }),
    });

    expect(collectPackageEntries(join(root, 'pkg'))).toEqual([
      { specifier: '@videojs/pkg', declarationFile: join(root, 'pkg/dist/index.d.ts') },
      { specifier: '@videojs/pkg/ui/play-button', declarationFile: join(root, 'pkg/dist/ui/play-button/index.d.ts') },
      { specifier: '@videojs/pkg/ui/time', declarationFile: join(root, 'pkg/dist/ui/time/index.d.ts') },
    ]);
    expect(collectPackageEntries(join(root, 'private'))).toEqual([]);
  });
});

describe('collectPublicExports', () => {
  it('records renamed exports under their source name, with bundler `_default` and `$1` names undone', () => {
    const root = fixture({
      'packages/react/dist/index.d.ts': [
        "export { Foo as Bar } from './foo.js';",
        'interface IconProps$1 { size: number }',
        'declare const _default: { hello: string };',
        'export { IconProps$1 as IconProps, _default as default };',
      ].join('\n'),
      'packages/react/dist/foo.d.ts': 'export declare const Foo: number;\n',
      'packages/react/src/foo.ts': '/** @internal */\nexport const Foo = 1;\n',
      'packages/react/src/index.ts':
        "/** @internal */\nexport interface IconProps { size: number }\n\n/** @internal */\nexport default { hello: 'x' };\n",
    });
    const exports = exportsOf(root, { '@videojs/react': 'packages/react/dist/index.d.ts' });

    expect(byName(exports, 'Foo')).toMatchObject({
      exportedNames: new Set(['Bar']),
      file: join(root, 'packages/react/src/foo.ts'),
      hasSource: true,
      declarationTags: [new Set(['internal'])],
    });
    expect(byName(exports, 'IconProps').file).toBe(join(root, 'packages/react/src/index.ts'));
    expect(byName(exports, 'default')).toMatchObject({ hasSource: true, declarationTags: [new Set(['internal'])] });
  });

  it('checks namespace members under flattened part names and merges them with direct exports', () => {
    const root = fixture({
      'packages/react/dist/slider.parts.d.ts': [
        'declare function SliderBuffer(): void;',
        'declare namespace slider_parts_d_exports {',
        '  export { SliderBuffer as Buffer };',
        '}',
        'export { SliderBuffer as Buffer, slider_parts_d_exports };',
      ].join('\n'),
      'packages/react/dist/features.d.ts': 'export declare const pipFeature: { name: string };\n',
      'packages/react/dist/feature.parts.d.ts': "export { pipFeature as pip } from './features.js';\n",
      'packages/react/dist/index.d.ts': [
        "import { slider_parts_d_exports } from './slider.parts.js';",
        "export * as features from './feature.parts.js';",
        "export { pipFeature } from './features.js';",
        'export { slider_parts_d_exports as Slider };',
      ].join('\n'),
      'packages/html/dist/thumb.d.ts': 'export declare function SliderThumb(): void;\n',
      'packages/html/dist/parts.d.ts': "export { SliderThumb as Thumb } from './thumb.js';\n",
      'packages/html/dist/index.d.ts': "export * as Slider from './parts.js';\n",
    });
    const exports = exportsOf(root, {
      '@videojs/react': 'packages/react/dist/index.d.ts',
      '@videojs/react/slider-parts': 'packages/react/dist/slider.parts.d.ts',
      '@videojs/html': 'packages/html/dist/index.d.ts',
    });

    expect(exports.map((entry) => entry.name).sort()).toEqual(['SliderBuffer', 'SliderThumb', 'pipFeature']);
    expect(byName(exports, 'SliderBuffer').exportedNames).toEqual(new Set(['SliderBuffer', 'Buffer']));
    expect(byName(exports, 'SliderThumb').exportedNames).toEqual(new Set(['SliderThumb']));
    expect(byName(exports, 'pipFeature').exportedNames).toEqual(new Set(['features.pip', 'pipFeature']));
  });

  it('keeps the tags of each merged declaration and ignores an overload implementation', () => {
    const root = fixture({
      'packages/react/dist/index.d.ts': [
        'export declare const Player: Player;',
        'export interface Player { a: number }',
        'export declare function load(): void;',
        'export declare function load(a: number): void;',
      ].join('\n'),
      'packages/react/src/index.ts': [
        '/** @internal */',
        'export const Player = { a: 1 };',
        'export interface Player { a: number }',
        '/** @internal */',
        'export function load(): void;',
        '/** @internal */',
        'export function load(a: number): void;',
        'export function load(a?: number): void {}',
      ].join('\n'),
    });
    const exports = exportsOf(root, { '@videojs/react': 'packages/react/dist/index.d.ts' });

    expect(tagViolation(byName(exports, 'Player'), 'internal')).toBe('needs @internal on 1 of 2 declarations');
    expect(tagViolation(byName(exports, 'load'), 'internal')).toBeUndefined();
  });

  it('reports exports that resolve to no declaration', () => {
    const root = fixture({
      'packages/react/dist/index.d.ts': "export { Missing } from 'not-installed';\nexport declare const a: number;\n",
    });
    const surface = collectPublicExports(
      [{ specifier: '@videojs/react', declarationFile: join(root, 'packages/react/dist/index.d.ts') }],
      root
    );

    expect(surface.unresolved).toEqual(['@videojs/react#Missing']);
    expect(surface.exports.map((entry) => entry.name)).toEqual(['a']);
  });
});

describe('resolveStabilities', () => {
  const root = fixture({
    'packages/core/dist/index.d.ts': [
      'export interface CoreState { paused: boolean }',
      'export interface CoreOptions { label: string; nested: CoreOption }',
      'export interface CoreOption { value: number }',
      'export interface Secret { value: number }',
      'export interface Hidden { value: number }',
      'export interface Unreached { value: number }',
      'export interface Contract { value: number }',
      'export interface Bound { value: number }',
      'export interface Fallback { value: number }',
      'export type Aliased = { value: number }',
      'export declare class AdapterCore { src: string }',
      'export interface MixinOptions { value: number }',
      'export interface PreviewState { value: number }',
      'export interface Guarded { value: number }',
      'export interface Narrowed { value: number }',
      'export declare class BaseCore { base: number; protected narrowed: object }',
      'export declare namespace ButtonCore { export type Props = { disabled: boolean } }',
    ].join('\n'),
    'packages/react/dist/index.d.ts': [
      'import {',
      '  AdapterCore, Aliased, BaseCore, Bound, ButtonCore, Contract, CoreOptions, CoreState, Fallback, Hidden,',
      '  Guarded, MixinOptions, Narrowed, PreviewState, Secret,',
      "} from '../../core/dist/index.js';",
      // Like bundled output: `export {}` stops a declaration file exporting every top-level declaration.
      'export {};',
      'interface Helper {',
      '  state: Secret;',
      '  /** @internal */',
      '  hidden: Hidden;',
      '}',
      'export interface PlayButtonProps { state: CoreState; core: ButtonCore.Props }',
      'export interface PlayButtonState extends Helper {}',
      'export interface PlayButtonContract extends Contract {}',
      'export declare class PlayButtonController implements Contract {}',
      'export type PlayButtonAlias = Aliased;',
      'export declare function usePlayButtonValue<T extends Bound = Fallback>(value: T): T;',
      'type Constructor<T> = { new (): T; options: MixinOptions };',
      'declare const HlsVideo_base: Constructor<AdapterCore>;',
      'export declare class HlsVideo extends HlsVideo_base {}',
      'export declare class PlayButtonElement extends BaseCore {',
      '  private secret: Secret;',
      '  protected guarded: Guarded;',
      '  protected narrowed: Narrowed;',
      '  /** @internal */',
      '  hidden: Secret;',
      '  state: PlayButtonState;',
      '}',
      'export declare function usePlayButton(options: CoreOptions): PlayButtonState;',
      'export interface DashVideoProps { preview: PreviewState; state: CoreState }',
    ].join('\n'),
  });
  const exports = exportsOf(root, {
    '@videojs/core': 'packages/core/dist/index.d.ts',
    '@videojs/react': 'packages/react/dist/index.d.ts',
  });
  const docs = coverage({
    stable: new Set([
      'PlayButton',
      'usePlayButton',
      'PlayButtonAlias',
      'PlayButtonContract',
      'PlayButtonController',
      'usePlayButtonValue',
      'HlsVideo',
    ]),
    unstable: new Set(['DashVideo']),
  });

  function resolve(options?: { heritage?: boolean }): Record<string, string> {
    const resolved = resolveStabilities(exports, docs, options);

    return Object.fromEntries(
      [...resolved].map(([entry, { stability, referrers }]) => [
        entry.name,
        referrers.length > 0 ? `${stability} <- ${referrers.map((referrer) => referrer.name).join(', ')}` : stability,
      ])
    );
  }

  it('makes what a stable export names stable, even when only an internal package exposes it', () => {
    expect(resolve()).toMatchObject({
      PlayButtonProps: 'stable',
      CoreState: 'stable <- PlayButtonProps',
      ButtonCore: 'stable <- PlayButtonProps',
      CoreOptions: 'stable <- usePlayButton',
    });
  });

  it('propagates through chains of references', () => {
    expect(resolve().CoreOption).toBe('stable <- CoreOptions');
  });

  it('makes what only experimental exports name experimental, and keeps stable what a stable export also names', () => {
    expect(resolve()).toMatchObject({
      DashVideoProps: 'experimental',
      PreviewState: 'experimental <- DashVideoProps',
      CoreState: 'stable <- PlayButtonProps',
    });
  });

  it('propagates through type alias targets and type parameter constraints and defaults', () => {
    expect(resolve()).toMatchObject({
      Aliased: 'stable <- PlayButtonAlias',
      Bound: 'stable <- usePlayButtonValue',
      Fallback: 'stable <- usePlayButtonValue',
    });
  });

  it('propagates through the public surface of types no entry exports', () => {
    expect(resolve().Secret).toBe('stable <- PlayButtonState');
    expect(resolve().MixinOptions).toBe('stable <- HlsVideo');
  });

  it('expands utils type aliases instead of making them stable, and propagates through their targets', () => {
    const root = fixture({
      'packages/utils/dist/types.d.ts': [
        'export type Constructor<T> = new (...args: any[]) => T;',
        'export interface Callbacks { connectedCallback?(): void }',
      ].join('\n'),
      'packages/core/dist/index.d.ts': 'export interface ElementState { ready: boolean }\n',
      'packages/html/dist/index.d.ts': [
        "import { Callbacks, Constructor } from '../../utils/dist/types.js';",
        "import { ElementState } from '../../core/dist/index.js';",
        'export interface PlayButtonOptions { base: Constructor<ElementState>; callbacks: Callbacks }',
      ].join('\n'),
    });
    const records = exportsOf(root, {
      '@videojs/utils/types': 'packages/utils/dist/types.d.ts',
      '@videojs/core': 'packages/core/dist/index.d.ts',
      '@videojs/html': 'packages/html/dist/index.d.ts',
    });
    const resolved = resolveStabilities(records, coverage({ stable: new Set(['PlayButton']) }));
    const stability = (name: string) => resolved.get(byName(records, name))!.stability;

    expect(stability('Constructor')).toBe('internal');
    expect(stability('ElementState')).toBe('stable');
    expect(stability('Callbacks')).toBe('stable');
  });

  it('does not propagate through a global interface the packages augment', () => {
    const root = fixture({
      'packages/html/dist/index.d.ts': [
        'export declare class PlayButtonElement { query<K extends keyof HTMLElementTagNameMap>(tag: K): HTMLElementTagNameMap[K] }',
        'export declare class DashVideoElement { src: string }',
        'declare global { interface HTMLElementTagNameMap { "dash-video": DashVideoElement } }',
      ].join('\n'),
    });
    const records = exportsOf(root, { '@videojs/html': 'packages/html/dist/index.d.ts' });
    const resolved = resolveStabilities(records, coverage({ stable: new Set(['PlayButton']) }));

    expect(resolved.get(byName(records, 'DashVideoElement'))!.stability).toBe('internal');
  });

  it('ignores hidden members and exports nothing names', () => {
    expect(resolve()).toMatchObject({ Hidden: 'internal', Unreached: 'internal' });
  });

  it('propagates through protected members, but not through a narrower redeclaration of an inherited one', () => {
    expect(resolve()).toMatchObject({ Guarded: 'stable <- PlayButtonElement', Narrowed: 'internal' });
  });

  it('propagates through heritage clauses unless heritage propagation is off', () => {
    expect(PROPAGATE_THROUGH_HERITAGE).toBe(true);
    expect(resolve().BaseCore).toBe('stable <- PlayButtonElement');
    expect(resolve({ heritage: true }).BaseCore).toBe('stable <- PlayButtonElement');
    expect(resolve({ heritage: false }).BaseCore).toBe('internal');
    expect(resolve().Contract).toBe('stable <- PlayButtonContract, PlayButtonController');
    expect(resolve({ heritage: false }).Contract).toBe('internal');
  });

  it("propagates through a mixin's base constant as heritage", () => {
    expect(resolve().AdapterCore).toBe('stable <- HlsVideo');
    expect(resolve({ heritage: false }).AdapterCore).toBe('internal');
  });

  it('fixes the tags of exports a reference made stable or experimental', () => {
    const tagged = fixture({
      'packages/core/dist/index.d.ts': 'export interface CoreState {}\nexport interface PreviewState {}\n',
      'packages/core/src/index.ts':
        '/** @internal */\nexport interface CoreState {}\n\n/** @internal */\nexport interface PreviewState {}\n',
      'packages/react/dist/index.d.ts': [
        "import { CoreState, PreviewState } from '../../core/dist/index.js';",
        'export interface PlayButtonProps { state: CoreState }',
        'export interface DashVideoProps { preview: PreviewState }',
      ].join('\n'),
    });
    const records = exportsOf(tagged, {
      '@videojs/core': 'packages/core/dist/index.d.ts',
      '@videojs/react': 'packages/react/dist/index.d.ts',
    });
    const resolved = resolveStabilities(records, docs);
    const coreState = byName(records, 'CoreState');

    expect(tagViolation(coreState, 'stable', resolved.get(coreState)!.referrers)).toBe(
      'is stable because PlayButtonProps (@videojs/react) references it — remove @internal'
    );

    const fixes = new Map(
      records.filter((entry) => entry.hasSource).map((entry) => [entry.name, resolved.get(entry)!.stability] as const)
    );

    fixSourceFile(join(tagged, 'packages/core/src/index.ts'), fixes);

    expect(readFileSync(join(tagged, 'packages/core/src/index.ts'), 'utf8')).toBe(
      'export interface CoreState {}\n\n/** @experimental */\nexport interface PreviewState {}\n'
    );
  });
});

describe('findUnexportedExports', () => {
  const root = fixture({
    'packages/core/dist/index.d.ts': [
      'export interface CoreState { paused: boolean }',
      'export interface SharedState { paused: boolean }',
      'export interface EngineState { ready: boolean }',
      'export interface Unreached { value: number }',
    ].join('\n'),
    'packages/adapters/hlsjs-video/dist/index.d.ts': 'export interface HlsConfig { debug: boolean }\n',
    'packages/spf/dist/index.d.ts': "export { EngineState } from '../../core/dist/index.js';\n",
    'packages/extensions/mux-data/dist/index.d.ts': 'export interface MuxDataOptions { key: string }\n',
    'packages/react/dist/index.d.ts': [
      "import { CoreState, EngineState, SharedState } from '../../core/dist/index.js';",
      "import { MuxDataOptions } from '../../extensions/mux-data/dist/index.js';",
      "export { SharedState } from '../../core/dist/index.js';",
      'export interface PlayButtonProps { state: CoreState; shared: SharedState; engine: EngineState; data: MuxDataOptions }',
    ].join('\n'),
    'packages/react/dist/media/hlsjs-video.d.ts': [
      "import { HlsConfig } from '../../../adapters/hlsjs-video/dist/index.js';",
      'export interface HlsJsVideoProps { config: HlsConfig }',
    ].join('\n'),
  });
  const exports = exportsOf(root, {
    '@videojs/core': 'packages/core/dist/index.d.ts',
    '@videojs/hlsjs-video': 'packages/adapters/hlsjs-video/dist/index.d.ts',
    '@videojs/spf': 'packages/spf/dist/index.d.ts',
    '@videojs/mux-data': 'packages/extensions/mux-data/dist/index.d.ts',
    '@videojs/react': 'packages/react/dist/index.d.ts',
    '@videojs/react/media/hlsjs-video': 'packages/react/dist/media/hlsjs-video.d.ts',
  });
  const docs = coverage({ stable: new Set(['PlayButton', 'HlsJsVideo']) });
  const unexported = findUnexportedExports(resolveStabilities(exports, docs), {
    adapters: new Set(['@videojs/hlsjs-video']),
    extensions: new Set(['@videojs/mux-data']),
  });
  const reasons = Object.fromEntries(unexported.map(({ record, reason }) => [record.name, reason]));

  it('reports a stable export only internal packages export', () => {
    expect(reasons.CoreState).toBe(
      'is stable (PlayButtonProps references it) but no framework-facing package exports it — re-export it from @videojs/react / @videojs/html'
    );
  });

  it("suggests an adapter's media entry for a type only the adapter exports", () => {
    expect(reasons.HlsConfig).toBe(
      'is stable (HlsJsVideoProps references it) but only @videojs/hlsjs-video exports it — re-export it from @videojs/react/media/hlsjs-video / @videojs/html/media/hlsjs-video'
    );
  });

  it('does not count other published packages, such as SPF, as framework-facing', () => {
    expect(reasons.EngineState).toMatch(/no framework-facing package exports it/);
  });

  it('accepts exports a framework-facing or extension package also exports, and ignores internal ones', () => {
    expect(Object.keys(reasons).sort()).toEqual(['CoreState', 'EngineState', 'HlsConfig']);
  });
});

describe('collectImports', () => {
  it('collects named, default, and dynamic imports from @videojs packages', () => {
    const imports = collectImports(
      [
        "import { PlayButton, type PlayButtonProps as Props } from '@videojs/react';",
        "import de from '@videojs/react/i18n/locales/de';",
        "const ja = () => import('@videojs/react/i18n/locales/ja');",
        "import '@videojs/html/ui/play-button';",
        "import { clsx } from 'clsx';",
      ].join('\n'),
      'page.mdx'
    );

    expect(imports.map(({ name, specifier }) => `${specifier}#${name}`)).toEqual([
      '@videojs/react#PlayButton',
      '@videojs/react#PlayButtonProps',
      '@videojs/react/i18n/locales/de#default',
      '@videojs/react/i18n/locales/ja#default',
      '@videojs/html/ui/play-button#*',
    ]);
  });

  it('collects namespace imports and re-exports, so the internal-package warning sees them', () => {
    const imports = collectImports(
      [
        "import * as Utils from '@videojs/utils/time';",
        "export { formatTime } from '@videojs/utils/time';",
        "export * from '@videojs/core/dom';",
      ].join('\n'),
      'page.mdx'
    );

    expect(imports.map(({ name, specifier }) => `${specifier}#${name}`)).toEqual([
      '@videojs/utils/time#*',
      '@videojs/utils/time#formatTime',
      '@videojs/core/dom#*',
    ]);
    expect(findUnstableImports(imports, new Map()).map(({ reason }) => reason)).toEqual([
      'internal package',
      'internal package',
      'internal package',
    ]);
  });
});

describe('findUnstableImports', () => {
  it('flags internal packages and exports that are not stable', () => {
    const stabilities = new Map([
      ['@videojs/react#PlayButton', 'stable' as const],
      ['@videojs/react#usePlayerContext', 'internal' as const],
    ]);
    const warnings = findUnstableImports(
      [
        { file: 'a.mdx', name: 'PlayButton', specifier: '@videojs/react' },
        { file: 'a.mdx', name: 'usePlayerContext', specifier: '@videojs/react' },
        { file: 'a.mdx', name: 'formatTime', specifier: '@videojs/utils/time' },
      ],
      stabilities
    );

    expect(warnings.map(({ name, reason }) => `${name}: ${reason}`)).toEqual([
      'usePlayerContext: internal',
      'formatTime: internal package',
    ]);
  });
});
