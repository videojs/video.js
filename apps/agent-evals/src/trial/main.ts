// Runs one trial inside the eval container: one task, one agent, one arm. The host mounts the trial's output directory
// at /out and, for the skill arm, the pinned skill checkout at /skills.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

import { findAgent } from '../agents.ts';
import { type Arm, armApplies, armPrompt } from '../arms.ts';
import { type BrowserReport, checkInBrowser, type TaskAssertion, type TaskCheck } from '../grade/browser.ts';
import { buildProject, installDependencies, projectCommands, serveProject } from '../grade/serve.ts';
import { analyzeProject, cdnVersion, readInstalledVideojs } from '../grade/static.ts';
import { sh } from '../lib/exec.ts';
import { startRegistryProxy, unpackPreview } from '../registry/proxy.ts';
import { type SiteRoutes, startSiteForwarder } from '../sites/forwarder.ts';
import { startLiveStream } from '../sites/live-hls.ts';
import { FIXTURE_METADATA, loadFixture, loadTasks, taskPrompt } from '../tasks.ts';
import {
  continueTurn,
  copyToAgentHome,
  FOLLOW_UP_PROMPT,
  execAsAgent,
  handOverWorkspace,
  prepareAgent,
  runSolution,
  skillDirectory,
  startTurn,
  stopAgentProcesses,
  webSearchMode,
} from './agents.ts';
import { type InteractionRound, scoreChecks, TRIAL_RESULT_SCHEMA, type TrialResult, USAGE_LIMIT } from './result.ts';
import {
  ANSWERS,
  answerFor,
  classifyTurn,
  disclosedChoices,
  loadAnswerCard,
  MAX_ROUNDS,
  scoreInteraction,
} from './simulator.ts';
import { activitySignals, parseTranscript, type TranscriptSummary } from './transcript.ts';

// Files stay group-writable, so the agent's account can add to the pnpm store the harness's account shares with it.
process.umask(0o002);

const OUT = '/out';
const WORKSPACE = '/work/app';
const SKILL_SOURCE = '/skills/videojs';
const PACKAGES = '/packages';

const taskId = requireEnv('EVAL_TASK');
const agent = findAgent(requireEnv('EVAL_AGENT'));
const arm = requireEnv('EVAL_ARM') as Arm;
const timeoutMs = Number(process.env.EVAL_TIMEOUT_MINUTES ?? 30) * 60_000;

const task = loadTasks().find(({ id }) => id === taskId);
if (!task) throw new Error(`Unknown task ${taskId}.`);

if (!armApplies(task, arm)) throw new Error(`The ${arm} arm does not apply to ${task.id}.`);

const trialIndex = Number(process.env.EVAL_TRIAL ?? 1);
const release = process.env.EVAL_VIDEOJS_RELEASE;
const fixture = loadFixture(task.fixture);
const { prompt: wording, variant } = taskPrompt(task, trialIndex);
const prompt = armPrompt(wording, arm, { task, fixture, release: release ?? null });
const taskCheck = task.check ? ((await import(pathToFileURL(task.check).href)) as TaskCheck) : null;
const card = loadAnswerCard(task.user);
const files = {
  transcript: join(OUT, 'transcript.jsonl'),
  agentLog: join(OUT, 'agent.log'),
  gradeLog: join(OUT, 'grade.log'),
  simulatorLog: join(OUT, 'simulator.log'),
  diff: join(OUT, 'diff.patch'),
  screenshot: join(OUT, 'screenshot.png'),
  forcedScreenshot: join(OUT, 'screenshot.forced.png'),
  result: join(OUT, 'result.json'),
};

const startedAt = new Date().toISOString();

// Packed builds mounted by the host become the latest @videojs packages for the agent and the grader alike.
const registry = existsSync(PACKAGES)
  ? await startRegistryProxy({ packagesDir: PACKAGES })
  : release
    ? await startRegistryProxy({ release })
    : null;

if (registry) Object.assign(process.env, registry.env);

// Deploy previews answer for videojs.org and shadcn.videojs.org, before anything here or in the agent fetches them.
const siteRoutes = process.env.EVAL_SITE_ROUTES ? (JSON.parse(process.env.EVAL_SITE_ROUTES) as SiteRoutes) : null;
const sites = siteRoutes ? await startSiteForwarder(siteRoutes) : null;

// Streams some tasks play, served in the container so the agent and the grader see the same thing.
const liveStream = task.services.includes('live-hls') ? await startLiveStream() : null;

const environment = await describeEnvironment();
// Fingerprinting the docs above goes through the forwarder too; count only what comes after.
const harnessSiteRequests = { ...sites?.requests };

let skill: TrialResult['skill'] = null;

// Agent phase.
const agentStartedAt = Date.now();
const runOptions = { workspace: WORKSPACE, transcriptFile: files.transcript, logFile: files.agentLog, timeoutMs };
const isAgent = agent.harness === 'claude-code' || agent.harness === 'codex';
let exitCode: number | null = null;
let timedOut = false;
let followUp = false;
let setupError: string | null = null;
let rounds: InteractionRound[] | null = null;

try {
  await prepareWorkspace(task.setup);
  await prepareAgent(agent, files.agentLog);

  if (arm === 'skill') skill = await installSkill();

  if (skill && agent.harness === 'codex') skill.visible = await codexSeesSkill();

  if (agent.harness === 'noop') {
    exitCode = 0;
  } else if (agent.harness === 'oracle' || agent.harness === 'mutant') {
    if (!task.solution) throw new Error(`Task ${task.id} has no solution.sh for the oracle.`);

    ({ code: exitCode, timedOut } = await runSolution(task.solution, runOptions));

    if (agent.harness === 'mutant' && exitCode === 0) {
      const mutant = task.mutants.find(({ name }) => name === process.env.EVAL_MUTANT);
      if (!mutant) throw new Error(`Task ${task.id} has no mutant ${process.env.EVAL_MUTANT}.`);

      ({ code: exitCode, timedOut } = await runSolution(mutant.script, runOptions));
    }
  } else {
    await handOverWorkspace('agent');

    ({ code: exitCode, timedOut } = await startTurn(agent, prompt, runOptions));

    if (arm === 'interactive') {
      rounds = await converse();
    } else if (process.env.EVAL_FOLLOW_UP !== '0' && !timedOut && !isInfraFailure(readTranscript())) {
      if (workspaceChanges().length === 0) await reply(FOLLOW_UP_PROMPT);
    }
  }
} catch (error) {
  setupError = error instanceof Error ? error.message : String(error);
} finally {
  if (isAgent) {
    await stopAgentProcesses();
    await handOverWorkspace('harness').catch((error: Error) => {
      setupError ??= error.message;
    });
  }
}

const agentDurationMs = Date.now() - agentStartedAt;

killStrayProcesses();

const transcript = readTranscript();
const signals = activitySignals(transcript);

if (skill && agent.harness === 'claude-code' && transcript.availableSkills) {
  skill.visible = transcript.availableSkills.some((name) => name.includes('videojs'));
}

const changes = changedFiles();

await sh(`git diff --cached -- . ':(exclude)*lock*' > ${files.diff}`, { cwd: WORKSPACE });

const lines = diffLines();
const disclosed =
  isAgent && transcript.finalMessage && simulatorAvailable()
    ? await disclosedChoices(transcript.finalMessage, card, files.simulatorLog)
    : null;
const interaction = rounds || disclosed !== null ? scoreInteraction(rounds ?? [], card, disclosed) : null;

// Grading phase: static analysis of the result, then install, build, serve, and a real browser.
const project = projectCommands(WORKSPACE, fixture);
const appDir = project?.root ?? WORKSPACE;
// A workspace of several packages is analyzed whole, so a player in a shared package counts for the app using it.
const analysisRoot = fixture.root ? WORKSPACE : appDir;
const allFiles = projectFiles(analysisRoot);
const detected = analyzeProject(analysisRoot, allFiles);
const install = project ? await installDependencies(project, files.gradeLog) : null;

detected.installedVersions = readInstalledVideojs(
  analysisRoot,
  allFiles.filter((file) => file.endsWith('package.json')).map((file) => dirname(file))
);

const build = project && install?.ok !== false ? await buildProject(project, files.gradeLog) : null;
const expected = { release: registry?.release ?? null, packages: environment.packages };
const projectAssertions = taskCheck?.project ? await runProjectCheck(taskCheck.project) : null;
let serveError: string | null = project ? null : 'No project to serve.';
let browser: BrowserReport | null = null;
let graderError: string | null = null;
let forcedRelease: NonNullable<TrialResult['diagnostics']>['forcedRelease'] = null;

if (project && install?.ok !== false && build?.ok !== false) {
  const server = await serveProject(project, join(import.meta.dirname, '../grade/static-server.ts'), files.gradeLog);

  if ('error' in server) {
    serveError = server.error;
  } else {
    try {
      browser = await checkInBrowser(
        server.url,
        task.expect,
        files.screenshot,
        registry ? cdnRoute : undefined,
        task.check ?? undefined
      );

      // An agent that pinned another release's CDN files ran that release; rerun with the build under test to see
      // whether it would have worked.
      if (registry && pinsOtherRelease()) {
        const forced = await checkInBrowser(
          server.url,
          task.expect,
          files.forcedScreenshot,
          (name, version, path) => cdnRoute(name, version, path, true),
          task.check ?? undefined
        );

        forcedRelease = {
          render: (forced.playerSize?.height ?? 0) > 0 && forced.mediaAttached,
          playback: forced.playback.ok,
          detail: forced.playback.detail,
        };
      }
    } catch (error) {
      // The grader failed, not the agent: report it as infrastructure so the host retries the trial.
      graderError = error instanceof Error ? error.message : String(error);
    } finally {
      server.stop();
    }
  }
}

const checks = scoreChecks({ task, detected, install, build, serveError, browser, expected, projectAssertions });
const status = classifyStatus();

const result: TrialResult = {
  schema: TRIAL_RESULT_SCHEMA,
  trial: {
    task: task.id,
    suite: task.suite,
    tier: task.tier,
    agent: agent.id,
    harness: agent.harness,
    model: agent.model ?? null,
    effort: agent.effort ?? null,
    arm,
    prompt,
    variant,
    mutant: process.env.EVAL_MUTANT ?? null,
    index: trialIndex,
    label: process.env.EVAL_LABEL ?? null,
    fixture: fixture.name,
    expect: task.expect,
  },
  status,
  startedAt,
  finishedAt: new Date().toISOString(),
  environment,
  skill,
  agent: {
    exitCode,
    timedOut,
    setupError,
    followUp,
    durationMs: agentDurationMs,
    observedModel: transcript.model,
    cliVersion: transcript.cliVersion,
    availableSkills: transcript.availableSkills,
    turns: transcript.turns,
    toolCalls: transcript.toolCalls,
    usage: transcript.usage,
    costUsd: transcript.costUsd,
    errors: transcript.errors.slice(0, 10),
    finalMessage: transcript.finalMessage?.slice(0, 4_000) ?? null,
  },
  activity: {
    signals,
    commands: transcript.commands.slice(0, 400),
    webFetches: transcript.webFetches,
    webSearches: transcript.webSearches,
    skillsInvoked: transcript.skillsInvoked,
    siteRequests: sites
      ? Object.fromEntries(
          Object.entries(sites.requests)
            .map(([host, count]) => [host, count - (harnessSiteRequests[host] ?? 0)] as const)
            .filter(([, count]) => count > 0)
        )
      : null,
  },
  changes: { files: changes, linesAdded: lines.added, linesRemoved: lines.removed },
  provenance: {
    webSearch: webSearchMode(),
    sites: siteRoutes,
    searches: transcript.searches.slice(0, 50),
    cdnVersions: [...new Set(detected.cdnUrls.map(cdnVersion).filter((version) => version !== null))],
  },
  interaction,
  diagnostics: { forcedRelease },
  project: project && {
    root: relative(WORKSPACE, project.root) || '.',
    template: project.template,
    packageManager: project.packageManager,
  },
  detected,
  steps: { install, build, serveError, graderError, browser, projectAssertions },
  checks: checks.checks,
  outcome: checks.outcome,
};

writeFileSync(files.result, `${JSON.stringify(result, null, 2)}\n`);
// The finished project without dependencies or build output, so a grader fix can regrade the trial later.
await sh(
  `tar -czf ${join(OUT, 'workspace.tgz')} --exclude=node_modules --exclude=.git --exclude=.next --exclude=dist ` +
    '--exclude=.svelte-kit --exclude=.nuxt --exclude=.output --exclude=.astro -C /work app',
  { cwd: '/work', timeoutMs: 120_000 }
);
registry?.close();
sites?.close();
liveStream?.close();
console.log(
  `${task.id} ${agent.id} ${arm} #${result.trial.index}: ${status} works=${checks.outcome.works} onSpec=${checks.outcome.onSpec}` +
    (checks.outcome.firstFailure ? ` first failure=${checks.outcome.firstFailure}` : '')
);

// A server the grader started can escape the process group it stops, and its open pipes would keep this process, and
// the container, alive until the host's timeout.
killStrayProcesses();
process.exit(0);

function classifyStatus(): TrialResult['status'] {
  if (setupError || graderError) return 'infra-error';

  if (agent.harness === 'oracle' || agent.harness === 'noop' || agent.harness === 'mutant')
    return timedOut ? 'timeout' : exitCode === 0 ? 'completed' : 'agent-error';

  if (isInfraFailure(transcript) || transcript.events === 0) return 'infra-error';

  // Killed while the CLI was still retrying the API: the model never got to work.
  if (timedOut && transcript.lastEventType === 'api_retry') return 'infra-error';

  if (timedOut) return 'timeout';

  // Codex can start without a working shell tool; a run that never acted is a harness failure, not a model failure.
  if (agent.harness === 'codex' && transcript.toolCalls === 0 && changes.length === 0) return 'infra-error';

  return exitCode === 0 ? 'completed' : 'agent-error';
}

/**
 * Keeps CDN URLs on the build under test. Packed packages are not on the CDN yet, so their files come from the packs,
 * unpacked on first use. With a pinned release, a URL without an exact version would load whatever is newest, so it
 * loads the pinned release instead; exact versions stay as the agent wrote them, and fail the version check, unless
 * `force` reruns the page on the build under test to diagnose them.
 */
function cdnRoute(
  name: string,
  version: string | null,
  path: string,
  force = false
): { file: string } | { url: string } | null {
  const exact = version !== null && /^\d+\.\d+\.\d+/.test(version);

  if (registry?.release) {
    return exact && !force ? null : { url: `https://cdn.jsdelivr.net/npm/${name}@${registry.release}/${path}` };
  }

  const preview = registry?.packages.find((candidate) => candidate.name === name);
  if (!preview || (exact && !force && version !== preview.version)) return null;

  const root = join('/tmp/videojs-preview', name);
  const packageRoot = existsSync(join(root, 'package'))
    ? join(root, 'package')
    : unpackPreview(PACKAGES, preview, root);
  const file = join(packageRoot, path);

  return file.startsWith(`${packageRoot}/`) && existsSync(file) ? { file } : null;
}

function readTranscript(): TranscriptSummary {
  return parseTranscript(agent.harness, existsSync(files.transcript) ? readFileSync(files.transcript, 'utf8') : '');
}

/** Sends the user's next message if time allows. */
async function reply(message: string): Promise<boolean> {
  const remainingMs = timeoutMs - (Date.now() - agentStartedAt);
  const next = remainingMs > 60_000 ? continueTurn(agent, { ...runOptions, timeoutMs: remainingMs }, message) : null;
  if (!next) return false;

  followUp = true;
  ({ code: exitCode, timedOut } = await next);

  return true;
}

/**
 * The interactive arm: after each turn, the simulated user answers the questions the agent is waiting on, from the
 * task's answer card, up to `MAX_ROUNDS` times, then asks it to decide. Questions it asks without waiting, such as
 * offers after finishing, are recorded but not answered.
 */
async function converse(): Promise<InteractionRound[]> {
  const rounds: InteractionRound[] = [];

  for (let round = 0; !timedOut; round += 1) {
    const summary = readTranscript();
    if (isInfraFailure(summary) || !summary.finalMessage) break;

    const edited = workspaceChanges().length > 0;
    const turn = await classifyTurn(summary.finalMessage, card, files.simulatorLog);

    if (!turn?.blocking) {
      if (turn && turn.questions.length > 0) {
        rounds.push({
          question: turn.questions.map(({ text }) => text).join(' / '),
          topics: answerFor(turn, card).topics,
          answer: '',
          editedBefore: edited,
        });
      }

      // Stopped without asking or changing anything: the same nudge every other arm gets.
      if (!edited && round === 0) await reply(FOLLOW_UP_PROMPT);

      break;
    }

    const { answer, topics } = round < MAX_ROUNDS ? answerFor(turn, card) : { answer: ANSWERS.done, topics: [] };

    rounds.push({ question: turn.questions.map(({ text }) => text).join(' / '), topics, answer, editedBefore: edited });

    if (!(await reply(answer)) || round >= MAX_ROUNDS) break;
  }

  return rounds;
}

/** The simulated user runs on Claude; a Codex trial gets its credentials only when it needs them. */
function simulatorAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN);
}

async function runProjectCheck(hook: NonNullable<TaskCheck['project']>): Promise<TaskAssertion[]> {
  try {
    return await hook({ appDir: analysisRoot, files: allFiles, changedFiles: changes });
  } catch (error) {
    return [{ name: 'project', ok: false, detail: error instanceof Error ? error.message : String(error) }];
  }
}

/** Whether a CDN URL names a version other than the release under test. */
function pinsOtherRelease(): boolean {
  return detected.cdnUrls.some((url) => {
    const version = cdnVersion(url);

    return version !== null && version !== registry?.release;
  });
}

function diffLines(): { added: number; removed: number } {
  const counts = git(['diff', '--cached', '--numstat', '--', '.', ':(exclude)*lock*'], WORKSPACE).map((line) =>
    line.split('\t')
  );

  return {
    added: counts.reduce((sum, [added]) => sum + (Number(added) || 0), 0),
    removed: counts.reduce((sum, [, removed]) => sum + (Number(removed) || 0), 0),
  };
}

/** Errors that mean the provider or credentials failed, not the model. */
function isInfraFailure(summary: TranscriptSummary): boolean {
  const pattern =
    /529|overloaded|unauthori[sz]ed|401|invalid api key|authentication|credit balance|not supported when using|stream disconnected/i;

  return summary.errors.some((error) => pattern.test(error) || USAGE_LIMIT.test(error));
}

/**
 * Copies the fixture and runs the task's setup, such as installing the player a customization task starts from. Setup
 * installs through the registry proxy, so it gets the build under test. The initial commit includes the setup, so the
 * diff shows only the agent's work.
 */
async function prepareWorkspace(setupScript: string | null): Promise<void> {
  cpSync(fixture.dir, WORKSPACE, { recursive: true, verbatimSymlinks: true });
  rmSync(join(WORKSPACE, FIXTURE_METADATA), { force: true });

  if (setupScript) {
    const setup = await sh(`bash ${JSON.stringify(setupScript)}`, { cwd: WORKSPACE, logFile: files.gradeLog });
    if (setup.code !== 0) throw new Error(`Task setup failed: ${setup.tail}`);
  }

  await sh('git init -q && git add -A && git commit -q --allow-empty -m "Initial commit"', { cwd: WORKSPACE });
}

async function installSkill(): Promise<NonNullable<TrialResult['skill']>> {
  const target = skillDirectory(agent);

  if (!existsSync(SKILL_SOURCE)) throw new Error(`The skill arm needs the skill mounted at ${SKILL_SOURCE}.`);

  if (target) await copyToAgentHome(SKILL_SOURCE, target);

  return {
    ref: process.env.EVAL_SKILL_REF ?? null,
    sha: process.env.EVAL_SKILL_SHA ?? null,
    installedTo: target,
    sha256: hashDirectory(SKILL_SOURCE),
    visible: null,
  };
}

/** Renders the prompt Codex would send and checks the skill is listed, without spending a model call. */
async function codexSeesSkill(): Promise<boolean> {
  const result = await execAsAgent('bash', ['-c', 'codex debug prompt-input probe | grep -q "videojs:"'], {
    cwd: WORKSPACE,
    timeoutMs: 60_000,
  });

  return result.code === 0;
}

/** Every file in the project, relative to its root: a migration is unfinished while any file still uses Video.js 8. */
function projectFiles(root: string): string[] {
  return git(['ls-files', '--cached', '--others', '--exclude-standard'], root);
}

function changedFiles(): string[] {
  git(['add', '-A'], WORKSPACE);

  return git(['diff', '--cached', '--name-only'], WORKSPACE);
}

/** What the agent has changed so far, read without writing: during its turn the workspace belongs to the agent. */
function workspaceChanges(): string[] {
  return execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd: WORKSPACE,
    encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  })
    .split('\n')
    .filter(Boolean);
}

/** Output lines of a git command, read in full: file lists outgrow the tail that `sh` keeps. */
function git(args: readonly string[], cwd: string): string[] {
  return execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .filter(Boolean);
}

/** Agents leave dev servers and watchers behind; the container is dedicated to this trial, so stop everything else. */
function killStrayProcesses(): void {
  if (!existsSync('/.dockerenv') && process.env.EVAL_IN_CONTAINER !== '1') return;

  const keep = new Set([1, process.pid, process.ppid]);

  for (const entry of readdirSync('/proc')) {
    const pid = Number(entry);
    if (!Number.isInteger(pid) || keep.has(pid)) continue;

    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Already gone or not ours.
    }
  }
}

async function describeEnvironment(): Promise<TrialResult['environment']> {
  const version = async (command: string) => {
    const result = await sh(command, { cwd: '/', timeoutMs: 30_000 });

    return result.code === 0 ? result.tail.trim().split('\n').at(-1)! : null;
  };
  const latest = async (name: string) => version(`npm view ${name} version 2>/dev/null`);

  return {
    image: process.env.EVAL_IMAGE ?? null,
    node: process.version,
    npm: await version('npm --version'),
    pnpm: await version('pnpm --version'),
    claudeCode: await version('claude --version'),
    codex: await version('codex --version'),
    packages: registry?.packages.length
      ? Object.fromEntries(registry.packages.map(({ name, version }) => [name, version]))
      : null,
    release: registry?.release ?? null,
    sites: siteRoutes,
    latestPackages: {
      '@videojs/react': await latest('@videojs/react'),
      '@videojs/html': await latest('@videojs/html'),
      '@videojs/cdn': await latest('@videojs/cdn'),
    },
    docs: {
      'videojs.org/llms.txt': await fingerprintUrl('https://videojs.org/llms.txt'),
      'videojs.org/docs/framework/react/llms.txt': await fingerprintUrl(
        'https://videojs.org/docs/framework/react/llms.txt'
      ),
      'videojs.org/docs/framework/html/llms.txt': await fingerprintUrl(
        'https://videojs.org/docs/framework/html/llms.txt'
      ),
    },
  };
}

async function fingerprintUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return null;

    return createHash('sha256')
      .update(await response.text())
      .digest('hex')
      .slice(0, 16);
  } catch {
    return null;
  }
}

function hashDirectory(dir: string): string {
  const hash = createHash('sha256');

  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true }).sort((a, b) =>
    join(a.parentPath, a.name).localeCompare(join(b.parentPath, b.name))
  )) {
    if (!entry.isFile()) continue;

    const path = join(entry.parentPath, entry.name);

    hash.update(relative(dir, path)).update(readFileSync(path));
  }

  return hash.digest('hex').slice(0, 16);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);

  return value;
}
