import { describe, expect, it } from 'vitest';

import { clusteredRate, pairedChange, rate, renderMarkdown, summarize } from '../report.ts';
import type { TrialResult } from '../trial/result.ts';

function trial(overrides: {
  task: string;
  works: boolean;
  status?: TrialResult['status'];
  cost?: number;
  choice?: string;
}): TrialResult {
  return {
    trial: {
      task: overrides.task,
      agent: 'claude-opus-5.5',
      arm: 'baseline',
      expect: { framework: 'react', library: overrides.choice ? 'any' : undefined, playback: 'click' },
    },
    detected: { choice: overrides.choice ?? 'videojs-10' },
    status: overrides.status ?? 'completed',
    environment: { latestPackages: { '@videojs/react': '10.0.0-rc.2' }, docs: {}, claudeCode: '2.1.282', codex: null },
    skill: null,
    agent: {
      followUp: false,
      durationMs: 120_000,
      turns: 10,
      costUsd: overrides.cost ?? 1,
      usage: { inputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: 500, reasoningTokens: 0 },
    },
    activity: { signals: { ranAgentsInit: overrides.works, readBundledDocs: false } },
    steps: { install: { ok: true, durationMs: 1, lockfileInSync: true } },
    checks: { a11y: { ok: true } },
    outcome: { works: overrides.works, onSpec: overrides.works, firstFailure: overrides.works ? null : 'build' },
  } as unknown as TrialResult;
}

describe('rate', () => {
  it('returns a Wilson interval', () => {
    const { low, high } = rate(5, 10);

    expect(low).toBeCloseTo(0.237, 3);
    expect(high).toBeCloseTo(0.763, 3);
  });

  it('keeps the interval inside zero and one', () => {
    expect(rate(3, 3)).toMatchObject({ passed: 3, total: 3, high: 1 });
    expect(rate(0, 0)).toEqual({ passed: 0, total: 0, low: 0, high: 0 });
  });
});

describe('summarize', () => {
  it('excludes infrastructure errors from rates and counts first failures', () => {
    const summary = summarize(
      '10.0.0-rc.2',
      ['run'],
      [
        trial({ task: 'a', works: true, cost: 1 }),
        trial({ task: 'a', works: false, cost: 3 }),
        trial({ task: 'b', works: true, cost: 2 }),
        trial({ task: 'b', works: false, status: 'infra-error' }),
      ]
    );
    const [group] = summary.groups;

    expect(group).toMatchObject({ trials: 4, infraErrors: 1, medianCostUsd: 2, firstFailures: { build: 1 } });
    expect(group!.works).toMatchObject({ passed: 2, total: 3 });
    expect(group!.signals.ranAgentsInit).toBeCloseTo(2 / 3);
    expect(summary.tasks.b).toEqual({ 'claude-opus-5.5/baseline': { works: 1, onSpec: 1, total: 1 } });
  });

  it('counts the players agents chose in generic tasks only', () => {
    const summary = summarize(
      'generic',
      ['run'],
      [
        trial({ task: 'generic-podcast', works: true, choice: 'videojs-10' }),
        trial({ task: 'generic-podcast', works: true, choice: 'plyr' }),
        trial({ task: 'generic-video-next', works: true, choice: 'plyr' }),
        trial({ task: 'react-next-packaged', works: true }),
      ]
    );

    expect(summary.groups[0]!.playerChoices).toEqual({ 'videojs-10': 1, plyr: 2 });
    expect(renderMarkdown(summary)).toContain('| claude-opus-5.5 | baseline | 2 | 1 |');
  });
});

describe('renderMarkdown', () => {
  it('compares only the tasks both runs share', () => {
    const fullBaseline = summarize(
      '10.0.0-rc.2',
      ['a'],
      [trial({ task: 'a', works: false }), trial({ task: 'b', works: false }), trial({ task: 'c', works: true })]
    );
    const core = summarize(
      '10.0.0-rc.3',
      ['b'],
      [trial({ task: 'a', works: true }), trial({ task: 'd', works: true })]
    );

    expect(renderMarkdown(core, fullBaseline)).toContain('2/2 (100%, 34–100) +100 pts on 1 shared tasks');
  });

  it('warns when a release landed during the run', () => {
    const later = trial({ task: 'a', works: true });
    const summary = summarize(
      '10.0.0',
      ['a'],
      [
        trial({ task: 'a', works: true }),
        { ...later, environment: { ...later.environment, latestPackages: { '@videojs/react': '10.0.0' } } },
      ]
    );

    expect(renderMarkdown(summary)).toContain('npm `latest` changed during this run (10.0.0-rc.2, 10.0.0)');
  });

  it('shows the change against an earlier release', () => {
    const before = summarize(
      '10.0.0-rc.2',
      ['a'],
      [trial({ task: 'a', works: false }), trial({ task: 'a', works: true })]
    );
    const after = summarize('10.0.0', ['b'], [trial({ task: 'a', works: true }), trial({ task: 'a', works: true })]);
    const markdown = renderMarkdown(after, before);

    expect(markdown).toContain('compared with 10.0.0-rc.2');
    expect(markdown).toContain('2/2 (100%, 34–100) +50 pts');
    expect(markdown).toContain('| a | 2/2 (was 1/2) |');
  });
});

describe('clusteredRate', () => {
  it('widens the interval when whole tasks pass or fail together', () => {
    const cells = [
      { works: 3, onSpec: 3, total: 3 },
      { works: 3, onSpec: 3, total: 3 },
      { works: 0, onSpec: 0, total: 3 },
      { works: 0, onSpec: 0, total: 3 },
    ];
    const clustered = clusteredRate(cells, 'onSpec');
    const pooled = rate(6, 12);

    expect(clustered).toMatchObject({ passed: 6, total: 12 });
    expect(clustered.high - clustered.low).toBeGreaterThan(pooled.high - pooled.low);
  });

  it('prints the same interval every time', () => {
    const cells = [
      { works: 1, onSpec: 1, total: 3 },
      { works: 2, onSpec: 2, total: 3 },
      { works: 3, onSpec: 3, total: 3 },
    ];

    expect(clusteredRate(cells, 'onSpec')).toEqual(clusteredRate(cells, 'onSpec'));
  });
});

describe('pairedChange', () => {
  it('compares shared tasks only and reports what this many tasks can detect', () => {
    const before = {
      a: { works: 1, onSpec: 1, total: 3 },
      b: { works: 3, onSpec: 3, total: 3 },
      c: { works: 0, onSpec: 0, total: 3 },
    };
    const after = { a: { works: 3, onSpec: 3, total: 3 }, b: { works: 3, onSpec: 3, total: 3 } };
    const change = pairedChange(after, before, 'onSpec')!;

    expect(change).toMatchObject({ tasks: 2, before: 4 / 6, after: 1 });
    expect(change.delta).toBeCloseTo(1 / 3);
    expect(change.detectable).toBeGreaterThan(0.3);
  });

  it('returns nothing without shared tasks', () => {
    expect(pairedChange({ a: { works: 1, onSpec: 1, total: 1 } }, {}, 'onSpec')).toBeNull();
  });
});

describe('renderMarkdown warnings', () => {
  it('warns when trials read docs from different sources', () => {
    const pinned = trial({ task: 'a', works: true });
    const summary = summarize(
      '10.0.0-rc.3',
      ['a'],
      [
        {
          ...pinned,
          environment: {
            ...pinned.environment,
            sites: { 'videojs.org': 'https://deploy-preview-2703--vjs10-site.netlify.app' },
          },
        },
        trial({ task: 'b', works: true }),
      ]
    );

    expect(renderMarkdown(summary)).toContain('trials read docs from 2 different sources');
  });
});
