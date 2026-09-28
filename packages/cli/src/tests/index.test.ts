import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import packageJson from '../../package.json' with { type: 'json' };

const bin = resolve(import.meta.dirname, '../..', packageJson.bin.videojs);

function run(...args: string[]): string {
  return execFileSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
}

function runWithStderr(...args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
}

describe('bin', () => {
  it('reports the CLI package and its version', () => {
    expect(JSON.parse(run('--version', '--json'))).toEqual({
      schemaVersion: 1,
      kind: 'version',
      package: '@videojs/cli',
      packageVersion: packageJson.version,
    });
  });

  it('points the deprecated docs and config commands at agents init', () => {
    for (const command of ['docs', 'config']) {
      const result = runWithStderr(command, 'installation');

      expect(result.status).toBe(0);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain(`\`videojs ${command}\` is deprecated`);
      expect(result.stderr).toContain('npx @videojs/cli agents init');
      expect(result.stderr).toContain('npx @videojs/cli agents skills');
    }
  });

  it('prints version-pinned commands for this release', () => {
    expect(run('agents', 'init')).toContain(`npx @videojs/cli@${packageJson.version} agents init`);
  });

  it('defaults a plain HTML page to CDN scripts', () => {
    const page = mkdtempSync(join(tmpdir(), 'videojs-cli-'));

    try {
      writeFileSync(join(page, 'index.html'), '<!doctype html>');

      const plan = JSON.parse(
        execFileSync(process.execPath, [bin, 'agents', 'init', '--media', 'hls', '--json'], {
          cwd: page,
          encoding: 'utf8',
        })
      );

      expect(plan.selectedOptions).toMatchObject({ method: 'cdn', template: 'none' });
      expect(plan.defaultedOptionSources.method).toBe('an index.html page with no package.json');
    } finally {
      rmSync(page, { recursive: true, force: true });
    }
  });

  it('lists both commands for a bare or top-level help run', () => {
    for (const output of [run(), run('--help')]) {
      expect(output).toContain('`npx @videojs/cli agents init`');
      expect(output).toContain('`npx @videojs/cli agents skills`');
    }

    expect(run('agents', 'init')).toContain(`npx @videojs/cli@${packageJson.version} agents init`);
  });

  it('prints skill install steps for every agent or only the selected ones', () => {
    const every = run('agents', 'skills');
    const selected = run('agents', 'skills', '--agent', 'claude-code,cursor');

    for (const heading of [
      '## Codex (`codex`)',
      '## Claude Code (`claude-code`)',
      '## VS Code (`vscode`)',
      '## Cursor (`cursor`)',
      '## Other coding agents (`other`)',
    ]) {
      expect(every).toContain(heading);
    }

    expect(selected).toContain('claude plugin install videojs@videojs');
    expect(selected).toContain('## Cursor');
    expect(selected).not.toContain('## Codex');
    expect(selected).not.toContain('npx skills add');
  });

  it('returns the skill instructions as JSON', () => {
    const value = JSON.parse(run('agents', 'skills', '--agent', 'other', '--global', '--json'));

    expect(value).toMatchObject({
      schemaVersion: 1,
      kind: 'skills',
      package: '@videojs/cli',
      packageVersion: packageJson.version,
      selectedOptions: { agent: ['other'], global: true },
    });
    expect(value.agents[0].steps[0].commands).toEqual(['npx skills add https://github.com/videojs/skills -g']);
  });

  it('exits with a usage error for an unknown agent', () => {
    const text = runWithStderr('agents', 'skills', '--agent', 'nope');
    const json = runWithStderr('agents', 'skills', '--agent', 'nope', '--json');

    expect(text.status).toBe(2);
    expect(text.stderr).toContain('- --agent "nope": Expected a comma-separated list containing codex, claude-code');
    expect(json.status).toBe(2);
    expect(JSON.parse(json.stdout)).toMatchObject({ kind: 'error', errors: [{ field: '--agent', value: 'nope' }] });
  });

  it('names both subcommands for an unknown one', () => {
    const result = runWithStderr('agents', 'install');

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Expected `agents init` or `agents skills`.');
  });

  it('bundles the installation renderer so only Node built-ins are imported at runtime', () => {
    const [shebang, ...lines] = readFileSync(bin, 'utf8').split('\n');
    // Bundled output hoists every module import to the top; later `import` text belongs to generated code samples.
    const header = lines.slice(
      0,
      lines.findIndex((line) => !line.startsWith('import '))
    );
    const specifiers = header.map((line) => line.match(/ from "([^"]+)";$/)?.[1]);

    expect(shebang).toBe('#!/usr/bin/env node');
    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers.every((specifier) => specifier?.startsWith('node:'))).toBe(true);
  });
});
