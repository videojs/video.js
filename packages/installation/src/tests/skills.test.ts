import { describe, expect, it } from 'vite-plus/test';

import { createSkillsInstructions, SKILL_AGENTS, skillInstallMethods, skillsCommand } from '../skills';

describe('skillInstallMethods', () => {
  it('lists every agent in canonical order by default', () => {
    expect(skillInstallMethods().map(({ agent }) => agent)).toEqual(SKILL_AGENTS);
  });

  it('keeps canonical order for a narrowed selection', () => {
    expect(skillInstallMethods({ agents: ['cursor', 'codex'] }).map(({ agent }) => agent)).toEqual(['codex', 'cursor']);
  });

  it('uses the marketplace plugin commands for Codex and Claude Code', () => {
    const [codex, claude] = skillInstallMethods({ agents: ['codex', 'claude-code'] });

    expect(codex!.steps.flatMap((step) => step.commands ?? [])).toEqual([
      'codex plugin marketplace add videojs/skills',
      'codex plugin add videojs@videojs',
    ]);
    expect(claude!.steps.flatMap((step) => step.commands ?? [])).toEqual([
      'claude plugin marketplace add videojs/skills',
      'claude plugin install videojs@videojs',
    ]);
  });

  it('applies the Claude Code scope to the marketplace and the plugin', () => {
    const [claude] = skillInstallMethods({ agents: ['claude-code'], scope: 'project' });

    expect(claude!.steps[0]!.commands).toEqual([
      'claude plugin marketplace add videojs/skills --scope project',
      'claude plugin install videojs@videojs --scope project',
    ]);
  });

  it('installs globally with the skills installer only when asked', () => {
    const [local] = skillInstallMethods({ agents: ['other'] });
    const [global] = skillInstallMethods({ agents: ['other'], global: true });

    expect(local!.steps[0]!.commands).toEqual(['npx skills add https://github.com/videojs/skills']);
    expect(global!.steps[0]!.commands).toEqual(['npx skills add https://github.com/videojs/skills -g']);
    expect(global!.notes.join('\n')).toContain(
      'npx skills add https://github.com/videojs/skills -g --agent <agent> --yes'
    );
  });

  it('ends every method with a follow-up that loads the skill', () => {
    for (const method of skillInstallMethods()) expect(method.followUp, method.agent).toMatch(/^Start a new /);

    expect(skillInstallMethods({ agents: ['claude-code'] })[0]!.followUp).toContain('`/reload-plugins`');
  });

  it('has editor agents enter the repository URL instead of running commands', () => {
    for (const method of skillInstallMethods({ agents: ['vscode', 'cursor'] })) {
      expect(method.steps).toEqual([expect.objectContaining({ input: 'https://github.com/videojs/skills' })]);
      expect(method.steps[0]!.commands).toBeUndefined();
    }
  });
});

describe('skillsCommand', () => {
  it('prints only the options that were selected', () => {
    expect(skillsCommand()).toBe('npx @videojs/cli agents skills');
    expect(skillsCommand({ agents: ['other', 'claude-code'], scope: 'local', global: true }, '10.0.0')).toBe(
      'npx @videojs/cli@10.0.0 agents skills --agent claude-code,other --scope local --global'
    );
  });
});

describe('createSkillsInstructions', () => {
  it('describes the selection, its options, and the installation command', () => {
    const instructions = createSkillsInstructions('10.0.0', { agents: ['claude-code'], scope: 'user' });

    expect(instructions).toMatchObject({
      schemaVersion: 1,
      kind: 'skills',
      package: '@videojs/cli',
      packageVersion: '10.0.0',
      repository: 'https://github.com/videojs/skills',
      command: 'npx @videojs/cli@10.0.0 agents skills --agent claude-code --scope user',
      selectedOptions: { agent: ['claude-code'], scope: 'user' },
      installationCommand: 'npx @videojs/cli@10.0.0 agents init',
    });
    expect(instructions.agents.map(({ agent }) => agent)).toEqual(['claude-code']);
    expect(instructions.options.map(({ flag }) => flag)).toEqual(['--agent', '--scope', '--global']);
    expect(instructions.notice).toContain('never installs the skill');
  });
});
