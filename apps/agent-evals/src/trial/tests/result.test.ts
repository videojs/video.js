import { describe, expect, it } from 'vitest';

import type { BrowserReport } from '../../grade/browser.ts';
import type { StaticReport } from '../../grade/static.ts';
import type { Task } from '../../tasks.ts';
import { hitUsageLimit, scoreChecks, type TrialResult } from '../result.ts';

const task: Task = {
  id: 'react-next-packaged',
  dir: '',
  prompt: '',
  prompts: [''],
  fixture: 'react-next',
  suite: 'core',
  tier: 'smoke',
  arms: null,
  builder: null,
  solution: null,
  setup: null,
  services: [],
  check: null,
  user: null,
  mutants: [],
  expect: {
    framework: 'react',
    method: 'packaged',
    preset: 'video',
    skin: 'default',
    media: 'html5-video',
    playback: 'click',
  },
};

const detected: StaticReport = {
  videojsPackages: { '@videojs/react': '10.0.0-rc.2' },
  cdnUrls: [],
  cdnPinned: null,
  v8Evidence: [],
  method: 'packaged',
  preset: 'video',
  skin: 'default',
  media: 'html5',
  choice: 'videojs-10',
};

const browser: BrowserReport = {
  engine: 'firefox',
  status: 200,
  navigationError: null,
  pageErrors: [],
  consoleErrors: [],
  mediaAttached: true,
  playerSize: { width: 768, height: 432 },
  controlsVisible: true,
  runtimeV8: false,
  runtimeMinimal: false,
  cdnRequestsRouted: 0,
  playback: { ok: true, detail: 'Playing at 1.2 s.', currentTime: 1.2, mediaError: null },
  taskAssertions: null,
  a11y: { serious: 0, critical: 0, rules: [] },
};

const passingInput = {
  task,
  detected,
  install: { ok: true, durationMs: 1, lockfileInSync: true },
  build: { ok: true, durationMs: 1 },
  serveError: null,
  browser,
};

describe('scoreChecks', () => {
  it('passes a player that builds, renders, plays, and matches the prompt', () => {
    expect(scoreChecks(passingInput).outcome).toEqual({
      works: true,
      onSpec: true,
      firstFailure: null,
      failureLabel: null,
    });
  });

  it('names the build as the root cause when nothing could be served', () => {
    const { outcome, checks } = scoreChecks({
      ...passingInput,
      build: { ok: false, durationMs: 1, detail: 'Type error' },
      browser: null,
    });

    expect(outcome).toEqual({ works: false, onSpec: false, firstFailure: 'build', failureLabel: 'build failed' });
    expect(checks.serve.ok).toBeNull();
  });

  it('fails a player that collapses to zero height even when its controls exist', () => {
    const { outcome, checks } = scoreChecks({
      ...passingInput,
      browser: { ...browser, playerSize: { width: 768, height: 0 } },
    });

    expect(outcome).toMatchObject({ firstFailure: 'render', failureLabel: 'zero-height player' });
    expect(checks.render.detail).toContain('size=768x0');
  });

  it('keeps a working player off spec when it used another install method', () => {
    const { outcome } = scoreChecks({ ...passingInput, detected: { ...detected, method: 'cdn' } });

    expect(outcome).toMatchObject({
      works: true,
      onSpec: false,
      firstFailure: 'method',
      failureLabel: 'wrong method: cdn',
    });
  });

  it('fails Video.js 8 even when a player renders', () => {
    const { outcome } = scoreChecks({
      ...passingInput,
      detected: { ...detected, videojsPackages: { 'video.js': '8.10.0' }, v8Evidence: ['videojs() call'] },
    });

    expect(outcome).toMatchObject({ works: false, firstFailure: 'videojs-v10', failureLabel: 'Video.js 8' });
  });

  it('lets an audio player be as short as a control bar', () => {
    const { outcome } = scoreChecks({
      ...passingInput,
      task: { ...task, expect: { ...task.expect, preset: 'audio', media: 'html5-audio' } },
      detected: { ...detected, preset: 'audio' },
      browser: { ...browser, playerSize: { width: 768, height: 46 } },
    });

    expect(outcome.works).toBe(true);
  });
});

describe('scoreChecks with a generic task', () => {
  const generic: Task = {
    ...task,
    id: 'generic-podcast',
    suite: 'generic',
    expect: { framework: 'react', library: 'any', preset: 'audio', playback: 'click' },
  };
  const plyr: StaticReport = {
    ...detected,
    videojsPackages: {},
    method: 'none',
    preset: 'unknown',
    skin: 'unknown',
    choice: 'plyr',
  };

  it('counts another player as working but not on spec', () => {
    const { outcome, checks } = scoreChecks({ ...passingInput, task: generic, detected: plyr });

    expect(outcome).toMatchObject({
      works: true,
      onSpec: false,
      firstFailure: 'videojs-v10',
      failureLabel: 'picked plyr',
    });
    expect(checks.method.ok).toBeNull();
  });

  it('accepts a hidden media element behind visible controls', () => {
    const { outcome } = scoreChecks({
      ...passingInput,
      task: generic,
      detected: plyr,
      browser: { ...browser, playerSize: { width: 0, height: 0 }, controlsVisible: true },
    });

    expect(outcome.works).toBe(true);
  });

  it('puts Video.js 10 on spec', () => {
    const { outcome } = scoreChecks({ ...passingInput, task: generic, detected: { ...detected, preset: 'audio' } });

    expect(outcome).toMatchObject({ works: true, onSpec: true, firstFailure: null });
  });
});

describe('scoreChecks with a customization task', () => {
  const customize: Task = {
    ...task,
    id: 'customize-captions',
    suite: 'customize',
    expect: { framework: 'react', preset: 'video', playback: 'click' },
  };

  it('keeps a working player off spec when a task assertion fails', () => {
    const { outcome, checks } = scoreChecks({
      ...passingInput,
      task: customize,
      detected: { ...detected, method: 'custom', skin: 'unknown' },
      browser: {
        ...browser,
        taskAssertions: [
          { name: 'English captions track', ok: true },
          { name: 'captions load', ok: false, detail: '0 cues' },
        ],
      },
    });

    expect(outcome).toMatchObject({
      works: true,
      onSpec: false,
      firstFailure: 'task',
      failureLabel: 'task check: captions load',
    });
    expect(checks.task.detail).toBe('captions load: 0 cues');
    expect(checks.method.ok).toBeNull();
    expect(checks.skin.ok).toBeNull();
  });
});

describe('scoreChecks against the build under test', () => {
  const expected = { release: '10.0.0-rc.4', packages: null };

  it('passes packages the pinned registry resolved to the release', () => {
    const { checks } = scoreChecks({
      ...passingInput,
      detected: { ...detected, installedVersions: { '@videojs/react': '10.0.0-rc.4', '@videojs/core': '10.0.0-rc.4' } },
      expected,
    });

    expect(checks.version.ok).toBe(true);
  });

  it('fails a CDN URL pinned to another release, and says so', () => {
    const { outcome, checks } = scoreChecks({
      ...passingInput,
      task: { ...task, expect: { ...task.expect, method: 'cdn' } },
      detected: {
        ...detected,
        videojsPackages: {},
        method: 'cdn',
        cdnUrls: ['https://cdn.jsdelivr.net/npm/@videojs/cdn@10.0.0-rc.2/video.js'],
      },
      expected,
    });

    expect(outcome).toMatchObject({ works: false, firstFailure: 'version', failureLabel: 'version mismatch' });
    expect(checks.version.detail).toBe('expected 10.0.0-rc.4: @videojs/cdn@10.0.0-rc.2 (CDN)');
  });

  it('ignores Video.js 8 dependencies that share the scope', () => {
    const { checks } = scoreChecks({
      ...passingInput,
      detected: {
        ...detected,
        installedVersions: { '@videojs/react': '10.0.0-rc.4', '@videojs/http-streaming': '3.17.0' },
      },
      expected,
    });

    expect(checks.version.ok).toBe(true);
  });

  it('checks packed builds package by package', () => {
    const { checks } = scoreChecks({
      ...passingInput,
      detected: { ...detected, installedVersions: { '@videojs/react': '10.0.0-rc.4' } },
      expected: { release: null, packages: { '@videojs/react': '10.0.1-pr.1' } },
    });

    expect(checks.version.ok).toBe(false);
  });
});

describe('scoreChecks for what the prompt asked', () => {
  const asked: Task = {
    ...task,
    expect: {
      ...task.expect,
      source: 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4',
      after: 'Short films from independent creators.',
    },
  };

  it('accepts the same Mux asset in another format', () => {
    const { checks } = scoreChecks({
      ...passingInput,
      task: asked,
      browser: {
        ...browser,
        mediaRequests: ['https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8'],
        placement: { anchorFound: true, below: true, detail: '' },
      },
    });

    expect(checks.source.ok).toBe(true);
    expect(checks.placement.ok).toBe(true);
  });

  it('fails the demo video in place of the one the prompt gave', () => {
    const { outcome } = scoreChecks({
      ...passingInput,
      task: asked,
      browser: {
        ...browser,
        mediaRequests: ['https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4'],
        placement: { anchorFound: true, below: true, detail: '' },
      },
    });

    expect(outcome).toMatchObject({ works: true, onSpec: false, failureLabel: 'wrong media source' });
  });

  it('fails a player above the text it should sit below', () => {
    const { outcome } = scoreChecks({
      ...passingInput,
      task: asked,
      browser: {
        ...browser,
        mediaRequests: ['https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4'],
        placement: { anchorFound: true, below: false, detail: 'player top 80 px, text bottom 200 px' },
      },
    });

    expect(outcome.failureLabel).toBe('wrong placement');
  });

  it('fails progressive audio where the prompt gave video', () => {
    const { checks } = scoreChecks({ ...passingInput, browser: { ...browser, mediaTag: 'audio' } });

    expect(checks.media).toEqual({ ok: false, detail: 'html5, <audio>' });
  });

  it('fails a page where no Video.js 10 player rendered', () => {
    const { outcome } = scoreChecks({ ...passingInput, browser: { ...browser, runtimeV10: false } });

    expect(outcome).toMatchObject({ works: false, failureLabel: 'Video.js 10 not rendered' });
  });

  it('trusts the package and imports for a background video, which renders a plain video element', () => {
    const { checks } = scoreChecks({
      ...passingInput,
      task: { ...task, expect: { ...task.expect, preset: 'background-video', playback: 'autoplay' } },
      browser: { ...browser, runtimeV10: false },
    });

    expect(checks['runtime-v10'].ok).toBeNull();
  });

  it('lets Video.js 8 stay on another page when the task allows it', () => {
    const { checks } = scoreChecks({
      ...passingInput,
      task: { ...task, expect: { ...task.expect, v8: 'elsewhere' } },
      detected: { ...detected, v8Evidence: ['videojs() call'] },
    });

    expect(checks['no-v8'].ok).toBe(true);
  });

  it('merges project assertions into the task check', () => {
    const { checks } = scoreChecks({
      ...passingInput,
      projectAssertions: [{ name: 'react-player removed', ok: false, detail: 'still in package.json' }],
    });

    expect(checks.task).toEqual({ ok: false, detail: 'react-player removed: still in package.json' });
  });
});

describe('hitUsageLimit', () => {
  const failed = (status: TrialResult['status'], errors: string[], finalMessage: string | null = null) =>
    ({ status, agent: { errors, finalMessage, setupError: null } }) as unknown as TrialResult;

  it('recognizes Claude and Codex usage limits', () => {
    expect(hitUsageLimit(failed('infra-error', ['Claude AI usage limit reached|1790000000']))).toBe(true);
    expect(hitUsageLimit(failed('infra-error', [], "You've hit your usage limit. Try again in 3 hours."))).toBe(true);
    expect(hitUsageLimit(failed('infra-error', ['429 Too Many Requests']))).toBe(true);
    expect(
      hitUsageLimit(
        failed('infra-error', ["success: You've hit your individual spend limit · ask your admin to raise it"])
      )
    ).toBe(true);
  });

  it('ignores other failures', () => {
    expect(hitUsageLimit(failed('infra-error', ['stream disconnected before completion']))).toBe(false);
    expect(hitUsageLimit(failed('completed', ['rate limit']))).toBe(false);
    expect(hitUsageLimit(null)).toBe(false);
  });
});
