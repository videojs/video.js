import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

import { type BackgroundProcess, sh, startBackground } from '../lib/exec.ts';
import type { Fixture, PackageManager } from '../tasks.ts';

const LOCKFILES: Record<PackageManager, string> = {
  pnpm: 'pnpm-lock.yaml',
  npm: 'package-lock.json',
  yarn: 'yarn.lock',
  bun: 'bun.lock',
};

export interface ProjectCommands {
  /** Directory holding the app. Differs from the workspace when an agent scaffolds into a subdirectory. */
  root: string;
  packageManager: PackageManager | null;
  template: string | null;
  build: string | null;
  serve: string;
}

/** Resolves how to build and serve the finished project, detecting it for fixtures that start empty. */
export function projectCommands(workspace: string, fixture: Fixture): ProjectCommands | null {
  if (fixture.build !== 'detect') {
    return {
      root: join(workspace, fixture.root ?? ''),
      packageManager: fixture.packageManager,
      template: fixture.template,
      build: fixture.build,
      serve: fixture.serve,
    };
  }

  const root = findProjectRoot(workspace);

  // A plain page needs no package manager: a file server is all a static site gets in production too.
  if (!root) {
    return existsSync(join(workspace, 'index.html'))
      ? { root: workspace, packageManager: null, template: 'none', build: null, serve: 'static' }
      : null;
  }

  const pm = detectPackageManager(root);
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  const deps = { ...pkg.devDependencies, ...pkg.dependencies };
  const run = (script: string) => (pm === 'npm' ? `npm run ${script}` : `${pm} run ${script}`);
  const bin = (command: string) => (pm === 'npm' ? `npx ${command}` : `${pm} exec ${command}`);
  const build = pkg.scripts?.build ? run('build') : null;

  if ('next' in deps) {
    return {
      root,
      packageManager: pm,
      template: 'next',
      build,
      serve: bin('next start --port {port} --hostname 127.0.0.1'),
    };
  }

  if ('astro' in deps) {
    return {
      root,
      packageManager: pm,
      template: 'astro',
      build,
      serve: bin('astro preview --port {port} --host 127.0.0.1'),
    };
  }

  if ('@react-router/dev' in deps) {
    return {
      root,
      packageManager: pm,
      template: 'react-router',
      build,
      serve: `PORT={port} HOST=127.0.0.1 ${bin('react-router-serve ./build/server/index.js')}`,
    };
  }

  if ('vite' in deps) {
    return {
      root,
      packageManager: pm,
      template: 'vite',
      build,
      serve: bin('vite preview --port {port} --strictPort --host 127.0.0.1'),
    };
  }

  return { root, packageManager: pm, template: 'unknown', build, serve: `PORT={port} ${run('start')}` };
}

function findProjectRoot(workspace: string): string | null {
  if (existsSync(join(workspace, 'package.json'))) return workspace;

  const child = readdirSync(workspace, { withFileTypes: true }).find(
    (entry) =>
      entry.isDirectory() && entry.name !== 'node_modules' && existsSync(join(workspace, entry.name, 'package.json'))
  );

  return child ? join(workspace, child.name) : null;
}

function detectPackageManager(root: string): PackageManager {
  if (existsSync(join(root, 'pnpm-lock.yaml'))) return 'pnpm';

  if (existsSync(join(root, 'yarn.lock'))) return 'yarn';

  if (existsSync(join(root, 'bun.lock')) || existsSync(join(root, 'bun.lockb'))) return 'bun';

  return 'npm';
}

export interface StepResult {
  ok: boolean;
  durationMs: number;
  detail?: string;
}

export interface InstallResult extends StepResult {
  /** Whether the agent left the lockfile matching package.json, so installing changed nothing. */
  lockfileInSync: boolean | null;
}

export async function installDependencies(project: ProjectCommands, logFile: string): Promise<InstallResult | null> {
  const pm = project.packageManager;
  if (!pm || !existsSync(join(project.root, 'package.json'))) return null;

  const lockfile = join(project.root, LOCKFILES[pm]);
  const before = hashFile(lockfile);
  const command = pm === 'npm' ? 'npm install --no-audit --no-fund' : `${pm} install`;
  const result = await sh(command, { cwd: project.root, logFile, timeoutMs: 10 * 60_000, env: graderEnv() });
  const after = hashFile(lockfile);

  return {
    ok: result.code === 0,
    durationMs: result.durationMs,
    ...(result.code === 0 ? {} : { detail: lastLines(result.tail) }),
    lockfileInSync: before === null ? null : before === after,
  };
}

export async function buildProject(project: ProjectCommands, logFile: string): Promise<StepResult | null> {
  if (!project.build) return null;

  const result = await sh(project.build, { cwd: project.root, logFile, timeoutMs: 10 * 60_000, env: graderEnv() });

  return {
    ok: result.code === 0,
    durationMs: result.durationMs,
    ...(result.code === 0 ? {} : { detail: lastLines(result.tail) }),
  };
}

export interface RunningServer {
  url: string;
  stop: () => void;
}

export async function serveProject(
  project: ProjectCommands,
  staticServerPath: string,
  logFile: string
): Promise<RunningServer | { error: string }> {
  const port = await freePort();
  const url = `http://127.0.0.1:${port}/`;
  const command =
    project.serve === 'static'
      ? `node ${staticServerPath} . ${port}`
      : project.serve.replaceAll('{port}', String(port));
  const server = startBackground(command, { cwd: project.root, logFile, env: graderEnv() });
  const ready = await waitForServer(url, server, 120_000);

  if (!ready) {
    server.stop();

    return { error: server.exited() ? 'Server exited before responding.' : 'Server did not respond within 120 s.' };
  }

  return { url, stop: server.stop };
}

/** Grading runs like a developer's shell: no CI flag, so package managers may update an out-of-date lockfile. */
function graderEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, NEXT_TELEMETRY_DISABLED: '1', ASTRO_TELEMETRY_DISABLED: '1' };

  delete env.CI;
  delete env.NODE_ENV;

  return env;
}

async function waitForServer(url: string, server: BackgroundProcess, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline && !server.exited()) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (response.status < 500) return true;
    } catch {
      // Not listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  return false;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      server.close(() =>
        typeof address === 'object' && address ? resolve(address.port) : reject(new Error('No port'))
      );
    });
  });
}

function hashFile(path: string): string | null {
  return existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null;
}

function lastLines(text: string, count = 30): string {
  return text.trim().split('\n').slice(-count).join('\n');
}
