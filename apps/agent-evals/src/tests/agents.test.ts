import { describe, expect, it } from 'vitest';

import { findAgent } from '../agents.ts';

describe('findAgent', () => {
  it('finds a configured agent', () => {
    expect(findAgent('codex-gpt-6-sol')).toMatchObject({ id: 'codex-gpt-6-sol', harness: 'codex', model: 'gpt-6-sol' });
  });

  it('keeps an effort in the id so reports tell efforts apart', () => {
    expect(findAgent('claude-opus-5.5:high')).toMatchObject({
      id: 'claude-opus-5.5:high',
      model: 'claude-opus-5-5',
      effort: 'high',
    });
  });

  it('accepts an ad hoc harness and model', () => {
    expect(findAgent('claude-code/claude-sonnet-5:low')).toMatchObject({
      id: 'claude-code/claude-sonnet-5:low',
      harness: 'claude-code',
      model: 'claude-sonnet-5',
      effort: 'low',
      credentials: ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN'],
    });
  });

  it('rejects unknown agents', () => {
    expect(() => findAgent('gemini/gemini-3')).toThrow('Unknown agent');
  });
});
