import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { EVALS_ROOT, loadTasks } from './tasks.ts';
import type { CheckId, TrialResult } from './trial/result.ts';
import type { ActivitySignals } from './trial/transcript.ts';

export interface Rate {
  passed: number;
  total: number;
  /** 95% interval, as fractions. */
  low: number;
  high: number;
}

/** Passes and trials of one task, the unit results cluster by: the same task tends to pass or fail every time. */
export interface Cell {
  works: number;
  onSpec: number;
  total: number;
}

export interface GroupSummary {
  agent: string;
  arm: string;
  trials: number;
  /** Excluded from every rate below. */
  infraErrors: number;
  works: Rate;
  onSpec: Rate;
  medianCostUsd: number | null;
  medianDurationMinutes: number | null;
  /** Commands, edits, and other tool calls. Turns count differently in each harness. */
  medianToolCalls: number | null;
  medianOutputTokens: number | null;
  /** Lines the agent added and removed, lockfiles excluded. */
  medianLinesChanged: number | null;
  /** Share of trials where each signal fired. */
  signals: Record<string, number>;
  firstFailures: Partial<Record<CheckId, number>>;
  /** First failures in words, such as "Video.js 8" or "zero-height player", by trial count. */
  failureLabels: Record<string, number>;
  /** Players agents chose in generic tasks, which name no library, by trial count. */
  playerChoices: Record<string, number>;
  /** Players agents ended up with across every task, by trial count. */
  choices: Record<string, number>;
  /** Per suite. */
  suites: Record<string, Cell>;
  /** The simulated user's view, for trials whose task has an answer card or that ran interactively. */
  interaction: {
    trials: number;
    necessary: number;
    askedNecessary: number;
    unnecessary: number;
    disclosable: number;
    disclosed: number;
  } | null;
}

export interface RunSummary {
  schema: 2;
  label: string;
  generatedAt: string;
  runs: string[];
  environment: {
    latestPackages: Record<string, string | null>;
    /** Every `latest` @videojs/react seen; more than one means a release landed mid-run. */
    latestVersions: string[];
    /** Packed builds agents got instead of npm, when the run used them. */
    packages: Record<string, string> | null;
    /** The release npm was pinned to, when the run used one. */
    release: string | null;
    /** Hosts served from other origins, such as an older release's deploy previews. */
    sites: Record<string, string> | null;
    /** Every distinct set of site routes; more than one means trials read different docs. */
    siteRouteSets?: string[];
    /** Whether agents could search the web from the provider's servers, which reads production docs. */
    webSearch?: string[];
    docs: Record<string, string | null>;
    claudeCode: string[];
    codex: string[];
    skill: string[];
  };
  groups: GroupSummary[];
  /** Per task, keyed by `agent/arm`. */
  tasks: Record<string, Record<string, Cell>>;
  /** Each task's suite and tier. */
  taskInfo?: Record<string, { suite: string; tier: string }>;
}

export function loadResults(runDir: string): TrialResult[] {
  const trialsDir = join(runDir, 'trials');
  if (!existsSync(trialsDir)) return [];

  // Retried attempts keep their output beside the trial, under a `.infra-<time>` suffix.
  return readdirSync(trialsDir)
    .filter((name) => !name.includes('.infra-'))
    .map((name) => join(trialsDir, name, 'result.json'))
    .filter(existsSync)
    .map((path) => JSON.parse(readFileSync(path, 'utf8')) as TrialResult);
}

export function summarize(label: string, runs: readonly string[], results: readonly TrialResult[]): RunSummary {
  const groups = new Map<string, TrialResult[]>();
  const tasks: RunSummary['tasks'] = {};
  const taskInfo = describeTasks(results);

  for (const result of results) {
    const key = groupKey(result);

    groups.set(key, [...(groups.get(key) ?? []), result]);

    if (result.status === 'infra-error') continue;

    const taskRow = (tasks[result.trial.task] ??= {});

    addToCell((taskRow[key] ??= { works: 0, onSpec: 0, total: 0 }), result);
  }

  return {
    schema: 2,
    label,
    generatedAt: new Date().toISOString(),
    runs: [...runs],
    environment: {
      latestPackages: results[0]?.environment.latestPackages ?? {},
      latestVersions: distinct(results.map((result) => result.environment.latestPackages['@videojs/react'] ?? null)),
      packages: results[0]?.environment.packages ?? null,
      release: results[0]?.environment.release ?? null,
      sites: results[0]?.environment.sites ?? null,
      siteRouteSets: distinct(results.map((result) => JSON.stringify(result.environment.sites ?? {}))),
      webSearch: distinct(results.map((result) => result.provenance?.webSearch ?? null)),
      docs: results[0]?.environment.docs ?? {},
      claudeCode: distinct(results.map((result) => result.environment.claudeCode)),
      codex: distinct(results.map((result) => result.environment.codex)),
      skill: distinct(
        results.map((result) =>
          result.skill ? `${result.skill.ref ?? '?'}@${result.skill.sha?.slice(0, 7) ?? result.skill.sha256}` : null
        )
      ),
    },
    groups: [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, trials]) => summarizeGroup(trials, tasks, key, taskInfo)),
    tasks,
    taskInfo,
  };
}

function groupKey(result: TrialResult): string {
  return `${result.trial.agent}/${result.trial.arm}`;
}

function addToCell(cell: Cell, result: TrialResult): void {
  cell.total += 1;
  cell.works += result.outcome.works ? 1 : 0;
  cell.onSpec += result.outcome.onSpec ? 1 : 0;
}

/** Suites and tiers from the results, or from the tasks as they are now for results recorded before either existed. */
function describeTasks(results: readonly TrialResult[]): NonNullable<RunSummary['taskInfo']> {
  let current: Map<string, { suite: string; tier: string }> | null = null;
  const info: NonNullable<RunSummary['taskInfo']> = {};

  for (const { trial } of results) {
    if (info[trial.task]) continue;

    if (trial.suite && trial.tier) {
      info[trial.task] = { suite: trial.suite, tier: trial.tier };
      continue;
    }

    current ??= new Map(
      (() => {
        try {
          return loadTasks().map((task) => [task.id, { suite: task.suite, tier: task.tier }] as const);
        } catch {
          return [];
        }
      })()
    );
    info[trial.task] = current.get(trial.task) ?? { suite: 'unknown', tier: 'main' };
  }

  return info;
}

function summarizeGroup(
  trials: readonly TrialResult[],
  tasks: RunSummary['tasks'],
  key: string,
  taskInfo: NonNullable<RunSummary['taskInfo']>
): GroupSummary {
  const scored = trials.filter((trial) => trial.status !== 'infra-error');
  const first = trials[0]!;
  const signalNames = Object.keys(first.activity.signals) as Array<keyof ActivitySignals>;
  const signals: Record<string, number> = {};
  const firstFailures: GroupSummary['firstFailures'] = {};
  const failureLabels: GroupSummary['failureLabels'] = {};
  const playerChoices: GroupSummary['playerChoices'] = {};
  const choices: GroupSummary['choices'] = {};
  const suites: GroupSummary['suites'] = {};
  const cells = Object.values(tasks)
    .map((row) => row[key])
    .filter((cell): cell is Cell => cell !== undefined);

  for (const name of signalNames) {
    signals[name] = share(scored, (trial) => Boolean(trial.activity.signals[name]));
  }

  signals.followUp = share(scored, (trial) => trial.agent.followUp);
  signals.lockfileInSync = share(scored, (trial) => trial.steps.install?.lockfileInSync === true);
  signals.a11yIssues = share(scored, (trial) => trial.checks.a11y?.ok === false);
  signals.searchedWeb = share(scored, (trial) => (trial.provenance?.searches.length ?? 0) > 0);
  signals.versionMismatch = share(scored, (trial) => trial.checks.version?.ok === false);

  for (const trial of scored) {
    const failure = trial.outcome.firstFailure;
    const label = trial.outcome.failureLabel;

    if (failure) firstFailures[failure] = (firstFailures[failure] ?? 0) + 1;

    if (label) failureLabels[label] = (failureLabels[label] ?? 0) + 1;

    choices[trial.detected.choice] = (choices[trial.detected.choice] ?? 0) + 1;

    if (trial.trial.expect.library === 'any') {
      playerChoices[trial.detected.choice] = (playerChoices[trial.detected.choice] ?? 0) + 1;
    }

    addToCell((suites[taskInfo[trial.trial.task]?.suite ?? 'unknown'] ??= { works: 0, onSpec: 0, total: 0 }), trial);
  }

  const interacted = scored.filter((trial) => trial.interaction);

  return {
    agent: first.trial.agent,
    arm: first.trial.arm,
    trials: trials.length,
    infraErrors: trials.length - scored.length,
    works: clusteredRate(cells, 'works'),
    onSpec: clusteredRate(cells, 'onSpec'),
    medianCostUsd: median(scored.map((trial) => trial.agent.costUsd)),
    medianDurationMinutes: median(scored.map((trial) => trial.agent.durationMs / 60_000)),
    medianToolCalls: median(scored.map((trial) => trial.agent.toolCalls)),
    medianOutputTokens: median(scored.map((trial) => trial.agent.usage.outputTokens || null)),
    medianLinesChanged: median(
      scored.map((trial) =>
        trial.changes?.linesAdded === undefined ? null : trial.changes.linesAdded + (trial.changes.linesRemoved ?? 0)
      )
    ),
    signals,
    firstFailures,
    failureLabels,
    playerChoices,
    choices,
    suites,
    interaction:
      interacted.length === 0
        ? null
        : {
            trials: interacted.length,
            necessary: sum(interacted.map((trial) => trial.interaction!.necessary.length)),
            askedNecessary: sum(interacted.map((trial) => trial.interaction!.askedNecessary.length)),
            unnecessary: sum(interacted.map((trial) => trial.interaction!.unnecessary)),
            disclosable: interacted.filter((trial) => trial.interaction!.disclosed !== null).length,
            disclosed: interacted.filter((trial) => trial.interaction!.disclosed === true).length,
          },
  };
}

/** Wilson score interval: honest bounds for the small trial counts an eval run can afford. */
export function rate(passed: number, total: number): Rate {
  if (total === 0) return { passed, total, low: 0, high: 0 };

  const z = 1.96;
  const p = passed / total;
  const denominator = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denominator;

  return { passed, total, low: Math.max(0, center - margin), high: Math.min(1, center + margin) };
}

const BOOTSTRAP_SAMPLES = 2_000;

/**
 * A pooled rate with an interval that respects clustering: tasks are resampled, not trials, because the same task tends
 * to pass or fail every time. With few tasks the bootstrap collapses, so the interval also covers the Wilson interval.
 */
export function clusteredRate(cells: readonly Cell[], field: 'works' | 'onSpec'): Rate {
  const passed = sum(cells.map((cell) => cell[field]));
  const total = sum(cells.map((cell) => cell.total));
  const wilson = rate(passed, total);

  if (cells.length < 2) return wilson;

  const random = seededRandom(cells.length * 7_919 + passed);
  const samples: number[] = [];

  for (let sample = 0; sample < BOOTSTRAP_SAMPLES; sample += 1) {
    let hits = 0;
    let count = 0;

    for (let draw = 0; draw < cells.length; draw += 1) {
      const cell = cells[Math.floor(random() * cells.length)]!;

      hits += cell[field];
      count += cell.total;
    }

    samples.push(count === 0 ? 0 : hits / count);
  }

  const [low, high] = percentiles(samples);

  return { passed, total, low: Math.min(wilson.low, low), high: Math.max(wilson.high, high) };
}

export interface PairedChange {
  before: number;
  after: number;
  /** After minus before, over the tasks both runs share. */
  delta: number;
  low: number;
  high: number;
  /** Roughly the smallest change this many tasks can tell from noise: 80% power at the 5% level. */
  detectable: number;
  tasks: number;
}

/** The change in a pooled rate between two runs, over the tasks they share, resampling tasks as pairs. */
export function pairedChange(
  now: Record<string, Cell | undefined>,
  then: Record<string, Cell | undefined>,
  field: 'works' | 'onSpec'
): PairedChange | null {
  const pairs = Object.keys(now)
    .map((task) => [now[task], then[task]] as const)
    .filter((pair): pair is readonly [Cell, Cell] => pair[0] !== undefined && pair[1] !== undefined)
    .filter(([after, before]) => after.total > 0 && before.total > 0);
  if (pairs.length === 0) return null;

  const pooled = (picked: ReadonlyArray<readonly [Cell, Cell]>) => {
    const after = sum(picked.map(([cell]) => cell[field])) / sum(picked.map(([cell]) => cell.total));
    const before = sum(picked.map(([, cell]) => cell[field])) / sum(picked.map(([, cell]) => cell.total));

    return { after, before, delta: after - before };
  };
  const observed = pooled(pairs);
  const random = seededRandom(pairs.length * 104_729);
  const deltas: number[] = [];

  for (let sample = 0; sample < BOOTSTRAP_SAMPLES; sample += 1) {
    deltas.push(pooled(Array.from({ length: pairs.length }, () => pairs[Math.floor(random() * pairs.length)]!)).delta);
  }

  const [low, high] = percentiles(deltas);
  const mean = sum(deltas) / deltas.length;
  const sd = Math.sqrt(sum(deltas.map((delta) => (delta - mean) ** 2)) / (deltas.length - 1));
  // A run whose tasks all pass or all fail both times has no spread to measure, which says nothing about noise.
  const floor = rate(0, sum(pairs.map(([cell]) => cell.total))).high;

  return { ...observed, low, high, detectable: Math.max(2.8 * sd, floor), tasks: pairs.length };
}

function percentiles(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b);

  return [sorted[Math.floor(sorted.length * 0.025)]!, sorted[Math.ceil(sorted.length * 0.975) - 1]!];
}

/** Mulberry32, so the same results always print the same intervals. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = state;

    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function share<T>(items: readonly T[], predicate: (item: T) => boolean): number {
  return items.length === 0 ? 0 : items.filter(predicate).length / items.length;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function median(values: ReadonlyArray<number | null>): number | null {
  const sorted = values.filter((value): value is number => value !== null).sort((a, b) => a - b);
  if (sorted.length === 0) return null;

  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function distinct(values: ReadonlyArray<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

const SIGNAL_COLUMNS: ReadonlyArray<[string, string]> = [
  ['ranAgentsInit', 'agents init'],
  ['readBundledDocs', 'bundled docs'],
  ['fetchedVideojsOrg', 'videojs.org'],
  ['searchedWeb', 'web search'],
  ['usedLegacyCli', 'legacy CLI'],
  ['fetchedLegacyDocs', 'legacy docs'],
  ['fetchedGithubSource', 'GitHub source'],
  ['ranShadcn', 'shadcn'],
  ['installedVideojsPackage', 'npm video.js'],
  ['loadedSkill', 'skill loaded'],
  ['followUp', 'needed follow-up'],
  ['versionMismatch', 'other release'],
  ['lockfileInSync', 'lockfile in sync'],
  ['a11yIssues', 'axe issues'],
];

/** Where `--save` records summaries, and where comparisons look them up. */
export const HISTORY_DIR = join(EVALS_ROOT, 'history');

export function saveToHistory(summary: RunSummary, markdown: string): void {
  mkdirSync(HISTORY_DIR, { recursive: true });
  writeFileSync(join(HISTORY_DIR, `${summary.label}.json`), `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(join(HISTORY_DIR, `${summary.label}.md`), markdown);
}

/** Loads a recorded summary by label, or `latest` for the newest one other than `exclude`. */
export function loadRecorded(ref: string, exclude?: string): RunSummary | undefined {
  if (!existsSync(HISTORY_DIR)) return undefined;

  if (ref !== 'latest') {
    const path = join(HISTORY_DIR, `${ref}.json`);

    return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as RunSummary) : undefined;
  }

  return readdirSync(HISTORY_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(join(HISTORY_DIR, file), 'utf8')) as RunSummary)
    .filter((recorded) => recorded.label !== exclude)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
}

function column(tasks: RunSummary['tasks'], key: string, only?: (task: string) => boolean): Record<string, Cell> {
  return Object.fromEntries(
    Object.entries(tasks)
      .filter(([task, row]) => row[key] && (!only || only(task)))
      .map(([task, row]) => [task, row[key]!])
  );
}

/** Renders a summary, with paired changes against an earlier release when `baseline` is given. */
export function renderMarkdown(summary: RunSummary, baseline?: RunSummary): string {
  const groupKeys = summary.groups.map((group) => `${group.agent}/${group.arm}`);
  const env = summary.environment;
  const tier = (task: string) => summary.taskInfo?.[task]?.tier ?? 'main';
  const change = (key: string, field: 'works' | 'onSpec', taskCount: number) => {
    const paired = baseline ? pairedChange(column(summary.tasks, key), column(baseline.tasks, key), field) : null;
    if (!paired) return '';

    const points = Math.round(paired.after * 100) - Math.round(paired.before * 100);
    const scope = paired.tasks < taskCount ? ` on ${paired.tasks} shared tasks` : '';

    return ` ${points >= 0 ? '+' : ''}${points} pts${scope}`;
  };
  const routeSets = env.siteRouteSets ?? [];
  const lines = [
    `# Agent evals: ${summary.label}`,
    '',
    [
      `Generated ${summary.generatedAt.slice(0, 16).replace('T', ' ')} UTC`,
      env.packages
        ? `packed build @videojs/react ${env.packages['@videojs/react'] ?? '?'}`
        : env.release
          ? `npm pinned to @videojs ${env.release}`
          : `latest @videojs/react ${env.latestPackages['@videojs/react'] ?? '?'}`,
      ...Object.entries(env.sites ?? {})
        .filter(([host]) => host !== 'www.videojs.org')
        .map(([host, origin]) => `${host} from ${origin.replace(/^https:\/\//, '')}`),
      Object.keys(env.sites ?? {}).length === 0 ? 'production videojs.org' : null,
      env.webSearch?.length
        ? `provider web search ${env.webSearch.map((mode) => (mode === 'live' ? 'on' : 'off')).join(' and ')}`
        : null,
      `Claude Code ${env.claudeCode.join(', ') || 'n/a'}`,
      `Codex ${env.codex.join(', ') || 'n/a'}`,
      env.skill.length > 0 ? `skill ${env.skill.join(', ')}` : null,
      baseline ? `compared with ${baseline.label}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    '',
    ...(env.latestVersions.length > 1
      ? [
          `**Warning**: npm \`latest\` changed during this run (${env.latestVersions.join(', ')}), so trials saw different releases.`,
          '',
        ]
      : []),
    ...(routeSets.length > 1
      ? [
          `**Warning**: trials read docs from ${routeSets.length} different sources (${routeSets
            .map((set) => (set === '{}' ? 'production' : Object.values(JSON.parse(set) as Record<string, string>)[0]))
            .join(', ')}), so differences may come from the docs rather than the build.`,
          '',
        ]
      : []),
    ...(env.webSearch?.includes('live')
      ? [
          '**Note**: agents could search the web from their provider, which reads production docs and search indexes rather than the build under test. Use this run for what agents do today, not to credit a change to the build.',
          '',
        ]
      : []),
    '**Works**: builds, renders, and plays with the Video.js 10 build under test, or with any player in generic tasks. **On spec**: works with Video.js 10 and does what the prompt asked, from install method, preset, skin, media, source, and placement to task-specific checks. Rates exclude infrastructure errors; ranges are 95% intervals that resample tasks, since trials of one task tend to pass or fail together.',
    '',
  ];

  const primary = summary.groups.filter((group) => group.arm === 'v10');

  if (primary.length > 0) {
    const cells = (key: string) => Object.values(column(summary.tasks, key, (task) => tier(task) === 'main'));

    lines.push(
      `**Primary metric**: on spec in the v10 arm on main-tier tasks: ${primary
        .map((group) => `${group.agent} ${formatRate(clusteredRate(cells(`${group.agent}/v10`), 'onSpec'))}`)
        .join('; ')}.`,
      ''
    );
  }

  lines.push(
    '## Outcomes',
    '',
    '| Agent | Arm | Works | On spec | Median cost | Median time | Median tool calls | Median lines changed | Infra errors |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
  );

  for (const group of summary.groups) {
    const key = `${group.agent}/${group.arm}`;
    const taskCount = Object.values(summary.tasks).filter((row) => row[key]).length;

    lines.push(
      `| ${group.agent} | ${group.arm} | ${formatRate(group.works)}${change(key, 'works', taskCount)} | ${formatRate(group.onSpec)}${change(key, 'onSpec', taskCount)} | ${
        group.medianCostUsd === null ? '—' : `$${group.medianCostUsd.toFixed(2)}`
      } | ${group.medianDurationMinutes === null ? '—' : `${group.medianDurationMinutes.toFixed(1)} min`} | ${
        group.medianToolCalls ?? '—'
      } | ${group.medianLinesChanged ?? '—'} | ${group.infraErrors} |`
    );
  }

  const suites = [...new Set(summary.groups.flatMap((group) => Object.keys(group.suites ?? {})))].sort();

  if (suites.length > 1) {
    lines.push(
      '',
      '## On spec by suite',
      '',
      `| Agent | Arm | ${suites.join(' | ')} |`,
      `| --- | --- | ${suites.map(() => '---').join(' | ')} |`
    );

    for (const group of summary.groups) {
      lines.push(
        `| ${group.agent} | ${group.arm} | ${suites
          .map((suite) => {
            const cell = group.suites?.[suite];

            return cell ? `${cell.onSpec}/${cell.total}` : '—';
          })
          .join(' | ')} |`
      );
    }
  }

  if (baseline) renderChanges(lines, summary, baseline);

  lines.push(
    '',
    '## On spec by task',
    '',
    `| Task | ${groupKeys.join(' | ')} |`,
    `| --- | ${groupKeys.map(() => '---').join(' | ')} |`
  );

  for (const [task, row] of Object.entries(summary.tasks).sort(([a], [b]) => a.localeCompare(b))) {
    const cells = groupKeys.map((key) => {
      const cell = row[key];
      if (!cell) return '—';

      const before = baseline?.tasks[task]?.[key];
      const delta = before && before.total > 0 ? ` (was ${before.onSpec}/${before.total})` : '';

      return `${cell.onSpec}/${cell.total}${delta}`;
    });

    lines.push(`| ${task}${tier(task) === 'smoke' ? ' (smoke)' : ''} | ${cells.join(' | ')} |`);
  }

  const choices = [...new Set(summary.groups.flatMap((group) => Object.keys(group.choices ?? {})))].sort();

  if (choices.length > 1) {
    lines.push(
      '',
      '## Player agents ended up with',
      '',
      'Every trial. For a plain "Video.js" request, Video.js 10 here is adoption; the `video.js` npm package gave Video.js 8 until a release published Video.js 10 under that name.',
      '',
      `| Agent | Arm | ${choices.join(' | ')} |`,
      `| --- | --- | ${choices.map(() => '---').join(' | ')} |`
    );

    for (const group of summary.groups) {
      lines.push(
        `| ${group.agent} | ${group.arm} | ${choices.map((choice) => group.choices?.[choice] ?? 0).join(' | ')} |`
      );
    }
  }

  const generic = [...new Set(summary.groups.flatMap((group) => Object.keys(group.playerChoices)))].sort();

  if (generic.length > 0) {
    lines.push(
      '',
      '## Player chosen in generic tasks',
      '',
      `| Agent | Arm | ${generic.join(' | ')} |`,
      `| --- | --- | ${generic.map(() => '---').join(' | ')} |`
    );

    for (const group of summary.groups) {
      lines.push(
        `| ${group.agent} | ${group.arm} | ${generic.map((choice) => group.playerChoices[choice] ?? 0).join(' | ')} |`
      );
    }
  }

  const interactive = summary.groups.filter((group) => group.interaction);

  if (interactive.length > 0) {
    lines.push(
      '',
      '## Asking and telling',
      '',
      'From the simulated user: questions the task needs asked (the outcome depends on them and the project cannot tell), questions it did not need, and whether the final message says what the agent decided on its own.',
      '',
      '| Agent | Arm | Trials | Needed questions asked | Unneeded questions per trial | Told the user its choices |',
      '| --- | --- | --- | --- | --- | --- |'
    );

    for (const group of interactive) {
      const { trials, necessary, askedNecessary, unnecessary, disclosable, disclosed } = group.interaction!;

      lines.push(
        `| ${group.agent} | ${group.arm} | ${trials} | ${necessary ? `${askedNecessary}/${necessary}` : '—'} | ${(unnecessary / trials).toFixed(2)} | ${disclosable ? `${disclosed}/${disclosable}` : '—'} |`
      );
    }
  }

  lines.push(
    '',
    '## How agents worked',
    '',
    'Share of trials where the agent did each thing.',
    '',
    `| Agent | Arm | ${SIGNAL_COLUMNS.map(([, title]) => title).join(' | ')} |`,
    `| --- | --- | ${SIGNAL_COLUMNS.map(() => '---').join(' | ')} |`
  );

  for (const group of summary.groups) {
    lines.push(
      `| ${group.agent} | ${group.arm} | ${SIGNAL_COLUMNS.map(([name]) => `${Math.round((group.signals[name] ?? 0) * 100)}%`).join(' | ')} |`
    );
  }

  const labels = [...new Set(summary.groups.flatMap((group) => Object.keys(group.failureLabels ?? {})))];

  if (labels.length > 0) {
    const totals = new Map(
      labels.map((label) => [label, sum(summary.groups.map((group) => group.failureLabels?.[label] ?? 0))])
    );

    labels.sort((a, b) => totals.get(b)! - totals.get(a)!);
    lines.push(
      '',
      '## Why trials failed',
      '',
      'The first check each failing trial missed, in words.',
      '',
      `| Agent | Arm | ${labels.join(' | ')} |`,
      `| --- | --- | ${labels.map(() => '---').join(' | ')} |`
    );

    for (const group of summary.groups) {
      lines.push(
        `| ${group.agent} | ${group.arm} | ${labels.map((label) => group.failureLabels?.[label] ?? 0).join(' | ')} |`
      );
    }
  }

  return `${lines.join('\n')}\n`;
}

/** Paired changes per agent and arm, with the tasks that flipped. */
function renderChanges(lines: string[], summary: RunSummary, baseline: RunSummary): void {
  const rows: string[] = [];
  const flips: string[] = [];

  for (const group of summary.groups) {
    const key = `${group.agent}/${group.arm}`;
    const now = column(summary.tasks, key);
    const then = column(baseline.tasks, key);
    const paired = pairedChange(now, then, 'onSpec');
    if (!paired) continue;

    const points = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value * 100)}`;
    const verdict =
      paired.low > 0 ? 'better' : paired.high < 0 ? 'worse' : Math.abs(paired.delta) < 0.005 ? 'same' : 'within noise';

    rows.push(
      `| ${group.agent} | ${group.arm} | ${Math.round(paired.before * 100)}% → ${Math.round(paired.after * 100)}% | ${points(paired.delta)} pts (${points(paired.low)} to ${points(paired.high)}) | ±${Math.round(paired.detectable * 100)} pts | ${paired.tasks} | ${verdict} |`
    );

    for (const [task, cell] of Object.entries(now)) {
      const before = then[task];

      if (before && before.onSpec / before.total !== cell.onSpec / cell.total) {
        flips.push(`- ${key} ${task}: ${before.onSpec}/${before.total} → ${cell.onSpec}/${cell.total}`);
      }
    }
  }

  if (rows.length === 0) return;

  lines.push(
    '',
    `## Changes since ${baseline.label}`,
    '',
    'On spec over the tasks both runs share, paired by task. The range is a 95% interval; changes smaller than the detectable size are indistinguishable from noise with this many tasks.',
    '',
    '| Agent | Arm | On spec | Change | Detectable | Tasks | Verdict |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows
  );

  if (flips.length > 0) lines.push('', 'Tasks that changed:', '', ...flips.slice(0, 40));
}

function formatRate(current: Rate): string {
  const percent = (value: number) => Math.round(value * 100);

  return `${current.passed}/${current.total} (${percent(current.passed / (current.total || 1))}%, ${percent(current.low)}–${percent(current.high)})`;
}
