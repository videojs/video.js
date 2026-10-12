// Runs the eval matrix: every selected Video.js build × task × agent × arm × trial, each in a fresh container.
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { parseArgs } from 'node:util';

import { type AgentConfig, type AgentHarness, DEFAULT_AGENT_IDS, findAgent } from '../agents.ts';
import { ARMS, type Arm, armApplies } from '../arms.ts';
import { borrowClaudeLogin, borrowCodexLogin } from '../logins.ts';
import { packWorkspace, REPO_ROOT } from '../pack.ts';
import { readPreviewPackages } from '../registry/proxy.ts';
import { loadRecorded, loadResults, renderMarkdown, saveToHistory, summarize } from '../report.ts';
import { ROUTABLE_HOSTS, type SiteRoutes } from '../sites/forwarder.ts';
import { LIVE_HOST } from '../sites/live-hls.ts';
import { releasePullRequest, resolveSiteRoutes } from '../sites/routes.ts';
import { EVALS_ROOT, fromInvocation, loadTasks, selectTasks, SUITES, type Task, TIERS } from '../tasks.ts';
import { hitUsageLimit, type TrialResult } from '../trial/result.ts';

const HELP = `Usage: pnpm evals [options]

What to test
  --videojs <sources>   Comma-separated Video.js builds, each run separately and compared in order (default: latest):
                          latest          the current npm release, pinned for the whole run
                          10.0.0-rc.2     any published release; npm looks as it did then
                          workspace       this checkout, built and packed the way the release job does
                          <dir>           a directory of packed .tgz files (see pnpm evals:pack)
  --agents <specs>      id[:effort] or claude-code/<model>[:effort], codex/<model>[:effort]
                        (default: ${DEFAULT_AGENT_IDS.join(',')}; also codex-gpt-5.6-sol, claude-sonnet-5 and
                        claude-haiku-4.5 as canaries, and oracle, noop, and mutant, which apply the reference solution,
                        nothing, or the solution plus a deliberate mistake, to check graders without tokens)
  --mode <mode>         attribution (default): videojs.org and shadcn.videojs.org pinned to each build, and the agents'
                        own web search off, since it runs on the provider's servers and reads production; for comparing
                        builds. ecosystem: live docs and web search on, for measuring what agents do in the wild today
  --preview <pr>        Serve videojs.org and shadcn.videojs.org from this pull request's Netlify deploy previews for
                        packed builds (workspace or a directory); packs from evals:pack --preview set it themselves
  --live-docs           Serve production videojs.org and shadcn.videojs.org to releases, which otherwise get their
                        release pull request's deploy previews
  --site <origin>       Serve videojs.org from this origin for every build, such as a Netlify deploy permalink
  --registry <origin>   Serve shadcn.videojs.org from this origin for every build
  --arms <arms>         Comma-separated (default: baseline): baseline sends prompts as written, v10 makes them say
                        "Video.js 10", skill installs the videojs skill, builder appends a quickstart's pinned
                        agents init command, cli points at agents init, interactive has a simulated user answer the
                        agent's questions from the task's answer card
  --suite <suites>      Comma-separated (default: core):
                          core        React and HTML installs: Next.js, Vite, static; packaged, shadcn, CDN;
                                      audio, background, and the neutral skin
                          extended    installs for Vue, Nuxt, SvelteKit, Astro, and a new app
                          generic     no library named; records which player the agent picks
                          customize   changes to a working Video.js 10 player, and Video.js 8 migrations
                          realworld   apps with data, routes, several players, and shared packages
                          onboarding  requests that leave the user a decision, for the interactive arm
                          full        every suite
  --tier <tiers>        smoke (tasks at the ceiling, worth one trial) or main (the rest); default both
  --tasks-dir <dirs>    Colon-separated directories of held-out tasks kept outside this repository
  --tasks <ids>         Task ids, * wildcards allowed; replaces --suite
  --framework <list>    Only tasks for these frameworks: react, html, vue, svelte
  --method <list>       Only tasks for these install methods: packaged, shadcn, cdn
  --preset <list>       Only tasks for these presets: video, audio, background-video
  --trials <n>          Trials per task, agent, arm, and build (default: 1)

Spending
  --effort <level>      Reasoning effort for agents without one in --agents
  --timeout <minutes>   Agent time limit per trial (default: 30)
  --budget <usd>        Claude Code spending cap per turn; Codex has no equivalent
  --max-turns <n>       Claude Code turn cap per turn
  --no-follow-up        Do not answer an agent that stops to ask a question
  --retries <n>         Retries for infrastructure errors (default: 1)

Skill
  --skill-repo <url>    Skill repository (default: https://github.com/videojs/skills)
  --skill-ref <ref>     Branch, tag, SHA, or refs/pull/N/head (default: main)

Output
  --label <name>        Label for a single build (default: its version, or the packed commit)
  --compare <ref>       Compare each build with a label in history/, or latest for the newest recorded one
  --save                Record each build's summary in history/
  --resume <dir>        Continue an interrupted single-build run
  --dry                 Print the plan without running anything

Machine
  --concurrency <n>     Containers at once (default: 2)
  --memory <size>       Memory per container (default: 6g)
  --cpus <n>            CPUs per container (default: 2)
  --work-tmpfs <size>   Keep each workspace and /tmp in memory (for example 4g) instead of on Docker's disk
  --image <tag>         Eval image, rebuilt before each run (default: videojs-agent-evals:local)
  --no-build            Use the existing image without rebuilding it
`;

// Credentials can live in a gitignored .env beside this app; variables already in the environment win.
if (existsSync(join(EVALS_ROOT, '.env'))) process.loadEnvFile(join(EVALS_ROOT, '.env'));

const list = (value: string | undefined) => (value ?? '').split(',').filter(Boolean);

const { values: options } = parseArgs({
  options: {
    videojs: { type: 'string', default: 'latest' },
    preview: { type: 'string' },
    'live-docs': { type: 'boolean', default: false },
    site: { type: 'string' },
    registry: { type: 'string' },
    agents: { type: 'string', default: DEFAULT_AGENT_IDS.join(',') },
    mode: { type: 'string', default: 'attribution' },
    tier: { type: 'string' },
    'tasks-dir': { type: 'string' },
    arms: { type: 'string', default: 'baseline' },
    suite: { type: 'string', default: 'core' },
    tasks: { type: 'string' },
    framework: { type: 'string' },
    method: { type: 'string' },
    preset: { type: 'string' },
    trials: { type: 'string', default: '1' },
    effort: { type: 'string' },
    timeout: { type: 'string', default: '30' },
    budget: { type: 'string' },
    'max-turns': { type: 'string' },
    'no-follow-up': { type: 'boolean', default: false },
    retries: { type: 'string', default: '1' },
    'skill-repo': { type: 'string', default: 'https://github.com/videojs/skills' },
    'skill-ref': { type: 'string', default: 'main' },
    label: { type: 'string' },
    compare: { type: 'string' },
    save: { type: 'boolean', default: false },
    resume: { type: 'string' },
    dry: { type: 'boolean', default: false },
    concurrency: { type: 'string', default: '2' },
    memory: { type: 'string', default: '6g' },
    cpus: { type: 'string', default: '2' },
    'work-tmpfs': { type: 'string' },
    image: { type: 'string', default: 'videojs-agent-evals:local' },
    'no-build': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (options.help) {
  console.log(HELP);
  process.exit(0);
}

const agents = list(options.agents).map((spec) =>
  findAgent(
    options.effort && !spec.includes(':') && !['oracle', 'noop', 'mutant'].includes(spec)
      ? `${spec}:${options.effort}`
      : spec
  )
);

if (options.mode !== 'attribution' && options.mode !== 'ecosystem') {
  throw new Error(`Unknown mode "${options.mode}". Use attribution or ecosystem.`);
}

const ecosystem = options.mode === 'ecosystem';
const extraTaskDirs = (options['tasks-dir'] ?? '').split(':').filter(Boolean).map(fromInvocation);

for (const tier of list(options.tier)) {
  if (!(TIERS as readonly string[]).includes(tier)) throw new Error(`Unknown tier "${tier}". Use ${TIERS.join(', ')}.`);
}

const arms = list(options.arms) as Arm[];

for (const suite of list(options.suite)) {
  if (suite !== 'full' && !(SUITES as readonly string[]).includes(suite)) {
    throw new Error(`Unknown suite "${suite}". Use ${SUITES.join(', ')}, or full.`);
  }
}

const tasks = selectTasks(loadTasks(undefined, extraTaskDirs), {
  suites: list(options.suite),
  tiers: list(options.tier),
  ids: list(options.tasks),
  frameworks: list(options.framework),
  methods: list(options.method),
  presets: list(options.preset),
});
const trialCount = Number(options.trials);
const retries = Number(options.retries);
const sourceSpecs = list(options.videojs);

for (const arm of arms) {
  if (!ARMS.includes(arm)) throw new Error(`Unknown arm "${arm}". Use any of ${ARMS.join(', ')}.`);
}

if (sourceSpecs.length > 1 && (options.label || options.resume)) {
  throw new Error('--label and --resume apply to a single --videojs build.');
}

/** One Video.js build under test, with its own run directory and summary. */
interface Source {
  spec: string;
  label: string;
  /** Pinned npm release, for published builds. */
  release: string | null;
  /** Packed tarballs, for unreleased builds. */
  packagesDir: string | null;
  runDir: string;
  /** Videojs.org and shadcn.videojs.org served from other origins, such as deploy previews. */
  routes: SiteRoutes;
}

const startedAt = new Date().toISOString().slice(0, 19).replaceAll(':', '-');
const sources = sourceSpecs.map(resolveSource);

for (const source of sources) {
  const recorded = source.packagesDir ? readSourceFile(source.packagesDir) : {};
  // Production deploys every merge to main, so it drifts from a release, even ahead of npm once the next release pull
  // request merges. A release reads the docs and registry it shipped with.
  const liveDocs = options['live-docs'] || ecosystem;
  const releasePreview = source.release && !liveDocs ? await releasePullRequest(source.release, REPO_ROOT) : null;
  const preview = source.release ? releasePreview : (options.preview ?? recorded.preview);

  if (source.release && !liveDocs && !releasePreview) {
    console.log(
      `${source.label}: no release pull request found; videojs.org and shadcn.videojs.org stay on production.`
    );
  }

  const { routes, notes } = await resolveSiteRoutes({
    site: options.site,
    registry: options.registry,
    preview: preview ? Number(preview) : undefined,
  });

  source.routes = routes;

  for (const note of notes) console.log(`${source.label}: ${note}`);
}

const plan = planTrials();

console.log(
  `${plan.length} trials: ${sources.length} build${sources.length > 1 ? 's' : ''} × ${tasks.length} tasks × ` +
    `${agents.length} agents × ${arms.length} arms × ${trialCount} trials, ${options.mode} mode ` +
    `(${ecosystem ? 'live docs, web search on' : 'docs pinned per build, provider web search off'})`
);

for (const source of sources) console.log(`  ${source.label}: ${describeSource(source)}`);

if (options.dry) {
  for (const trial of plan) console.log(`  ${trial.source.label} ${trial.id}`);

  process.exit(0);
}

if (!options['no-build']) buildImage(options.image);

const imageId = inspectImage(options.image);

// Without API keys, reuse the CLIs' own logins. Claude Code renews its token as you use it, so trials re-read it. The
// simulated user runs on Claude too, for interactive trials and tasks with an answer card.
const harnesses = new Set(agents.map(({ harness }) => harness));
const needsSimulator = plan.some((trial) => usesSimulator(trial));
const claudeLogin =
  (harnesses.has('claude-code') || needsSimulator) && !hasAny('ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN')
    ? borrowClaudeLogin()
    : null;
const codexLogin = harnesses.has('codex') && !hasAny('OPENAI_API_KEY', 'CODEX_LOGIN') ? borrowCodexLogin() : null;

if (claudeLogin) console.log(`Claude Code: your login from ${claudeLogin.source}${validUntil(claudeLogin.expiresAt)}`);

if (codexLogin) console.log(`Codex: your ChatGPT login from ${codexLogin.source}${validUntil(codexLogin.expiresAt)}`);

checkCredentials(agents);

if (needsSimulator && !hasAny('ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN')) {
  console.log(
    'No Claude credentials for the simulated user: interactive trials get no answers and no disclosure check.'
  );
}

const skill = arms.includes('skill') ? checkoutSkill(join(EVALS_ROOT, 'results', 'skills', startedAt)) : null;

for (const source of sources) prepareSource(source);

const running = new Set<string>();

process.on('SIGINT', () => {
  console.log('\nStopping containers…');

  for (const name of running) spawnSync('docker', ['kill', name], { stdio: 'ignore' });

  process.exit(130);
});

let finished = 0;
// Usage limits reset on the provider's schedule, so an agent that hits one waits while the others keep going.
const MAX_LIMIT_WAITS = 8;
const pausedUntil = new Map<AgentHarness, number>();
const limitStreaks = new Map<AgentHarness, number>();
const limitWaits = new Map<string, number>();
// A resumed run repeats trials that failed for infrastructure reasons, such as a usage limit that has since reset.
const pending = plan.filter((trial) => {
  const trialDir = join(trial.source.runDir, 'trials', trial.id);
  const resultFile = join(trialDir, 'result.json');
  if (!existsSync(resultFile)) return true;

  if ((JSON.parse(readFileSync(resultFile, 'utf8')) as TrialResult).status !== 'infra-error') return false;

  renameSync(trialDir, `${trialDir}.infra-${Date.now()}`);
  return true;
});
const toRun = pending.length;
const survivors: string[] = [];

if (toRun < plan.length) console.log(`Resuming: ${plan.length - toRun} trials already finished.`);

await Promise.all(
  Array.from({ length: Math.min(Number(options.concurrency), pending.length) }, async () => {
    while (pending.length > 0) {
      const trial = nextTrial();

      if (!trial) {
        await new Promise((resolve) => setTimeout(resolve, 30_000));
        continue;
      }

      const result = await runWithRetries(trial);

      if (result === 'paused') {
        pending.unshift(trial);
        continue;
      }

      finished += 1;
      console.log(`[${finished}/${toRun}] ${describe(trial, result)}`);

      if (trial.mutant && result?.outcome.onSpec) survivors.push(`${trial.task.id} ${trial.mutant.name}`);
    }
  })
);

const summaries = sources.map((source) => {
  const summary = summarize(source.label, [relative(EVALS_ROOT, source.runDir)], loadResults(source.runDir));
  const markdown = renderMarkdown(summary);

  writeJson(join(source.runDir, 'summary.json'), summary);
  writeFileSync(join(source.runDir, 'summary.md'), markdown);

  if (options.save) saveToHistory(summary, markdown);

  return summary;
});

// Each build compared with the requested record, or with the first build when several ran together.
summaries.forEach((summary, index) => {
  const baseline = options.compare
    ? loadRecorded(options.compare, summary.label)
    : index > 0
      ? summaries[0]
      : undefined;

  console.log(`\n${renderMarkdown(summary, baseline)}`);
});

// A mutant the grader passes is a false positive waiting to happen.
if (survivors.length > 0) {
  console.log(`\n${survivors.length} mutants passed the grader:\n${survivors.map((name) => `  ${name}`).join('\n')}`);
  process.exitCode = 1;
}

interface PlannedTrial {
  id: string;
  source: Source;
  task: Task;
  agent: AgentConfig;
  arm: Arm;
  index: number;
  mutant: Task['mutants'][number] | null;
}

/** Builds share the innermost loop, so a comparison's builds run side by side rather than hours apart. */
function planTrials(): PlannedTrial[] {
  const planned: PlannedTrial[] = [];

  for (let index = 1; index <= trialCount; index += 1) {
    for (const task of tasks) {
      for (const agent of agents) {
        if ((agent.harness === 'oracle' || agent.harness === 'mutant') && !task.solution) continue;

        // Each mistake runs once; repeating a script only repeats its result.
        const mutants = agent.harness === 'mutant' ? (index === 1 ? task.mutants : []) : [null];

        for (const arm of arms) {
          if (!armApplies(task, arm)) continue;

          for (const mutant of mutants) {
            for (const source of sources) {
              const agentId = mutant ? `mutant-${mutant.name}` : agent.id;

              planned.push({ id: `${task.id}__${agentId}__${arm}__${index}`, source, task, agent, arm, index, mutant });
            }
          }
        }
      }
    }
  }

  return planned;
}

/** Whether a trial needs the simulated user: to answer questions, or to check what the agent told the user. */
function usesSimulator(trial: PlannedTrial): boolean {
  const agentHarness = trial.agent.harness === 'claude-code' || trial.agent.harness === 'codex';

  return agentHarness && (trial.arm === 'interactive' || trial.task.user !== null);
}

function resolveSource(spec: string): Source {
  const runDirFor = (label: string) =>
    options.resume ? fromInvocation(options.resume) : join(EVALS_ROOT, 'results', label, startedAt);

  if (spec === 'latest' || /^\d+\.\d+\.\d+/.test(spec)) {
    const release = spec === 'latest' ? npmView('@videojs/react', 'dist-tags.latest') : spec;

    if (!release || npmView(`@videojs/react@${release}`, 'version') !== release) {
      throw new Error(`@videojs/react@${spec} is not on npm.`);
    }

    const label = options.label ?? release;

    return { spec, label, release, packagesDir: null, runDir: runDirFor(label), routes: {} };
  }

  if (spec === 'workspace') {
    const commit = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' });
    const label = options.label ?? `workspace-${commit.stdout.trim() || 'unknown'}`;
    const runDir = runDirFor(label);

    return { spec, label, release: null, packagesDir: join(runDir, 'packages'), runDir, routes: {} };
  }

  const packagesDir = fromInvocation(spec);

  if (!existsSync(packagesDir))
    throw new Error(`--videojs ${spec} is not latest, a version, workspace, or a directory.`);

  const label = options.label ?? packsLabel(packagesDir);

  return { spec, label, release: null, packagesDir, runDir: runDirFor(label), routes: {} };
}

/** What `pnpm evals:pack` records beside the packs: a label and the pull request they came from. */
function readSourceFile(dir: string): { name?: string; preview?: number } {
  const sourceFile = join(dir, 'source.json');

  return existsSync(sourceFile)
    ? (JSON.parse(readFileSync(sourceFile, 'utf8')) as { name?: string; preview?: number })
    : {};
}

function packsLabel(dir: string): string {
  return readSourceFile(dir).name ?? `packs-${basename(dir)}`;
}

function describeSource(source: Source): string {
  const build = source.release
    ? `@videojs/* and video.js from npm, pinned to ${source.release}`
    : source.spec === 'workspace'
      ? 'this checkout, packed'
      : `packs in ${relative(process.cwd(), source.packagesDir!)}`;
  const routed = Object.entries(source.routes)
    .filter(([host]) => host !== 'www.videojs.org')
    .map(([host, origin]) => `${host} from ${origin}`);

  return [build, ...routed].join('; ');
}

function prepareSource(source: Source): void {
  mkdirSync(join(source.runDir, 'trials'), { recursive: true });

  if (source.spec === 'workspace' && !existsSync(source.packagesDir!)) {
    packWorkspace({ root: REPO_ROOT, out: source.packagesDir!, build: true });
  }

  const packed = source.packagesDir ? readPreviewPackages(source.packagesDir) : [];
  if (source.packagesDir && packed.length === 0) throw new Error(`No .tgz packages in ${source.packagesDir}.`);

  if (options.resume) return;

  writeJson(join(source.runDir, 'run.json'), {
    label: source.label,
    startedAt: new Date().toISOString(),
    harness: harnessRevision(),
    image: { tag: options.image, id: imageId },
    sites: source.routes,
    videojs: {
      spec: source.spec,
      release: source.release,
      packages: source.packagesDir ? Object.fromEntries(packed.map(({ name, version }) => [name, version])) : null,
    },
    agents,
    arms,
    mode: options.mode,
    webSearch: ecosystem ? 'live' : 'disabled',
    tasks: tasks.map(({ id }) => id),
    trials: trialCount,
    spending: {
      timeoutMinutes: Number(options.timeout),
      budgetUsd: options.budget ?? null,
      maxTurns: options['max-turns'] ?? null,
      followUp: !options['no-follow-up'],
    },
    skill: skill && { repo: options['skill-repo'], ref: options['skill-ref'], sha: skill.sha },
  });
  console.log(`Writing ${source.label} results to ${relative(process.cwd(), source.runDir)}`);
}

/** The next trial whose agent is not paused for a usage limit, so the other agent keeps working meanwhile. */
function nextTrial(): PlannedTrial | undefined {
  const now = Date.now();
  const index = pending.findIndex((trial) => (pausedUntil.get(trial.agent.harness) ?? 0) <= now);

  return index === -1 ? undefined : pending.splice(index, 1)[0];
}

/**
 * Runs a trial, retrying infrastructure errors. A usage limit pauses that agent's trials and puts this one back in the
 * queue instead, since limits last longer than a retry takes; after `MAX_LIMIT_WAITS` pauses it counts as an error.
 */
async function runWithRetries(trial: PlannedTrial): Promise<TrialResult | null | 'paused'> {
  const trialDir = join(trial.source.runDir, 'trials', trial.id);

  for (let attempt = 0; ; attempt += 1) {
    const result = await runTrial(trial, trialDir);
    const waits = limitWaits.get(trial.id) ?? 0;
    const harness = trial.agent.harness;

    if (hitUsageLimit(result) && waits < MAX_LIMIT_WAITS) {
      limitWaits.set(trial.id, waits + 1);
      renameSync(trialDir, `${trialDir}.infra-${Date.now()}`);
      pauseForLimit(harness);
      return 'paused';
    }

    if (result && !hitUsageLimit(result)) limitStreaks.delete(harness);

    if (result?.status !== 'infra-error' || attempt >= retries) return result;

    renameSync(trialDir, `${trialDir}.infra-${Date.now()}`);
  }
}

/** Waits 10 minutes after the first limit an agent hits in a row, doubling up to an hour. */
function pauseForLimit(harness: AgentHarness): void {
  const streak = (limitStreaks.get(harness) ?? 0) + 1;
  const until = Date.now() + Math.min(10 * 60_000 * 2 ** (streak - 1), 60 * 60_000);

  limitStreaks.set(harness, streak);

  if (until > (pausedUntil.get(harness) ?? 0)) {
    pausedUntil.set(harness, until);
    console.log(`${harness} hit a usage limit; pausing its trials until ${new Date(until).toLocaleTimeString()}.`);
  }
}

function runTrial(trial: PlannedTrial, trialDir: string): Promise<TrialResult | null> {
  // An interrupted attempt leaves partial output that would otherwise be appended to.
  rmSync(trialDir, { recursive: true, force: true });
  mkdirSync(trialDir, { recursive: true });
  // The container runs as an unprivileged user that may not own the host directory.
  chmodSync(trialDir, 0o777);

  const name = `vjs-eval-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  const trialEnv: Record<string, string> = {
    EVAL_TASK: trial.task.id,
    EVAL_AGENT: trial.agent.id,
    EVAL_ARM: trial.arm,
    EVAL_TRIAL: String(trial.index),
    EVAL_LABEL: trial.source.label,
    EVAL_TIMEOUT_MINUTES: options.timeout,
    EVAL_IMAGE: `${options.image}@${imageId}`,
    EVAL_IN_CONTAINER: '1',
    EVAL_FOLLOW_UP: options['no-follow-up'] ? '0' : '1',
    EVAL_WEB_SEARCH: ecosystem ? 'live' : 'disabled',
  };

  if (trial.mutant) trialEnv.EVAL_MUTANT = trial.mutant.name;

  if (trial.source.release) trialEnv.EVAL_VIDEOJS_RELEASE = trial.source.release;

  if (options.budget) trialEnv.EVAL_BUDGET_USD = options.budget;

  if (options['max-turns']) trialEnv.EVAL_MAX_TURNS = options['max-turns'];

  if (skill && trial.arm === 'skill') {
    trialEnv.EVAL_SKILL_REF = options['skill-ref'];
    trialEnv.EVAL_SKILL_SHA = skill.sha;
  }

  const simulator = usesSimulator(trial);

  // Renewed with time to spare, so a trial never outlives its token.
  if (claudeLogin && (trial.agent.harness === 'claude-code' || simulator)) {
    borrowClaudeLogin(process.env, 5 * 60_000);
  }

  const claudeCredentials = ['ANTHROPIC_API_KEY', 'CLAUDE_CODE_OAUTH_TOKEN'].filter((key) => process.env[key]);
  const credentials = [
    ...trial.agent.credentials.filter((key) => process.env[key]),
    ...(simulator && trial.agent.harness !== 'claude-code' ? claudeCredentials : []),
  ];

  // The trial hides the simulated user's credentials from a Codex agent's shell.
  if (simulator && trial.agent.harness !== 'claude-code') trialEnv.EVAL_SIMULATOR_CREDENTIALS = '1';

  const args = [
    'run',
    '--rm',
    '--init',
    '--name',
    name,
    '--shm-size',
    '1g',
    '--memory',
    options.memory,
    '--cpus',
    options.cpus,
    // Values come from this process's environment, so secrets never appear in the command line.
    ...[...Object.keys(trialEnv), ...credentials].flatMap((key) => ['-e', key]),
    '-v',
    `${trialDir}:/out`,
  ];

  if (skill && trial.arm === 'skill') args.push('-v', `${skill.dir}:/skills:ro`);

  if (trial.source.packagesDir) args.push('-v', `${trial.source.packagesDir}:/packages:ro`);

  // Held-out tasks mount inside a directory only the harness's account can enter, like the built-in tasks.
  if (extraTaskDirs.length > 0) {
    const mounted = extraTaskDirs.map((_, index) => `/opt/harness/private/tasks-${index + 1}`);

    extraTaskDirs.forEach((dir, index) => args.push('-v', `${dir}:${mounted[index]}:ro`));
    trialEnv.EVAL_EXTRA_TASKS = mounted.join(':');
    args.push('-e', 'EVAL_EXTRA_TASKS');
  }

  // Routed hosts resolve to the forwarder inside the container, which listens on 443 as the unprivileged user, and
  // local services such as a live stream on 80.
  const routedHosts = ROUTABLE_HOSTS.filter((host) => trial.source.routes[host]);
  const serviceHosts = trial.task.services.includes('live-hls') ? [LIVE_HOST] : [];

  if (routedHosts.length > 0) {
    trialEnv.EVAL_SITE_ROUTES = JSON.stringify(trial.source.routes);
    args.push('-e', 'EVAL_SITE_ROUTES');
  }

  if (routedHosts.length + serviceHosts.length > 0) args.push('--sysctl', 'net.ipv4.ip_unprivileged_port_start=0');

  for (const host of [...routedHosts, ...serviceHosts]) args.push('--add-host', `${host}:127.0.0.1`);

  // The image's user owns the workspace, as it would its own checkout.
  if (options['work-tmpfs']) {
    args.push(
      '--tmpfs',
      `/work:rw,exec,size=${options['work-tmpfs']},uid=1001,gid=1001`,
      '--tmpfs',
      '/tmp:rw,exec,size=1g'
    );
  }

  args.push(options.image, 'node', '/opt/harness/src/trial/main.ts');

  const deadlineMs = (Number(options.timeout) + 30) * 60_000;

  running.add(name);

  return new Promise((resolvePromise) => {
    const child = spawn('docker', args, { env: { ...process.env, ...trialEnv }, stdio: ['ignore', 'pipe', 'pipe'] });
    const log: Buffer[] = [];
    const timer = setTimeout(() => spawnSync('docker', ['kill', name], { stdio: 'ignore' }), deadlineMs);

    child.stdout.on('data', (chunk: Buffer) => log.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => log.push(chunk));
    child.on('close', () => {
      clearTimeout(timer);
      running.delete(name);
      writeFileSync(join(trialDir, 'container.log'), Buffer.concat(log));

      const resultPath = join(trialDir, 'result.json');

      resolvePromise(existsSync(resultPath) ? (JSON.parse(readFileSync(resultPath, 'utf8')) as TrialResult) : null);
    });
  });
}

function describe(trial: PlannedTrial, result: TrialResult | null): string {
  const agentName = trial.mutant ? `mutant ${trial.mutant.name}` : trial.agent.id;
  const name = `${trial.source.label} ${trial.task.id} ${agentName} ${trial.arm} #${trial.index}`;

  if (!result) return `${name} → no result (see container.log)`;

  if (trial.mutant) {
    const caughtBy = result.checks[trial.mutant.expect as keyof TrialResult['checks']]?.ok === false;

    return result.outcome.onSpec
      ? `${name} → SURVIVED: the grader passed it`
      : `${name} → caught at ${result.outcome.firstFailure}${caughtBy ? '' : ` (expected ${trial.mutant.expect})`}`;
  }

  const minutes = (result.agent.durationMs / 60_000).toFixed(1);
  const verdict = result.outcome.onSpec
    ? 'on spec'
    : result.outcome.works
      ? 'works'
      : `fails at ${result.outcome.firstFailure}`;

  return `${name} → ${result.status === 'completed' ? verdict : `${result.status}, ${verdict}`} (${minutes} min)`;
}

function npmView(spec: string, field: string): string | null {
  const view = spawnSync('npm', ['view', spec, field], { encoding: 'utf8' });

  return view.status === 0 ? view.stdout.trim() || null : null;
}

function buildImage(image: string): void {
  console.log(`Building ${image}; cached layers make this quick after the first build.`);

  const build = spawnSync('docker', ['build', '--quiet', '--file', 'docker/Dockerfile', '--tag', image, '.'], {
    cwd: EVALS_ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  if (build.status !== 0) throw new Error(`docker build failed for ${image}.`);
}

function inspectImage(image: string): string {
  const inspect = spawnSync('docker', ['image', 'inspect', image, '--format', '{{.Id}}'], { encoding: 'utf8' });
  if (inspect.status !== 0) throw new Error(`Image ${image} not found. Run without --no-build to build it.`);

  return inspect.stdout.trim();
}

function hasAny(...names: string[]): boolean {
  return names.some((name) => process.env[name]);
}

function validUntil(expiresAt: Date | null): string {
  return expiresAt ? `, token valid until ${expiresAt.toISOString().slice(0, 16).replace('T', ' ')} UTC` : '';
}

function checkCredentials(selected: readonly AgentConfig[]): void {
  const missing = selected.filter(
    (agent) => agent.credentials.length > 0 && !agent.credentials.some((key) => process.env[key])
  );
  const hints: Record<string, string> = {
    'claude-code': 'log in with `claude`, and set CLAUDE_CONFIG_DIR if you use a non-default config directory',
    codex: 'log in with `codex login`, and set CODEX_HOME if you use a non-default Codex home',
  };

  if (missing.length > 0) {
    throw new Error(
      missing
        .map((agent) => `${agent.id} needs ${agent.credentials.join(' or ')}; or ${hints[agent.harness]}.`)
        .join('\n')
    );
  }
}

function checkoutSkill(dir: string): { dir: string; sha: string } {
  const repo = options['skill-repo'];
  const ref = options['skill-ref'];
  const git = (...args: string[]) => {
    const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);

    return result.stdout.trim();
  };

  if (!existsSync(join(dir, '.git'))) {
    mkdirSync(dir, { recursive: true });
    git('init', '-q');
    git('fetch', '-q', '--depth', '1', repo, ref);
    git('checkout', '-q', 'FETCH_HEAD');
  }

  const skillDir = join(dir, 'skills');

  if (!existsSync(join(skillDir, 'videojs', 'SKILL.md'))) {
    throw new Error(`${repo}@${ref} has no skills/videojs/SKILL.md.`);
  }

  return { dir: skillDir, sha: git('rev-parse', 'HEAD') };
}

function harnessRevision(): { commit: string | null; dirty: boolean } {
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: EVALS_ROOT, encoding: 'utf8' });
  const status = spawnSync('git', ['status', '--porcelain', '--', '.'], { cwd: EVALS_ROOT, encoding: 'utf8' });

  return { commit: commit.status === 0 ? commit.stdout.trim() : null, dirty: status.stdout.trim().length > 0 };
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
