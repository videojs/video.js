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
 * Builds the workspace the way the release job does and packs each public package, so evals can run against code that
 * is not on npm yet. Unlike pkg.pr.new previews, these packs keep real version numbers and the bundled docs. Returns
 * the packed tarballs.
 */
export function packWorkspace({ root, out, build }: PackOptions): string[] {
  if (build) {
    for (const script of BUILD_SCRIPTS) run('pnpm', [script], root);
  }

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  for (const dir of publicPackageDirs(root)) {
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

function publicPackageDirs(root: string): string[] {
  return PACKAGE_GROUPS.flatMap((group) =>
    readdirSync(join(root, group), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(root, group, entry.name))
      .filter((dir) => {
        const manifestPath = join(dir, 'package.json');
        if (!existsSync(manifestPath)) return false;

        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { name: string; private?: boolean };

        return !manifest.private;
      })
  );
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${cwd}.`);
}
