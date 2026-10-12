import { homedir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { claudeKeychainService, codexLoginForContainer, expandHome, jwtExpiry } from '../logins.ts';

describe('expandHome', () => {
  it('expands a leading tilde only', () => {
    expect(expandHome('~/.codex-work/auth.json')).toBe(`${homedir()}/.codex-work/auth.json`);
    expect(expandHome('/tmp/~/auth.json')).toBe('/tmp/~/auth.json');
  });
});

describe('claudeKeychainService', () => {
  it('uses the default entry without a config directory', () => {
    expect(claudeKeychainService(undefined)).toBe('Claude Code-credentials');
  });

  it('suffixes the entry with a hash of the config directory', () => {
    expect(claudeKeychainService('/Users/example/.claude-work')).toMatch(/^Claude Code-credentials-[0-9a-f]{8}$/);
    expect(claudeKeychainService('~/.claude-work')).toBe(claudeKeychainService(`${homedir()}/.claude-work`));
  });
});

describe('jwtExpiry', () => {
  it('reads the exp claim', () => {
    const payload = Buffer.from(JSON.stringify({ exp: 1_790_000_000 })).toString('base64url');

    expect(jwtExpiry(`header.${payload}.signature`)?.toISOString()).toBe('2026-09-21T14:13:20.000Z');
  });

  it('returns null for anything else', () => {
    expect(jwtExpiry('sk-not-a-jwt')).toBeNull();
  });
});

describe('codexLoginForContainer', () => {
  it('keeps the access token and drops the refresh token', () => {
    const login = JSON.parse(
      codexLoginForContainer(
        {
          auth_mode: 'chatgpt',
          tokens: { id_token: 'id', access_token: 'access', refresh_token: 'refresh', account_id: 'account' },
        },
        new Date('2026-09-25T00:00:00.000Z')
      )
    );

    expect(login).toEqual({
      auth_mode: 'chatgpt',
      OPENAI_API_KEY: null,
      tokens: { id_token: 'id', access_token: 'access', refresh_token: '', account_id: 'account' },
      last_refresh: '2026-09-25T00:00:00.000Z',
    });
  });
});
