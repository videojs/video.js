/**
 * Point `videojs skin create` at this checkout instead of npm and the hosted registry. Shared by
 * `create-skin-local.ts`, which runs the command for a person, and `check-skin-projects.ts`, which runs it for every
 * supported combination.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

interface Manifest {
  name?: string;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface LocalCli {
  /** The built CLI entry, run with `node`. */
  entry: string;
  /** Flags that select the local registry build and replace every Video.js package with its packed tarball. */
  args: string[];
}

export const execFileAsync = promisify(execFile);
const packageDir = resolve(import.meta.dirname, '..');

export const workspaceDir = resolve(packageDir, '../..');
const registryDir = resolve(workspaceDir, 'packages/skins/dist/shadcn');
/** Packed tarballs live outside the checkout; the new project only points at them. */
const tarballDir = join(tmpdir(), 'videojs-create-skin', 'packages');
/** Packages a generated project installs directly; the closure adds their workspace dependencies. */
const roots = ['@videojs/core', '@videojs/html', '@videojs/mux-audio', '@videojs/mux-video', '@videojs/react'];

/** Run a build step without its logs, printing them only if it fails. */
export async function quietly(command: string, args: string[], cwd = workspaceDir): Promise<void> {
  try {
    await execFileAsync(command, args, { cwd, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // SAFETY: `execFile` rejects with an Error carrying the captured streams.
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string };

    process.stderr.write(`${stdout}${stderr}`);
    throw new Error(`\`${command} ${args.join(' ')}\` failed; its output is above.`);
  }
}

async function workspacePackages(): Promise<Map<string, { directory: string; manifest: Manifest }>> {
  const packages = new Map<string, { directory: string; manifest: Manifest }>();
  const candidates: string[] = [];

  for (const entry of await readdir(resolve(workspaceDir, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const directory = resolve(workspaceDir, 'packages', entry.name);

    if (existsSync(join(directory, 'package.json'))) candidates.push(directory);
    else {
      for (const nested of await readdir(directory, { withFileTypes: true })) {
        if (nested.isDirectory()) candidates.push(join(directory, nested.name));
      }
    }
  }

  for (const directory of candidates) {
    const source = await readFile(join(directory, 'package.json'), 'utf8').catch(() => undefined);
    if (!source) continue;

    // SAFETY: workspace manifests are package.json objects; only optional fields are read.
    const manifest = JSON.parse(source) as Manifest;

    if (manifest.name) packages.set(manifest.name, { directory, manifest });
  }

  return packages;
}

async function packWorkspace(): Promise<string[]> {
  const packages = await workspacePackages();
  const required = new Set<string>();
  const pending = [...roots];

  while (pending.length > 0) {
    const name = pending.pop()!;
    if (required.has(name)) continue;

    required.add(name);

    const { manifest } = packages.get(name)!;

    for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies })) {
      if (packages.has(dependency)) pending.push(dependency);
    }
  }

  const missing = [...required].filter((name) => !existsSync(join(packages.get(name)!.directory, 'dist')));

  if (missing.length > 0) {
    throw new Error(
      `Build the workspace packages first (pnpm build:packages). Missing dist/ in ${missing.join(', ')}.`
    );
  }

  await mkdir(tarballDir, { recursive: true });

  return Promise.all(
    [...required].sort().map(async (name) => {
      const { stdout } = await execFileAsync(
        'pnpm',
        ['pack', '--config.ignore-scripts=true', '--pack-destination', tarballDir, '--json'],
        { cwd: packages.get(name)!.directory }
      );
      // SAFETY: `pnpm pack --json` prints one pack result, or an array holding one.
      const output = JSON.parse(stdout) as { filename: string } | { filename: string }[];
      const filename = Array.isArray(output) ? output[0]!.filename : output.filename;

      return `${name}=file:${resolve(packages.get(name)!.directory, filename)}`;
    })
  );
}

/**
 * Build the CLI and the registry, then pack the workspace packages a generated project installs. Both builds are cached
 * tasks, so an up-to-date checkout replays them, and a registry built from an older commit is never copied.
 */
export async function prepareLocalCli(): Promise<LocalCli> {
  console.log('Building @videojs/cli and the skin registry…');
  await quietly('pnpm', ['exec', 'vp', 'run', '@videojs/cli#build']);
  await quietly('pnpm', ['exec', 'vp', 'run', '@videojs/skins#build:shadcn']);

  console.log('Packing workspace packages…\n');
  const overrides = await packWorkspace();

  return {
    entry: join(packageDir, 'dist/index.mjs'),
    args: ['--registry', registryDir, ...overrides.flatMap((override) => ['--override', override])],
  };
}
