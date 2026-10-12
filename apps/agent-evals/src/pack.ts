import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { EVALS_ROOT } from './tasks.ts';

/** The checkout this harness lives in. */
export const REPO_ROOT = resolve(EVALS_ROOT, '../..');
const PACKAGE_GROUPS = ['packages', 'packages/adapters', 'packages/extensions'];
const BUILD_SCRIPTS = ['build:packages', 'build:cdn', 'build:site'];

export interface PackOptions {
  /** Repository checkout to build and pack. */
  root: string;
  out: string;
  build: boolean;
}

/**
 * Builds the workspace the way the release job does and packs each public package, with the private workspace packages
 * they depend on, so evals can run against code that is not on npm yet. Unlike pkg.pr.new previews, these packs keep
 * real version numbers and the bundled docs. Returns the packed tarballs.
 */
export function packWorkspace({ root, out, build }: PackOptions): string[] {
  if (build) {
    for (const script of BUILD_SCRIPTS) run('pnpm', [script], root);
  }

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  for (const dir of packageDirs(root)) {
    run('pnpm', ['pack', '--pack-destination', out], dir);
  }

  const tarballs = readdirSync(out).filter((file) => file.endsWith('.tgz'));
  const react = tarballs.find((file) => file.startsWith('videojs-react-'));
  const listing = react ? spawnSync('tar', ['-tzf', join(out, react)], { encoding: 'utf8' }).stdout : '';

  if (!listing.includes('package/docs/llms.txt')) {
    console.warn('Warning: @videojs/react was packed without bundled docs. Build the site before packing.');
  }

  return tarballs.map((file) => join(out, file));
}

interface WorkspaceManifest {
  name: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

/**
 * Every public package, and every workspace package they depend on. Packing pins a workspace dependency to its exact
 * version, so a private one must be packed too: `@videojs/core` depends on `video.js` before `video.js` publishes.
 */
function packageDirs(root: string): string[] {
  const workspace = new Map(
    PACKAGE_GROUPS.flatMap((group) =>
      readdirSync(join(root, group), { withFileTypes: true })
        .map((entry) => join(root, group, entry.name))
        .filter((dir) => existsSync(join(dir, 'package.json')))
        .map((dir) => {
          const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as WorkspaceManifest;

          return [manifest.name, { dir, manifest }] as const;
        })
    )
  );
  const packed = new Set(
    [...workspace.values()].filter(({ manifest }) => !manifest.private).map(({ manifest }) => manifest.name)
  );

  // A set visits what is added while iterating it, so this walks the whole dependency closure.
  for (const name of packed) {
    const { dependencies, optionalDependencies, peerDependencies } = workspace.get(name)!.manifest;

    for (const dependency of Object.keys({ ...dependencies, ...optionalDependencies, ...peerDependencies })) {
      if (workspace.has(dependency)) packed.add(dependency);
    }
  }

  return [...packed].map((name) => workspace.get(name)!.dir);
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${cwd}.`);
}
