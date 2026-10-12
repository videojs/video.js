import { describe, expect, it } from 'vitest';

import {
  activitySignals,
  parseClaudeTranscript,
  parseCodexTranscript,
  type TranscriptSummary,
  unwrapShell,
} from '../transcript.ts';

const lines = (...events: object[]) => events.map((event) => JSON.stringify(event)).join('\n');

function toolUse(name: string, input: object) {
  return { type: 'assistant', message: { content: [{ type: 'tool_use', id: name, name, input }] } };
}

describe('parseClaudeTranscript', () => {
  it('collects tools, usage, and cost across resumed turns', () => {
    const summary = parseClaudeTranscript(
      lines(
        { type: 'system', subtype: 'init', session_id: 's1', model: 'claude-opus-5-5', skills: ['videojs'] },
        toolUse('Bash', { command: 'npx @videojs/cli@latest agents init --json' }),
        toolUse('Read', { file_path: '/work/app/node_modules/@videojs/react/docs/llms.txt' }),
        toolUse('WebFetch', { url: 'https://videojs.org/docs/framework/react/llms.txt', prompt: 'install' }),
        toolUse('Skill', { skill: 'videojs' }),
        toolUse('Edit', { file_path: '/work/app/app/page.tsx' }),
        {
          type: 'result',
          num_turns: 4,
          total_cost_usd: 0.5,
          usage: { input_tokens: 10, output_tokens: 20 },
          result: 'Asked',
        },
        {
          type: 'result',
          num_turns: 6,
          total_cost_usd: 1.25,
          usage: { input_tokens: 5, cache_read_input_tokens: 7, output_tokens: 30 },
          result: 'Done',
        }
      )
    );

    expect(summary.sessionId).toBe('s1');
    expect(summary.availableSkills).toEqual(['videojs']);
    expect(summary.commands).toEqual(['npx @videojs/cli@latest agents init --json']);
    expect(summary.filesRead).toEqual(['/work/app/node_modules/@videojs/react/docs/llms.txt']);
    expect(summary.filesWritten).toEqual(['/work/app/app/page.tsx']);
    expect(summary.skillsInvoked).toEqual(['videojs']);
    expect(summary.toolCalls).toBe(5);
    expect(summary.turns).toBe(10);
    expect(summary.costUsd).toBe(1.75);
    expect(summary.usage).toMatchObject({ inputTokens: 15, cachedInputTokens: 7, outputTokens: 50 });
    expect(summary.finalMessage).toBe('Done');
  });

  it('records API retries and whether the run ended while retrying', () => {
    const summary = parseClaudeTranscript(
      lines(
        { type: 'system', subtype: 'init', session_id: 's1' },
        { type: 'system', subtype: 'api_retry', error: 'authentication_failed' },
        { type: 'system', subtype: 'api_retry', error: 'authentication_failed' }
      )
    );

    expect(summary.apiRetries).toEqual(['authentication_failed', 'authentication_failed']);
    expect(summary.lastEventType).toBe('api_retry');
    expect(summary.errors).toEqual([]);
  });

  it('records errored results', () => {
    const summary = parseClaudeTranscript(
      lines({ type: 'result', subtype: 'error_during_execution', is_error: true, result: 'API Error: 529 overloaded' })
    );

    expect(summary.errors).toEqual(['error_during_execution: API Error: 529 overloaded']);
  });
});

describe('parseCodexTranscript', () => {
  it('collects completed items and token usage', () => {
    const summary = parseCodexTranscript(
      lines(
        { type: 'thread.started', thread_id: 't1' },
        { type: 'item.started', item: { type: 'command_execution', command: 'ignored while running' } },
        {
          type: 'item.completed',
          item: { type: 'command_execution', command: 'pnpm add @videojs/html', exit_code: 0 },
        },
        { type: 'item.completed', item: { type: 'file_change', changes: [{ path: 'src/App.vue', kind: 'update' }] } },
        { type: 'item.completed', item: { type: 'web_search', query: 'videojs 10 vue install' } },
        { type: 'item.completed', item: { type: 'agent_message', text: 'Added the player.' } },
        {
          type: 'turn.completed',
          usage: { input_tokens: 100, cached_input_tokens: 60, output_tokens: 40, reasoning_output_tokens: 12 },
        }
      )
    );

    expect(summary.sessionId).toBe('t1');
    expect(summary.commands).toEqual(['pnpm add @videojs/html']);
    expect(summary.filesWritten).toEqual(['src/App.vue']);
    expect(summary.webSearches).toEqual(['videojs 10 vue install']);
    expect(summary.toolCalls).toBe(3);
    expect(summary.turns).toBe(1);
    expect(summary.usage).toMatchObject({
      inputTokens: 100,
      cachedInputTokens: 60,
      outputTokens: 40,
      reasoningTokens: 12,
    });
    expect(summary.costUsd).toBeNull();
    expect(summary.finalMessage).toBe('Added the player.');
  });

  it('keeps reconnect attempts out of errors', () => {
    const summary = parseCodexTranscript(
      lines(
        { type: 'error', message: 'Reconnecting... 1/5 (unexpected status 429 Too Many Requests)' },
        { type: 'turn.completed', usage: {} }
      )
    );

    expect(summary.apiRetries).toHaveLength(1);
    expect(summary.errors).toEqual([]);
    expect(summary.lastEventType).toBe('turn.completed');
  });

  it('records failed turns', () => {
    const summary = parseCodexTranscript(lines({ type: 'turn.failed', error: { message: 'stream disconnected' } }));

    expect(summary.errors).toEqual(['stream disconnected']);
  });
});

describe('parseCodexTranscript web searches', () => {
  it('keeps what server-side searches opened, which bypasses the site routes', () => {
    const summary = parseCodexTranscript(
      lines(
        {
          type: 'item.completed',
          item: {
            type: 'web_search',
            query: 'Video.js 10 CDN',
            action: { type: 'search', query: 'Video.js 10 CDN' },
            results: [{ url: 'https://videojs.org/docs/framework/html/concepts/cdn' }],
          },
        },
        {
          type: 'item.completed',
          item: {
            type: 'web_search',
            query: 'https://videojs.com/getting-started',
            action: { type: 'open_page', url: 'https://videojs.com/getting-started' },
          },
        }
      )
    );

    expect(summary.searches).toEqual([
      { query: 'Video.js 10 CDN', action: 'search', urls: ['https://videojs.org/docs/framework/html/concepts/cdn'] },
      {
        query: 'https://videojs.com/getting-started',
        action: 'open_page',
        urls: ['https://videojs.com/getting-started'],
      },
    ]);
    expect(activitySignals(summary)).toMatchObject({ fetchedVideojsOrg: true, fetchedLegacyDocs: true });
  });
});

describe('activitySignals', () => {
  const summary = (overrides: Partial<TranscriptSummary>): TranscriptSummary => ({
    ...parseCodexTranscript(''),
    ...overrides,
  });

  it('flags installs of the video.js package but not @videojs packages', () => {
    expect(activitySignals(summary({ commands: ['npm install video.js'] })).installedVideojsPackage).toBe(true);
    expect(activitySignals(summary({ commands: ['pnpm add video.js@8.10.0 --save'] })).installedVideojsPackage).toBe(
      true
    );
    expect(activitySignals(summary({ commands: ['npm install @videojs/react'] })).installedVideojsPackage).toBe(false);
    expect(
      activitySignals(summary({ commands: ['cat node_modules/video.js/package.json'] })).installedVideojsPackage
    ).toBe(false);
  });

  it('tells the live docs apart from pre-release and legacy docs', () => {
    const signals = activitySignals(
      summary({
        commands: ['curl -s https://main.videojs.org/llms.txt'],
        webFetches: ['https://legacy.videojs.org/guides/setup'],
      })
    );

    expect(signals).toMatchObject({
      fetchedVideojsOrg: false,
      fetchedMainVideojsOrg: true,
      fetchedLegacyDocs: true,
      readLlmsTxt: true,
    });
    expect(
      activitySignals(summary({ webFetches: ['https://videojs.org/docs/framework/html/llms.txt'] })).fetchedVideojsOrg
    ).toBe(true);
  });

  it('detects agents init, the legacy CLI, bundled docs, shadcn, and builds', () => {
    const signals = activitySignals(
      summary({
        commands: [
          'npx @videojs/cli@latest agents init --framework html --method shadcn',
          'npx @videojs/cli docs how-to/installation',
          'sed -n 1,80p node_modules/@videojs/html/docs/how-to/installation.md',
          'npx shadcn@latest add @videojs/video',
          'pnpm run build',
        ],
      })
    );

    expect(signals).toMatchObject({
      ranAgentsInit: true,
      usedLegacyCli: true,
      readBundledDocs: true,
      ranShadcn: true,
      ranBuild: true,
      loadedSkill: false,
    });
  });

  it('tells agents init from the legacy docs and config commands', () => {
    const current = activitySignals(summary({ commands: ['npx @videojs/cli agents init', 'videojs agents skills'] }));
    const legacy = activitySignals(summary({ commands: ['videojs config --framework react'] }));

    expect(current).toMatchObject({ ranAgentsInit: true, usedLegacyCli: false });
    expect(legacy.usedLegacyCli).toBe(true);
  });

  it('sees installs inside the shell Codex wraps commands in', () => {
    const signals = activitySignals(summary({ commands: [unwrapShell("/bin/bash -lc 'pnpm add video.js'")] }));

    expect(signals.installedVideojsPackage).toBe(true);
    expect(activitySignals(summary({ commands: ["/bin/bash -lc 'pnpm add video.js'"] })).installedVideojsPackage).toBe(
      true
    );
    expect(
      activitySignals(summary({ commands: ['pnpm add @videojs/react video.js-plugin'] })).installedVideojsPackage
    ).toBe(false);
  });

  it('counts the skill as loaded when the agent reads SKILL.md', () => {
    expect(activitySignals(summary({ commands: ['cat ~/.agents/skills/videojs/SKILL.md'] })).loadedSkill).toBe(true);
  });
});
