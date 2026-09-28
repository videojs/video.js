import { describe, expect, it } from 'vite-plus/test';

import { parseWorkspaceCatalog, prepareTemplateManifest } from '../../scripts/template.js';

const workspaceYaml = `
packages:
  - 'packages/*'
  - 'packages/adapters/*'

catalog:
  vite: npm:@voidzero-dev/vite-plus-core@0.2.8
  # pinned with the toolchain
  vitest: 4.1.10
  'vite-plus': 0.2.8
overrides:
  vite: 'catalog:'
`;

describe('parseWorkspaceCatalog', () => {
  it('reads the default catalog block and stops at the next key', () => {
    expect(parseWorkspaceCatalog(workspaceYaml)).toEqual({
      vite: 'npm:@voidzero-dev/vite-plus-core@0.2.8',
      vitest: '4.1.10',
      'vite-plus': '0.2.8',
    });
  });
});

describe('prepareTemplateManifest', () => {
  const catalog = { 'vite-plus': '0.2.8', vitest: '4.1.10' };
  const isPrivate = (name: string) => name === '@videojs/icons';

  it('inlines catalog specs and drops private workspace dependencies', () => {
    const prepared = prepareTemplateManifest(
      {
        name: '@videojs/sandbox',
        dependencies: { '@videojs/html': 'workspace:*', '@videojs/icons': 'workspace:*', clsx: '^2.1.1' },
        devDependencies: { 'vite-plus': 'catalog:', vitest: 'catalog:', tsx: '^4.23.1' },
      },
      { catalog, isPrivate }
    );

    expect(prepared).toEqual({
      name: '@videojs/sandbox',
      dependencies: { '@videojs/html': 'workspace:*', clsx: '^2.1.1' },
      devDependencies: { 'vite-plus': '0.2.8', vitest: '4.1.10', tsx: '^4.23.1' },
    });
  });

  it('refuses a catalog spec the workspace does not define', () => {
    expect(() => prepareTemplateManifest({ devDependencies: { oxlint: 'catalog:' } }, { catalog, isPrivate })).toThrow(
      /no entry/
    );
    expect(() =>
      prepareTemplateManifest({ devDependencies: { vitest: 'catalog:tools' } }, { catalog, isPrivate })
    ).toThrow(/named catalog/);
  });
});
