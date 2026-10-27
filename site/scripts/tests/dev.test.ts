import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { missingPrerequisites } from '../dev.ts';

const temporaryDirectories: string[] = [];

function createSiteRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'site-dev-'));

  temporaryDirectories.push(root);
  return root;
}

function populate(root: string): void {
  for (const kind of ['component', 'util', 'feature', 'media', 'preset']) {
    const directory = join(root, `src/content/generated-${kind}-reference`);

    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'entry.json'), '{}');
  }

  writeFileSync(join(root, 'src/content/generated-mcp-surface.json'), '{}');

  for (const name of ['@videojs/html', '@videojs/installation', '@videojs/react']) {
    mkdirSync(join(root, 'node_modules', name, 'dist'), { recursive: true });
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('missingPrerequisites', () => {
  it('lists every generated collection and workspace build when nothing exists', () => {
    expect(missingPrerequisites(createSiteRoot())).toEqual([
      'src/content/generated-component-reference',
      'src/content/generated-util-reference',
      'src/content/generated-feature-reference',
      'src/content/generated-media-reference',
      'src/content/generated-preset-reference',
      'src/content/generated-mcp-surface.json',
      '@videojs/html build',
      '@videojs/installation build',
      '@videojs/react build',
    ]);
  });

  it('returns nothing once generated content and package builds are present', () => {
    const root = createSiteRoot();

    populate(root);

    expect(missingPrerequisites(root)).toEqual([]);
  });

  it('treats a reference directory without JSON files as missing', () => {
    const root = createSiteRoot();

    populate(root);
    rmSync(join(root, 'src/content/generated-util-reference/entry.json'));

    expect(missingPrerequisites(root)).toEqual(['src/content/generated-util-reference']);
  });
});
