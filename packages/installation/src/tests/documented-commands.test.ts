import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { runAgentsInit, runAgentsSkills } from '../node';

const workspaceRoot = resolve(import.meta.dirname, '../../../..');

describe('documented agents commands', () => {
  it('accepts every command in the root and package READMEs', () => {
    const readmes = [
      resolve(workspaceRoot, 'README.md'),
      ...globSync('packages/{*,adapters/*,extensions/*}/README.md', { cwd: workspaceRoot }).map((path) =>
        resolve(workspaceRoot, path)
      ),
    ];
    const failures: string[] = [];
    let commandCount = 0;

    for (const readme of readmes) {
      const source = readFileSync(readme, 'utf8');

      expect(source, readme).not.toMatch(/@videojs\/cli@latest agents init/);
      expect(source, readme).not.toMatch(/@videojs\/(?:react|html)(?:@\S+)? agents init/);

      for (const match of source.matchAll(/^npx @videojs\/cli agents init([^\n]*)$/gm)) {
        commandCount += 1;
        const flags = match[1]!.trim().split(/\s+/).filter(Boolean);
        const result = runAgentsInit('10.0.0-test', ['agents', 'init', ...flags]);

        if (result.exitCode !== 0) failures.push(`${readme}: ${match[0]}\n${result.stderr || result.stdout}`);
      }
    }

    expect(commandCount).toBeGreaterThan(0);
    expect(failures).toEqual([]);
  });

  it('accepts every agents skills command in the CLI README', () => {
    const readme = resolve(workspaceRoot, 'packages/cli/README.md');
    const commands = [...readFileSync(readme, 'utf8').matchAll(/^npx @videojs\/cli agents skills([^\n]*)$/gm)];
    const failures = commands.flatMap((match) => {
      const flags = match[1]!.trim().split(/\s+/).filter(Boolean);
      const result = runAgentsSkills('10.0.0-test', ['agents', 'skills', ...flags]);

      return result.exitCode === 0 ? [] : [`${match[0]}\n${result.stderr || result.stdout}`];
    });

    expect(commands.length).toBeGreaterThan(1);
    expect(failures).toEqual([]);
  });
});
