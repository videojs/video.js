import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import packageJson from '../../package.json' with { type: 'json' };

const bin = resolve(import.meta.dirname, '../..', packageJson.bin['create-skin']);
const registry = resolve(import.meta.dirname, 'fixtures/registry');
const directories: string[] = [];

function run(...args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
}

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'videojs-create-skin-'));

  directories.push(directory);

  return directory;
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('bin', () => {
  it('prints help and the version', () => {
    expect(run('--help').stdout).toContain('npm create @videojs/skin');
    expect(run('--version').stdout).toBe(`${packageJson.version}\n`);
  });

  it('creates a project without prompting under --yes', () => {
    const directory = join(temporaryDirectory(), 'neon');
    const result = run(directory, '--name', 'Neon', '--yes', '--no-install', '--registry', registry);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Edit your skin in src/video');
    expect(result.stdout).toContain('--framework react --styling tailwind --base scaffold --preset video --no-install');
    expect(existsSync(join(directory, 'src/video/skin.tsx'))).toBe(true);
    expect(existsSync(join(directory, 'apps/preview/src/player.tsx'))).toBe(true);
  });

  it('asks for the choices it cannot prompt for without a terminal', () => {
    const directory = join(temporaryDirectory(), 'neon');
    const result = run(directory, '--no-install', '--registry', registry, '--base', 'scaffold');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('No terminal to ask in');
    expect(result.stderr).toContain('--name (required)');
    expect(result.stderr).toContain('--framework (default: react)');
    expect(result.stderr).not.toContain('--base (default');
    expect(existsSync(directory)).toBe(false);
  });

  it('runs without --yes when every choice is passed', () => {
    const directory = join(temporaryDirectory(), 'neon');
    const result = run(
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
      registry
    );

    expect(result.status).toBe(0);
    expect(existsSync(join(directory, 'src/video/skin.html'))).toBe(true);
  });

  it('still needs a name under --yes', () => {
    const result = run(join(temporaryDirectory(), 'neon'), '--yes', '--no-install', '--registry', registry);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('--yes accepts every default, but these have none');
    expect(result.stderr).toContain('--name (required)');
    expect(result.stderr).not.toContain('--framework (default');
  });

  it('refuses a directory that already has files', () => {
    const directory = temporaryDirectory();

    writeFileSync(join(directory, 'index.html'), '');

    const result = run(directory, '--name', 'Neon', '--yes', '--no-install', '--registry', registry);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('is not empty');
  });
});
