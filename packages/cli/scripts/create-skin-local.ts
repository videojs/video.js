/**
 * Run `videojs skin create` against this checkout instead of npm and the hosted registry: it builds the CLI, packs the
 * Video.js packages a skin needs into tarballs, and points the CLI at the local registry build and templates. Every
 * argument is passed through, so prompts and flags work as they will after publishing. Relative paths resolve from
 * where you ran the command. From the repository root: `pnpm create:skin ~/skins/neon --name Neon --framework html`.
 */
import { execFile, spawn } from 'node:child_process';
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

const execFileAsync = promisify(execFile);
const packageDir = resolve(import.meta.dirname, '..');
const workspaceDir = resolve(packageDir, '../..');
const registryDir = resolve(workspaceDir, 'packages/skins/dist/shadcn');
/** Packed tarballs live outside the checkout; the new project only points at them. */
const tarballDir = join(tmpdir(), 'videojs-create-skin', 'packages');
/** Packages a generated project installs directly; the closure adds their workspace dependencies. */
const roots = ['@videojs/core', '@videojs/html', '@videojs/mux-audio', '@videojs/mux-video', '@videojs/react'];

/** Run a build step without its logs, printing them only if it fails. */
async function quietly(command: string, args: string[]): Promise<void> {
  try {
    await execFileAsync(command, args, { cwd: workspaceDir, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // SAFETY: `execFile` rejects with an Error carrying the captured streams.
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string };

    process.stderr.write(`${stdout}${stderr}`);
    throw new Error(`\`${command} ${args.join(' ')}\` failed; its output is above.`);
  }
}

/** Run the CLI in this terminal and resolve with its exit code, so its prompts and output are the only thing shown. */
function interactive(command: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });

    child.on('error', reject);
    child.on('exit', (code) => resolvePromise(code ?? 1));
  });
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

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');

  console.log('Building @videojs/cli…');
  await quietly('pnpm', ['exec', 'vp', 'run', '@videojs/cli#build']);

  if (!existsSync(join(registryDir, 'r'))) {
    console.log('Building the skin registry…');
    await quietly('pnpm', ['build:shadcn']);
  }

  console.log('Packing workspace packages…\n');
  const overrides = await packWorkspace();

  // The CLI reports its own errors; pass its exit code on without adding to them.
  process.exitCode = await interactive(
    process.execPath,
    [
      join(packageDir, 'dist/index.mjs'),
      'skin',
      'create',
      ...args,
      '--package-manager',
      'pnpm',
      '--registry',
      registryDir,
      // The templates in this checkout, rather than a download of the commit the CLI was built from.
      '--templates',
      join(packageDir, 'templates/skin'),
      ...overrides.flatMap((override) => ['--override', override]),
    ],
    // pnpm runs scripts from the package directory; resolve relative paths from where the command was typed.
    process.env.INIT_CWD ?? process.cwd()
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
