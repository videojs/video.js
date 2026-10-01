import assert from 'node:assert/strict';
import { globSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  createPackageTestSelection,
  createPackageTestShards,
  selectAffectedPackageNames,
} from '../package-test-matrix.js';

function workspacePackage(name, directory, dependencies = [], test = true) {
  return {
    name,
    directory,
    dependencies: new Set(dependencies),
    scripts: test ? { test: 'vp test run' } : {},
  };
}

const workspacePackages = [
  workspacePackage('@videojs/utils', 'packages/utils'),
  workspacePackage('@videojs/media', 'packages/media', ['@videojs/utils']),
  workspacePackage('@videojs/core', 'packages/core', ['@videojs/media']),
  workspacePackage('@videojs/react', 'packages/react', ['@videojs/core']),
  workspacePackage('@videojs/spf', 'packages/spf', ['@videojs/media']),
  workspacePackage('@videojs/sandbox', 'apps/sandbox', ['@videojs/react']),
  workspacePackage('@videojs/e2e', 'apps/e2e', ['@videojs/react'], false),
  workspacePackage('site', 'site', ['@videojs/react'], false),
];

describe('selectAffectedPackageNames', () => {
  it('selects a changed package and its transitive dependents', () => {
    const selected = selectAffectedPackageNames(workspacePackages, ['packages/media/src/index.ts']);

    assert.deepEqual(selected, [
      '@videojs/core',
      '@videojs/media',
      '@videojs/react',
      '@videojs/sandbox',
      '@videojs/spf',
    ]);
  });

  it('does not select dependency tests when only a dependent changed', () => {
    const selected = selectAffectedPackageNames(workspacePackages, ['packages/react/src/player.tsx']);

    assert.deepEqual(selected, ['@videojs/react', '@videojs/sandbox']);
  });

  it('ignores changes owned by separately tested workspaces', () => {
    const selected = selectAffectedPackageNames(workspacePackages, ['apps/e2e/suites/player/player.test.ts']);

    assert.deepEqual(selected, []);
  });

  it('selects every test for shared toolchain changes', () => {
    const selected = selectAffectedPackageNames(workspacePackages, ['build/task.ts']);

    assert.deepEqual(selected, [
      '@videojs/core',
      '@videojs/media',
      '@videojs/react',
      '@videojs/sandbox',
      '@videojs/spf',
      '@videojs/utils',
    ]);
  });

  it('falls back to every test for an unknown package path', () => {
    const selected = selectAffectedPackageNames(workspacePackages, ['packages/removed/src/index.ts']);

    assert.equal(selected.length, 6);
  });
});

describe('createPackageTestShards', () => {
  it('limits fan-out and keeps every package in exactly one shard', () => {
    const packages = Array.from({ length: 23 }, (_, index) => `package-${index}`);
    const shards = createPackageTestShards(packages);
    const selected = shards.flatMap((shard) => shard.packages);

    assert.equal(shards.length, 4);
    assert.deepEqual(selected.sort(), packages.sort());
  });
});

describe('createPackageTestSelection', () => {
  it('discovers every current package test and separates SPF for its container', () => {
    const root = fileURLToPath(new URL('../../..', import.meta.url));
    const workspace = readFileSync(new URL('../../../pnpm-workspace.yaml', import.meta.url), 'utf8');
    const packagePatterns = workspace.match(/^packages:\n((?:  - .+\n)+)/m);
    assert.ok(packagePatterns, 'Expected workspace package patterns.');

    const patterns = [...packagePatterns[1].matchAll(/^  - ['"]?([^'"\n]+?)['"]?$/gm)].map((match) => match[1]);
    const manifests = globSync(patterns.map((pattern) => `${pattern}/package.json`), { cwd: root });
    const expected = manifests
      .filter((path) => path.startsWith('packages/') || path === 'apps/sandbox/package.json')
      .map((path) => JSON.parse(readFileSync(new URL(path, new URL('../../../', import.meta.url)), 'utf8')))
      .filter((manifest) => manifest.scripts?.test)
      .map((manifest) => manifest.name)
      .sort();

    assert.ok(expected.length > 0);

    const selection = createPackageTestSelection({
      root,
      forceAll: true,
    });
    const standardPackages = selection.matrix.include.flatMap((shard) => shard.packages);

    assert.equal(selection.runSpf, true);
    assert.equal(selection.hasStandardTests, true);
    assert.deepEqual(selection.affected, expected);
    assert.deepEqual(standardPackages.sort(), expected.filter((name) => name !== '@videojs/spf'));
  });
});
