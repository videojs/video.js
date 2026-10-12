import type { AgentHarness } from '../agents.ts';
import type { Arm } from '../arms.ts';
import type { BrowserReport, TaskAssertion } from '../grade/browser.ts';
import type { InstallResult, StepResult } from '../grade/serve.ts';
import type { StaticReport } from '../grade/static.ts';
import type { SiteRoutes } from '../sites/forwarder.ts';
import type { PackageManager, Task, TaskExpectation } from '../tasks.ts';
import type { ActivitySignals, TokenUsage } from './transcript.ts';

/** Bump when a field changes meaning, so reports never compare incompatible results. */
export const TRIAL_RESULT_SCHEMA = 1;

export interface TrialResult {
  schema: typeof TRIAL_RESULT_SCHEMA;
  trial: {
    task: string;
    suite?: string;
    tier?: string;
    agent: string;
    harness: AgentHarness;
    model: string | null;
    effort: string | null;
    arm: Arm;
    /** The prompt as sent, after the arm's changes. */
    prompt: string;
    /** Which of the task's wordings the prompt started from, from 1. */
    variant?: number;
    /** The deliberate mistake a mutant trial applied. */
    mutant?: string | null;
    index: number;
    label: string | null;
    fixture: string;
    expect: TaskExpectation;
  };
  /** `infra-error` trials are excluded from pass rates and retried by the host. */
  status: 'completed' | 'agent-error' | 'timeout' | 'infra-error';
  startedAt: string;
  finishedAt: string;
  environment: {
    image: string | null;
    node: string;
    npm: string | null;
    pnpm: string | null;
    claudeCode: string | null;
    codex: string | null;
    /** Packed builds served as the latest @videojs packages, or `null` when agents used npm as published. */
    packages: Record<string, string> | null;
    /** The release every @videojs package was pinned to, or `null` when agents saw npm as published. */
    release: string | null;
    /** Hosts served from other origins, such as deploy previews, or `null` when every site was live. */
    sites: SiteRoutes | null;
    /** What `latest` resolved to when the trial ran. */
    latestPackages: Record<string, string | null>;
    /** Content hashes of the live docs, so a site deploy between runs is visible. */
    docs: Record<string, string | null>;
  };
  skill: {
    ref: string | null;
    sha: string | null;
    installedTo: string | null;
    sha256: string;
    /** Whether the agent listed the skill at startup. `null` when the CLI does not say. */
    visible: boolean | null;
  } | null;
  agent: {
    exitCode: number | null;
    timedOut: boolean;
    setupError: string | null;
    followUp: boolean;
    durationMs: number;
    observedModel: string | null;
    cliVersion: string | null;
    availableSkills: string[] | null;
    turns: number | null;
    toolCalls: number;
    usage: TokenUsage;
    costUsd: number | null;
    errors: string[];
    finalMessage: string | null;
  };
  activity: {
    signals: ActivitySignals;
    commands: string[];
    webFetches: string[];
    webSearches: string[];
    skillsInvoked: string[];
    /** Requests the agent and grader made to each routed host. */
    siteRequests: Record<string, number> | null;
  };
  changes: {
    files: string[];
    /** Lines the agent added and removed, lockfiles excluded. */
    linesAdded?: number;
    linesRemoved?: number;
  };
  /**
   * Where the agent's information came from, so a comparison can tell whether it read the build under test: web search
   * runs on the provider's servers and never passes through the site routes.
   */
  provenance?: {
    webSearch: 'disabled' | 'live';
    sites: SiteRoutes | null;
    searches: Array<{ query: string; action: string | null; urls: string[] }>;
    /** Versions the agent wrote into CDN URLs. */
    cdnVersions: string[];
  };
  /** The simulated user's side of an interactive trial. */
  interaction?: Interaction | null;
  /** Checks rerun with the build under test forced, when the agent pinned another version, to tell the two apart. */
  diagnostics?: { forcedRelease: { render: boolean; playback: boolean; detail: string } | null };
  project: { root: string; template: string | null; packageManager: PackageManager | null } | null;
  detected: StaticReport;
  steps: {
    install: InstallResult | null;
    build: StepResult | null;
    serveError: string | null;
    graderError: string | null;
    browser: BrowserReport | null;
    /** Results of the task's `project` hook, which reads the finished files. */
    projectAssertions?: TaskAssertion[] | null;
  };
  checks: Record<CheckId, Check>;
  outcome: Outcome;
}

/** `ok: null` means the check does not apply to this task or could not run. */
export interface Check {
  ok: boolean | null;
  detail?: string;
}

/** One question the agent asked and what the simulated user answered. */
export interface InteractionRound {
  question: string;
  /** Answer-card topics the question asked about; `implementation` and `vague` mark questions the user cannot answer. */
  topics: string[];
  answer: string;
  /** Whether the agent had already changed the project when it asked. */
  editedBefore: boolean;
}

export interface Interaction {
  rounds: InteractionRound[];
  /** Topics the answer card marks necessary: the outcome depends on them and the project cannot tell. */
  necessary: string[];
  askedNecessary: string[];
  missedNecessary: string[];
  /** Questions about topics the project answers, or that make no difference. */
  unnecessary: number;
  /** Whether the final message states the choices the agent made on its own, as the answer card defines them. */
  disclosed: boolean | null;
}

/** Ordered by how early they fail, so `firstFailure` names the root cause. */
export const CHECK_IDS = [
  'videojs-v10',
  'no-v8',
  'version',
  'install',
  'build',
  'serve',
  'render',
  'runtime-v10',
  'playback',
  'task',
  'method',
  'preset',
  'skin',
  'media',
  'source',
  'placement',
  'cdn-pinned',
  'no-page-errors',
  'hydration',
  'a11y',
] as const;
export type CheckId = (typeof CHECK_IDS)[number];

const RUNS: readonly CheckId[] = ['install', 'build', 'serve', 'render', 'playback'];
const MATCHES_PROMPT: readonly CheckId[] = ['task', 'method', 'preset', 'skin', 'media', 'source', 'placement'];

/**
 * Which checks make a trial work and which make it on spec. A Video.js task works when a Video.js 10 player builds,
 * renders, and plays, and is on spec when it also does what the prompt asked. A generic task works with any player that
 * plays, and is on spec only with Video.js 10.
 */
function outcomeChecks(library: TaskExpectation['library']): { works: CheckId[]; onSpec: CheckId[] } {
  // A trial that loaded another release than the one under test says nothing about this one.
  const videojs: CheckId[] = ['videojs-v10', 'no-v8', 'version'];

  return library === 'any'
    ? { works: [...RUNS], onSpec: [...videojs, ...RUNS, 'runtime-v10', ...MATCHES_PROMPT] }
    : { works: [...videojs, ...RUNS, 'runtime-v10'], onSpec: [...videojs, ...RUNS, 'runtime-v10', ...MATCHES_PROMPT] };
}

export interface Outcome {
  works: boolean;
  onSpec: boolean;
  firstFailure: CheckId | null;
  /** The first failure in words a reader can group by, such as "Video.js 8" or "zero-height player". */
  failureLabel?: string | null;
}

/** The build under test, which every `@videojs` package and CDN URL should match. */
export interface ExpectedBuild {
  release: string | null;
  /** Packed builds, by package name. */
  packages: Record<string, string> | null;
}

interface ScoreInput {
  task: Task;
  detected: StaticReport;
  install: InstallResult | null;
  build: StepResult | null;
  serveError: string | null;
  browser: BrowserReport | null;
  expected?: ExpectedBuild;
  projectAssertions?: TaskAssertion[] | null;
}

/** Subscription usage limits and API rate limits, as Claude Code, Codex, and their APIs word them. */
export const USAGE_LIMIT =
  /usage limit|hit your (?:usage |individual )?(?:spend |spending )?limit|spend(?:ing)? limit|rate.?limit|too many requests|\b429\b|quota/i;

/** Whether a trial failed because its agent ran into a usage or rate limit, which waiting fixes. */
export function hitUsageLimit(result: TrialResult | null): boolean {
  if (result?.status !== 'infra-error') return false;

  const { errors, finalMessage, setupError } = result.agent;

  return [...errors, finalMessage ?? '', setupError ?? ''].some((text) => USAGE_LIMIT.test(text));
}

export function scoreChecks({
  task,
  detected,
  install,
  build,
  serveError,
  browser,
  expected,
  projectAssertions,
}: ScoreInput): {
  checks: Record<CheckId, Check>;
  outcome: Outcome;
} {
  const { expect } = task;
  const v10Packages = Object.entries(detected.videojsPackages).filter(
    ([name, version]) => name.startsWith('@videojs/') && /^\D*1\d\./.test(version)
  );
  const reached = browser !== null;
  const anyPlayer = expect.library === 'any';
  const assertions =
    browser?.taskAssertions || projectAssertions
      ? [...(browser?.taskAssertions ?? []), ...(projectAssertions ?? [])]
      : null;
  const failed = assertions?.filter(({ ok }) => !ok) ?? [];
  // A player that collapses to a sliver renders nothing a viewer can use, even when its controls exist.
  const minHeight = expect.preset === 'audio' || expect.preset === 'live-audio' ? 24 : 90;
  const sizedPlayer = (browser?.playerSize?.height ?? 0) >= minHeight && (browser?.playerSize?.width ?? 0) >= 200;
  const a11yViolations = browser?.a11y ? browser.a11y.serious + browser.a11y.critical : null;

  const checks: Record<CheckId, Check> = {
    'videojs-v10': check(
      v10Packages.length > 0 || detected.cdnUrls.length > 0,
      v10Packages.map(([name, version]) => `${name}@${version}`).join(', ') || detected.cdnUrls.join(', ') || 'none'
    ),
    'no-v8':
      // Video.js 8 the task keeps on another page only fails when it runs on the page under test.
      expect.v8 === 'elsewhere'
        ? check(browser?.runtimeV8 !== true, browser?.runtimeV8 ? 'window.videojs or .video-js at runtime' : undefined)
        : check(
            detected.v8Evidence.length === 0 && browser?.runtimeV8 !== true,
            [...detected.v8Evidence, ...(browser?.runtimeV8 ? ['window.videojs or .video-js at runtime'] : [])].join(
              ', '
            )
          ),
    version: versionCheck(detected, expected),
    install: install ? check(install.ok, install.detail) : { ok: null },
    build: build ? check(build.ok, build.detail) : { ok: null },
    serve:
      install?.ok === false || build?.ok === false ? { ok: null } : check(serveError === null, serveError ?? undefined),
    render: reached
      ? check(
          browser.mediaAttached &&
            // Any player may hide its media element behind its own controls, as a podcast player often does.
            (anyPlayer
              ? sizedPlayer || browser.controlsVisible === true
              : sizedPlayer && browser.controlsVisible !== false && !browser.runtimeV8),
          `media=${browser.mediaAttached} size=${browser.playerSize ? `${browser.playerSize.width}x${browser.playerSize.height}` : 'none'} controls=${browser.controlsVisible}`
        )
      : { ok: null },
    // Only a player with controls leaves Video.js 10 markup behind: a background video renders a plain <video>, so its
    // package and imports are the only evidence.
    'runtime-v10':
      reached &&
      browser.runtimeV10 !== undefined &&
      expect.playback === 'click' &&
      (!anyPlayer || detected.choice === 'videojs-10')
        ? check(
            browser.runtimeV10,
            browser.runtimeV10 ? undefined : 'No Video.js 10 player, skin, or controls rendered.'
          )
        : { ok: null },
    playback: reached ? check(browser.playback.ok, browser.playback.detail) : { ok: null },
    task:
      assertions && assertions.length > 0
        ? check(
            failed.length === 0,
            (failed.length > 0 ? failed : assertions)
              .map(({ name, detail }) => (detail ? `${name}: ${detail}` : name))
              .join(' | ')
          )
        : { ok: null },
    method: expect.method ? check(detected.method === expect.method, detected.method) : { ok: null },
    preset: expect.preset ? check(detected.preset === expect.preset, detected.preset) : { ok: null },
    skin:
      expect.skin === undefined || expect.skin === 'none'
        ? { ok: null }
        : check(
            expect.skin === 'minimal'
              ? detected.skin === 'minimal' || browser?.runtimeMinimal === true
              : detected.skin === 'default' && browser?.runtimeMinimal !== true,
            detected.skin
          ),
    media: mediaCheck(expect.media, detected, browser),
    source:
      expect.source && reached && browser.mediaRequests
        ? sourceCheck(expect.source, [...browser.mediaRequests, ...(browser.mediaSources ?? [])])
        : { ok: null },
    placement:
      expect.after && browser?.placement ? check(browser.placement.below, browser.placement.detail) : { ok: null },
    'cdn-pinned':
      expect.method === 'cdn' ? check(detected.cdnPinned === true, detected.cdnUrls.join(', ')) : { ok: null },
    'no-page-errors': reached
      ? check(browser.pageErrors.length === 0, browser.pageErrors.slice(0, 3).join(' | '))
      : { ok: null },
    hydration:
      reached && browser.hydrationErrors
        ? check(browser.hydrationErrors.length === 0, browser.hydrationErrors.slice(0, 2).join(' | '))
        : { ok: null },
    a11y: a11yViolations === null ? { ok: null } : check(a11yViolations === 0, browser?.a11y?.rules.join(', ')),
  };

  // A check that could not run because an earlier step failed counts against the outcome.
  const passes = (ids: readonly CheckId[]) =>
    ids.every((id) => checks[id].ok === true || (checks[id].ok === null && !blocks(id)));
  const blocks = (id: CheckId) => (id === 'serve' || id === 'render' || id === 'playback') && !reached;

  const { works, onSpec } = outcomeChecks(expect.library);
  // The root cause among the checks that decide the outcome; informational checks never make a trial fail.
  const firstFailure =
    onSpec.find((id) => checks[id].ok === false || (works.includes(id) && checks[id].ok === null && blocks(id))) ??
    null;

  return {
    checks,
    outcome: {
      works: passes(works),
      onSpec: passes(onSpec),
      firstFailure,
      failureLabel: failureLabel(firstFailure, checks, detected, browser, minHeight),
    },
  };
}

function check(ok: boolean, detail?: string): Check {
  return detail ? { ok, detail } : { ok };
}

/**
 * Every `@videojs` package installed, and every CDN URL with an exact version, must be the build under test. A range
 * such as `^10.0.0-rc.2` is fine: the pinned registry resolves it to the release.
 */
function versionCheck(detected: StaticReport, expected: ExpectedBuild | undefined): Check {
  const wanted = (name: string) => expected?.packages?.[name] ?? expected?.release ?? null;

  if (!expected || (!expected.release && !expected.packages)) return { ok: null };

  // Video.js 8's own dependencies share the scope, such as @videojs/http-streaming 3; only Video.js 10 packages count.
  const installed = Object.fromEntries(
    Object.entries(detected.installedVersions ?? {}).filter(([, version]) => Number(version.split('.')[0]) >= 10)
  );
  const declared = Object.entries(detected.videojsPackages).filter(([name]) => name.startsWith('@videojs/'));
  const mismatches: string[] = [];

  for (const [name, version] of Object.entries(installed)) {
    const target = wanted(name);

    if (target && version !== target) mismatches.push(`${name}@${version}`);
  }

  for (const [name, version] of declared) {
    const target = wanted(name);

    // Without node_modules the manifest is all there is; only an exact version can be wrong.
    if (!(name in installed) && target && /^\d/.test(version) && version !== target) {
      mismatches.push(`${name}@${version}`);
    }
  }

  for (const url of detected.cdnUrls) {
    const [, name = '', version] = /(@videojs\/[\w-]+)@(\d+\.\d+\.\d+[\w.-]*)/.exec(url) ?? [];
    const target = version ? wanted(name) : null;

    if (target && version !== target) mismatches.push(`${name}@${version} (CDN)`);
  }

  if (declared.length === 0 && detected.cdnUrls.length === 0) return { ok: null };

  return check(
    mismatches.length === 0,
    mismatches.length > 0
      ? `expected ${expected.release ?? 'the packed build'}: ${[...new Set(mismatches)].join(', ')}`
      : undefined
  );
}

/** HLS by adapter; progressive video or audio by a plain media element of that kind, when the browser saw one. */
function mediaCheck(media: string | undefined, detected: StaticReport, browser: BrowserReport | null): Check {
  if (!media) return { ok: null };

  if (media === 'hls') return check(detected.media === 'hls', detected.media);

  if (media === 'background-video') return check(detected.media === 'background-video', detected.media);

  if (media === 'html5-video' || media === 'html5-audio') {
    const tag = browser?.mediaTag;
    const kind = media === 'html5-video' ? 'video' : 'audio';

    return check(
      detected.media === 'html5' && (tag === undefined || tag === null || tag === kind),
      `${detected.media}${tag ? `, <${tag}>` : ''}`
    );
  }

  return { ok: null };
}

/**
 * The page asked for the prompt's media, or another format of the same Mux asset, which plays the same video: a
 * playback ID covers its HLS stream, MP4 renditions, and `playback-id` attribute alike.
 */
export function sourceCheck(expected: string, seen: readonly string[]): Check {
  const muxId = /stream\.mux\.com\/([A-Za-z0-9]+)/.exec(expected)?.[1];
  const key = muxId ?? expected.replace(/[?#].*$/, '');
  const match = seen.find((url) => url.includes(key));

  return check(match !== undefined, match ?? (seen.slice(0, 3).join(', ') || 'no media requested'));
}

function failureLabel(
  failure: CheckId | null,
  checks: Record<CheckId, Check>,
  detected: StaticReport,
  browser: BrowserReport | null,
  minHeight: number
): string | null {
  if (!failure) return null;

  if (failure === 'videojs-v10') {
    if (detected.choice === 'videojs-8' || detected.v8Evidence.length > 0) return 'Video.js 8';

    return detected.choice === 'videojs-10' ? 'no Video.js 10 package' : `picked ${detected.choice}`;
  }

  if (failure === 'render') {
    if ((browser?.playerSize?.height ?? 0) < minHeight && browser?.mediaAttached) return 'zero-height player';

    return browser?.controlsVisible === false ? 'no visible controls' : 'player did not render';
  }

  const labels: Partial<Record<CheckId, string>> = {
    'no-v8': 'Video.js 8',
    version: 'version mismatch',
    install: 'install failed',
    build: 'build failed',
    serve: 'server failed',
    'runtime-v10': 'Video.js 10 not rendered',
    playback: 'no playback',
    source: 'wrong media source',
    placement: 'wrong placement',
  };
  if (labels[failure]) return labels[failure]!;

  if (failure === 'task') return `task check: ${(checks.task.detail ?? '').split(/[:|]/)[0]!.trim()}`;

  return `wrong ${failure}: ${checks[failure].detail ?? '?'}`;
}
