import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import packageJson from '../../../package.json' with { type: 'json' };

const bin = resolve(import.meta.dirname, '../../..', packageJson.bin.videojs);
const registry = resolve(import.meta.dirname, 'fixtures/registry');
const directories: string[] = [];

// No `--templates`: the built CLI reads the templates published beside it.
function run(args: string[], env?: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [bin, 'skin', 'create', ...args], { encoding: 'utf8', env });
}

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'videojs-create-skin-'));

  directories.push(directory);

  return directory;
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('runSkinCommand', () => {
  it('prints help and the version', () => {
    expect(run(['--help']).stdout).toContain('npx @videojs/cli skin create');
    expect(run(['--version']).stdout).toBe(`${packageJson.version}\n`);
  });

  it('creates a project without prompting under --yes', () => {
    const directory = join(temporaryDirectory(), 'neon');
    const result = run([
      directory,
      '--name',
      'Neon',
      '--yes',
      '--package-manager',
      'npm',
      '--no-install',
      '--registry',
      registry,
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Edit your skin in src/video');
    expect(result.stdout).toContain(
      `npx @videojs/cli@${packageJson.version} skin create ${directory} --name Neon --framework react --styling tailwind`
    );
    expect(result.stdout).toContain('--preset video --package-manager npm --no-install');
    expect(existsSync(join(directory, 'src/video/skin.tsx'))).toBe(true);
    expect(existsSync(join(directory, 'apps/preview/src/player.tsx'))).toBe(true);
  });

  it('asks for the choices it cannot prompt for without a terminal', () => {
    const directory = join(temporaryDirectory(), 'neon');
    const result = run([directory, '--no-install', '--registry', registry, '--base', 'scaffold']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('No terminal to ask in');
    expect(result.stderr).toContain('--name (required)');
    expect(result.stderr).toContain('--framework (default: react)');
    expect(result.stderr).not.toContain('--base (default');
    expect(existsSync(directory)).toBe(false);
  });

  it('runs without --yes when every choice is passed', () => {
    const directory = join(temporaryDirectory(), 'neon');
    const result = run([
      directory,
      '--name',
      'Neon',
      '--framework',
      'html',
      '--base',
      'scaffold',
      '--preset',
      'video',
      '--no-install',
      '--registry',
      registry,
    ]);

    expect(result.status).toBe(0);
    expect(existsSync(join(directory, 'src/video/skin.html'))).toBe(true);
  });

  it('still needs a name under --yes', () => {
    const result = run([join(temporaryDirectory(), 'neon'), '--yes', '--no-install', '--registry', registry]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--yes accepts every default, but these have none');
    expect(result.stderr).toContain('--name (required)');
    expect(result.stderr).not.toContain('--framework (default');
  });

  it('refuses a directory that already has files before asking for anything else', () => {
    const directory = temporaryDirectory();

    writeFileSync(join(directory, 'index.html'), '');

    const result = run([directory, '--no-install', '--registry', registry]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('is not empty');
    expect(result.stderr).not.toContain('--name (required)');
  });

  it('still prints the next steps when the install fails', () => {
    const directory = join(temporaryDirectory(), 'neon');
    // An empty PATH makes the package manager impossible to start.
    const result = run([directory, '--name', 'Neon', '--yes', '--package-manager', 'pnpm', '--registry', registry], {
      PATH: temporaryDirectory(),
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('The install failed');
    expect(result.stdout).toContain('  pnpm install\n  pnpm dev');
    expect(result.stdout).toContain('To create the same skin without questions');
    expect(existsSync(join(directory, 'src/video/skin.tsx'))).toBe(true);
  });
});
