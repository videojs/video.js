/**
 * Docs MCP eval: does the Video.js docs MCP server help coding agents write correct Video.js 10 code?
 *
 * Each task in `tasks.ts` seeds a small project in a temp directory and runs Claude Code headless (`claude -p`) in it,
 * once per condition: `baseline` has no MCP server and `mcp` has only the docs server. Runs use Claude Code's
 * restricted mode, so the agent can only read and edit the project: no shell, no web, no user settings, and no Video.js
 * checkout elsewhere on the machine. The comparison then measures the server rather than what the machine happens to
 * have. A run passes when the final project meets every task assertion and `checkCode` reports no errors in the files
 * it changed.
 *
 * Usage, from `site/`:
 *
 * ```sh
 * pnpm dev:site   # serves the MCP server at http://localhost:4321/mcp
 * pnpm eval:mcp   # every task, both conditions
 * pnpm eval:mcp --tasks react-captions,html-accent-color --conditions mcp --model haiku
 * pnpm eval:mcp --mcp-url https://deploy-preview-123--vjs10-site.netlify.app/mcp --repeat 3
 * ```
 *
 * Every run is a real Claude Code session billed to the signed-in account; a full pass (12 tasks × 2 conditions) on
 * Sonnet can cost several dollars. Results go to `evals/docs-mcp/results/`, with one transcript per run.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { type EvalAssertion, type EvalFramework, type EvalTask, TASKS } from './tasks';

const CONDITIONS = ['baseline', 'mcp'] as const;

type Condition = (typeof CONDITIONS)[number];

const MCP_SERVER_NAME = 'videojs-docs';
const MCP_TOOL_PREFIX = `mcp__${MCP_SERVER_NAME}__`;

const evalDirectory = dirname(fileURLToPath(import.meta.url));
const siteDirectory = join(evalDirectory, '..', '..');
const resultsDirectory = join(evalDirectory, 'results');
const surfacePath = join(siteDirectory, 'src', 'content', 'generated-mcp-surface.json');

// Both conditions get the same instructions, so neither spends its budget installing packages or starting servers.
const APPEND_SYSTEM_PROMPT =
  'You are working in a small sample project. Make the requested change by editing files. Do not install dependencies, run package managers, start dev servers, or ask questions; finish when the files are updated.';

const SOURCE_EXTENSIONS = new Set(['.html', '.htm', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte']);
const GRADED_EXTENSIONS = new Set([...SOURCE_EXTENSIONS, '.css', '.json']);
const IGNORED_SEGMENTS = new Set(['.git', 'node_modules', '.claude', 'dist']);
const LOCKFILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb']);

interface CliOptions {
  tasks: EvalTask[];
  conditions: Condition[];
  mcpUrl: string;
  model: string;
  concurrency: number;
  timeoutMs: number;
  repeat: number;
  web: boolean;
  keep: boolean;
  unrestricted: boolean;
}

interface CodeFinding {
  rule: string;
  severity: 'error' | 'warning';
  line: number;
  column: number;
  message: string;
  fix?: string;
  docsUrl?: string;
}

/** The published package surface the build writes for `check_code`: exports per specifier and custom elements. */
interface PackageSurface {
  modules: Record<string, string[]>;
  elements: Record<string, string[]>;
  assets: string[];
}

type CheckCode = (
  input: { code: string; framework: EvalFramework; language?: string },
  surface: PackageSurface | undefined
) => CodeFinding[];

interface SessionStats {
  exitCode: number | null;
  timedOut: boolean;
  isError: boolean;
  /** Status Claude Code reported for the docs server at startup, when the condition uses it. */
  mcpStatus: string | null;
  turns: number | null;
  costUsd: number | null;
  durationMs: number;
  toolCalls: Record<string, number>;
  mcpCalls: Record<string, number>;
  resultText: string;
}

interface FileFindings {
  file: string;
  findings: CodeFinding[];
}

interface Grade {
  pass: boolean;
  failures: string[];
  changedFiles: string[];
  findings: FileFindings[];
}

interface RunResult {
  taskId: string;
  framework: EvalFramework;
  condition: Condition;
  repeat: number;
  workdir: string | null;
  transcript: string;
  session: SessionStats;
  grade: Grade;
}

interface Job {
  task: EvalTask;
  condition: Condition;
  repeat: number;
}

const HELP = `Usage: tsx evals/docs-mcp/run.ts [options]

  --tasks <ids>          Comma-separated task IDs (default: all)
  --conditions <list>    baseline,mcp (default: both)
  --mcp-url <url>        Docs MCP endpoint (default: http://localhost:4321/mcp)
  --model <model>        Claude Code model alias or name (default: sonnet)
  --concurrency <n>      Parallel runs (default: 2)
  --timeout <minutes>    Per-run limit (default: 10)
  --repeat <n>           Runs per task and condition (default: 1)
  --web                  Allow WebFetch and WebSearch in both conditions
  --keep                 Keep each run's project directory and print its path
  --unrestricted         Give the agent every default tool, including Bash, and bypass permission prompts.
                         By default runs use --restricted: file tools confined to the project, no shell,
                         and no user settings.
  --list                 Print the task IDs and exit
  -h, --help             Show this help

Tasks: ${TASKS.map((task) => task.id).join(', ')}`;

function parseCli(argv: readonly string[]): CliOptions | null {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      tasks: { type: 'string' },
      conditions: { type: 'string' },
      'mcp-url': { type: 'string', default: 'http://localhost:4321/mcp' },
      model: { type: 'string', default: 'sonnet' },
      concurrency: { type: 'string', default: '2' },
      timeout: { type: 'string', default: '10' },
      repeat: { type: 'string', default: '1' },
      web: { type: 'boolean', default: false },
      keep: { type: 'boolean', default: false },
      unrestricted: { type: 'boolean', default: false },
      list: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (values.help) {
    console.log(HELP);
    return null;
  }

  if (values.list) {
    for (const task of TASKS) console.log(`${task.id} (${task.framework}): ${task.prompt}`);

    return null;
  }

  const taskIds = values.tasks?.split(',').map((id) => id.trim()) ?? TASKS.map((task) => task.id);
  const unknownTasks = taskIds.filter((id) => !TASKS.some((task) => task.id === id));
  if (unknownTasks.length > 0) throw new Error(`Unknown task: ${unknownTasks.join(', ')}. Run --list.`);

  const conditions = (values.conditions?.split(',').map((condition) => condition.trim()) ?? [...CONDITIONS]).map(
    (condition) => {
      const known = CONDITIONS.find((candidate) => candidate === condition);
      if (!known) throw new Error(`Unknown condition: ${condition}. Expected baseline or mcp.`);

      return known;
    }
  );

  return {
    tasks: TASKS.filter((task) => taskIds.includes(task.id)),
    conditions,
    mcpUrl: values['mcp-url'],
    model: values.model,
    concurrency: positiveInteger('--concurrency', values.concurrency),
    timeoutMs: positiveInteger('--timeout', values.timeout) * 60_000,
    repeat: positiveInteger('--repeat', values.repeat),
    web: values.web,
    keep: values.keep,
    unrestricted: values.unrestricted,
  };
}

function positiveInteger(flag: string, value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${flag} expects a positive integer, got ${value}.`);

  return parsed;
}

async function loadCheckCode(): Promise<CheckCode | undefined> {
  // A variable specifier keeps type checking independent of whether the module exists yet.
  const modulePath = '../../src/mcp/check-code.ts';

  try {
    // SAFETY: `check-code.ts` exports `checkCode` with the `CheckCode` signature; a missing export is handled below.
    const module = (await import(modulePath)) as { checkCode?: CheckCode };
    if (module.checkCode) return module.checkCode;

    console.warn('⚠ src/mcp/check-code.ts has no checkCode export; grading uses task assertions only.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.warn(`⚠ Could not load src/mcp/check-code.ts (${message}); grading uses task assertions only.`);
  }

  return undefined;
}

function loadSurface(): PackageSurface | undefined {
  if (!existsSync(surfacePath)) {
    console.warn('⚠ generated-mcp-surface.json is missing; checkCode runs without the package surface.');
    return undefined;
  }

  // SAFETY: the site build writes this file from the package declarations; `isPackageSurface` checks its top level.
  const surface = JSON.parse(readFileSync(surfacePath, 'utf8')) as Partial<PackageSurface> | null;
  if (isPackageSurface(surface)) return surface;

  console.warn('⚠ generated-mcp-surface.json has an unexpected shape; checkCode runs without the package surface.');
  return undefined;
}

function isPackageSurface(surface: Partial<PackageSurface> | null): surface is PackageSurface {
  return (
    surface !== null && surface.modules !== undefined && surface.elements !== undefined && Array.isArray(surface.assets)
  );
}

async function preflightMcp(url: string): Promise<void> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'docs-mcp-eval', version: '1' },
        },
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`The docs MCP server at ${url} is unreachable (${message}). Start it with \`pnpm dev:site\`.`);
  }

  if (!response.ok) throw new Error(`The docs MCP server at ${url} answered ${response.status} to initialize.`);
}

function git(cwd: string, args: readonly string[]): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);

  return result.stdout;
}

function seedProject(task: EvalTask, condition: Condition, repeat: number): string {
  const workdir = mkdtempSync(join(tmpdir(), `vjs-eval-${task.id}-${condition}-${repeat}-`));

  for (const [path, contents] of Object.entries(task.fixture)) {
    const file = join(workdir, path);

    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, contents);
  }

  git(workdir, ['init', '--quiet']);
  git(workdir, ['add', '--all']);
  git(workdir, ['-c', 'user.name=eval', '-c', 'user.email=eval@example.com', 'commit', '--quiet', '-m', 'fixture']);

  return workdir;
}

function isIgnored(path: string): boolean {
  const segments = path.split('/');

  return segments.some((segment) => IGNORED_SEGMENTS.has(segment)) || LOCKFILES.has(segments.at(-1) ?? '');
}

/** Files the agent added or modified, relative to the project root. Deleted files are left out. */
function changedFiles(workdir: string): string[] {
  const entries = git(workdir, ['status', '--porcelain=v1', '--untracked-files=all', '-z']).split('\0');
  const files: string[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]!;
    if (entry.length < 4) continue;

    const status = entry.slice(0, 2);
    const path = entry.slice(3);

    // A rename lists the new path first, then the old path as its own entry.
    if (status.startsWith('R') || status.startsWith('C')) index += 1;

    if (!status.includes('D') && !isIgnored(path)) files.push(path);
  }

  return files.sort();
}

function projectSourceFiles(workdir: string, directory = workdir): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    const relativePath = relative(workdir, path).split('\\').join('/');
    if (isIgnored(relativePath)) return [];

    if (entry.isDirectory()) return projectSourceFiles(workdir, path);

    return GRADED_EXTENSIONS.has(extname(entry.name)) ? [relativePath] : [];
  });
}

function failedAssertions(source: string, assertions: readonly EvalAssertion[], expected: boolean): string[] {
  return assertions
    .filter(({ pattern }) => pattern.test(source) !== expected)
    .map(({ reason }) => (expected ? `missing: ${reason}` : `found: ${reason}`));
}

function gradeRun(
  task: EvalTask,
  workdir: string,
  checkCode: CheckCode | undefined,
  surface: PackageSurface | undefined
): Grade {
  const changed = changedFiles(workdir);
  // Grade the final project rather than the diff, so code a migration leaves behind still counts against it.
  const source = projectSourceFiles(workdir)
    .map((file) => `// ---- ${file}\n${readFileSync(join(workdir, file), 'utf8')}`)
    .join('\n');
  const failures = [
    ...(changed.length === 0 ? ['no files changed'] : []),
    ...failedAssertions(source, task.mustMatch, true),
    ...failedAssertions(source, task.mustNotMatch, false),
  ];
  const findings: FileFindings[] = [];

  for (const file of changed) {
    const extension = extname(file);
    if (!checkCode || !SOURCE_EXTENSIONS.has(extension)) continue;

    const code = readFileSync(join(workdir, file), 'utf8');
    const fileFindings = checkCode({ code, framework: task.framework, language: extension.slice(1) }, surface);
    if (fileFindings.length === 0) continue;

    findings.push({ file, findings: fileFindings });

    for (const finding of fileFindings) {
      if (finding.severity === 'error')
        failures.push(`check_code ${finding.rule} at ${file}:${finding.line}: ${finding.message}`);
    }
  }

  return { pass: failures.length === 0, failures, changedFiles: changed, findings };
}

/** The parent session's variables would make Claude Code treat each run as a nested session. */
function childEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !/^(?:CLAUDECODE$|CLAUDE_CODE_|CLAUDE_PID$|CLAUDE_EFFORT$|CLAUDE_AGENT_SDK_)/.test(name)
    )
  );
}

// Restricted runs read and edit only the project, so an agent cannot find a Video.js checkout elsewhere on the machine.
const RESTRICTED_TOOLS = ['Read', 'Edit', 'Write', 'Glob', 'Grep'];
const WEB_TOOLS = ['WebFetch', 'WebSearch'];

function claudeArguments(job: Job, options: CliOptions, mcpConfigPath: string): string[] {
  const isolation = options.unrestricted
    ? ['--permission-mode', 'bypassPermissions', ...(options.web ? [] : ['--disallowedTools', WEB_TOOLS.join(',')])]
    : [
        '--restricted',
        '--tools',
        [...RESTRICTED_TOOLS, ...(options.web ? WEB_TOOLS : [])].join(','),
        '--permission-mode',
        'acceptEdits',
        ...(job.condition === 'mcp' ? ['--allowedTools', `mcp__${MCP_SERVER_NAME}`] : []),
      ];

  return [
    '--print',
    job.task.prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--model',
    options.model,
    '--no-session-persistence',
    '--append-system-prompt',
    APPEND_SYSTEM_PROMPT,
    // Both conditions ignore the user's own MCP servers; only `mcp` lists the docs server.
    '--strict-mcp-config',
    '--mcp-config',
    mcpConfigPath,
    ...isolation,
  ];
}

function emptyStats(): SessionStats {
  return {
    exitCode: null,
    timedOut: false,
    isError: false,
    mcpStatus: null,
    turns: null,
    costUsd: null,
    durationMs: 0,
    toolCalls: {},
    mcpCalls: {},
    resultText: '',
  };
}

interface StreamMessage {
  type?: string;
  subtype?: string;
  is_error?: boolean;
  num_turns?: number;
  total_cost_usd?: number;
  duration_ms?: number;
  result?: string;
  mcp_servers?: Array<{ name?: string; status?: string }>;
  message?: { content?: Array<{ type?: string; name?: string }> };
}

function recordStreamLine(line: string, stats: SessionStats): void {
  if (!line.trim()) return;

  let message: StreamMessage;

  try {
    // SAFETY: stream-json lines are Claude Code's documented message objects; every field read here is optional.
    message = JSON.parse(line) as StreamMessage;
  } catch {
    return;
  }

  if (message.type === 'system' && message.subtype === 'init') {
    stats.mcpStatus = message.mcp_servers?.find((server) => server.name === MCP_SERVER_NAME)?.status ?? null;
    return;
  }

  if (message.type === 'assistant') {
    for (const block of message.message?.content ?? []) {
      if (block.type !== 'tool_use' || !block.name) continue;

      stats.toolCalls[block.name] = (stats.toolCalls[block.name] ?? 0) + 1;

      if (block.name.startsWith(MCP_TOOL_PREFIX)) {
        const tool = block.name.slice(MCP_TOOL_PREFIX.length);

        stats.mcpCalls[tool] = (stats.mcpCalls[tool] ?? 0) + 1;
      }
    }

    return;
  }

  if (message.type === 'result') {
    stats.isError = message.is_error === true || message.subtype !== 'success';
    stats.turns = message.num_turns ?? null;
    stats.costUsd = message.total_cost_usd ?? null;
    stats.resultText = message.result ?? '';

    if (message.duration_ms !== undefined) stats.durationMs = message.duration_ms;
  }
}

function runClaude(job: Job, options: CliOptions, workdir: string, transcriptPath: string): Promise<SessionStats> {
  const configDirectory = mkdtempSync(join(tmpdir(), 'vjs-eval-mcp-config-'));
  const mcpConfigPath = join(configDirectory, 'mcp.json');
  const servers = job.condition === 'mcp' ? { [MCP_SERVER_NAME]: { type: 'http', url: options.mcpUrl } } : {};

  writeFileSync(mcpConfigPath, JSON.stringify({ mcpServers: servers }));

  const stats = emptyStats();
  const transcript: string[] = [];
  const startedAt = Date.now();
  const child = spawn('claude', claudeArguments(job, options, mcpConfigPath), {
    cwd: workdir,
    env: childEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let pending = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    const lines = `${pending}${chunk}`.split('\n');

    pending = lines.pop() ?? '';

    for (const line of lines) {
      transcript.push(line);
      recordStreamLine(line, stats);
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => {
    stderr += chunk;
  });

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      stats.timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
    }, options.timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);

      if (pending) {
        transcript.push(pending);
        recordStreamLine(pending, stats);
      }

      stats.exitCode = code;

      if (stats.durationMs === 0) stats.durationMs = Date.now() - startedAt;

      if (code !== 0 && !stats.resultText) stats.resultText = stderr.trim().slice(0, 2_000);

      if (code !== 0 || stats.timedOut) stats.isError = true;

      writeFileSync(transcriptPath, `${transcript.join('\n')}\n`);
      rmSync(configDirectory, { recursive: true, force: true });
      resolve(stats);
    });
  });
}

async function runJob(
  job: Job,
  options: CliOptions,
  runDirectory: string,
  checkCode: CheckCode | undefined,
  surface: PackageSurface | undefined
): Promise<RunResult> {
  const workdir = seedProject(job.task, job.condition, job.repeat);
  const transcript = join(runDirectory, `${job.task.id}.${job.condition}.${job.repeat}.jsonl`);
  const session = await runClaude(job, options, workdir, transcript);
  const grade = gradeRun(job.task, workdir, checkCode, surface);

  if (session.timedOut) grade.failures.unshift('timed out');
  else if (session.isError) grade.failures.unshift(`session error (exit ${session.exitCode})`);

  if (job.condition === 'mcp' && session.mcpStatus !== 'connected') {
    grade.failures.unshift(`docs MCP server status: ${session.mcpStatus ?? 'not reported'}`);
  }

  grade.pass = grade.failures.length === 0;

  if (!options.keep) rmSync(workdir, { recursive: true, force: true });

  return {
    taskId: job.task.id,
    framework: job.task.framework,
    condition: job.condition,
    repeat: job.repeat,
    workdir: options.keep ? workdir : null,
    transcript: relative(siteDirectory, transcript),
    session,
    grade,
  };
}

async function runPool<Input, Output>(
  inputs: readonly Input[],
  concurrency: number,
  run: (input: Input) => Promise<Output>
): Promise<Output[]> {
  const outputs: Output[] = [];
  let next = 0;

  const workers = Array.from({ length: Math.min(concurrency, inputs.length) }, async () => {
    while (next < inputs.length) {
      const index = next;

      next += 1;
      outputs[index] = await run(inputs[index]!);
    }
  });

  await Promise.all(workers);

  return outputs;
}

function sum(values: Record<string, number>): number {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

function formatCost(costUsd: number | null): string {
  return costUsd === null ? '—' : `$${costUsd.toFixed(3)}`;
}

function percent(count: number, total: number): string {
  return total === 0 ? '—' : `${Math.round((count / total) * 100)}%`;
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function report(results: readonly RunResult[], conditions: readonly Condition[]): string {
  const rows = results.map((result) => {
    const mcpCalls = result.condition === 'mcp' ? String(sum(result.session.mcpCalls)) : '—';
    const note = result.grade.failures[0] ?? '';

    return `| ${result.taskId} | ${result.condition}${result.repeat > 1 ? ` #${result.repeat}` : ''} | ${
      result.grade.pass ? 'pass' : 'FAIL'
    } | ${mcpCalls} | ${result.session.turns ?? '—'} | ${formatCost(result.session.costUsd)} | ${Math.round(
      result.session.durationMs / 1000
    )}s | ${escapeCell(note)} |`;
  });
  const summary = conditions.map((condition) => {
    const runs = results.filter((result) => result.condition === condition);
    const passed = runs.filter((result) => result.grade.pass).length;
    const cost = runs.reduce((total, result) => total + (result.session.costUsd ?? 0), 0);
    const line = `- **${condition}**: ${passed}/${runs.length} passed (${percent(passed, runs.length)}), ${formatCost(cost)} total`;

    if (condition !== 'mcp') return line;

    const invoked = runs.filter((result) => sum(result.session.mcpCalls) > 0).length;
    const toolTotals: Record<string, number> = {};

    for (const result of runs) {
      for (const [tool, count] of Object.entries(result.session.mcpCalls)) {
        toolTotals[tool] = (toolTotals[tool] ?? 0) + count;
      }
    }

    const tools = Object.entries(toolTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([tool, count]) => `${tool} ×${count}`)
      .join(', ');

    return `${line}; MCP invoked in ${invoked}/${runs.length} runs (${percent(invoked, runs.length)})${
      tools ? `: ${tools}` : ''
    }`;
  });

  return [
    '| Task | Condition | Result | MCP calls | Turns | Cost | Duration | First failure |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
    ...summary,
  ].join('\n');
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  if (!options) return;

  if (options.conditions.includes('mcp')) await preflightMcp(options.mcpUrl);

  const checkCode = await loadCheckCode();
  const surface = loadSurface();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDirectory = join(resultsDirectory, stamp);
  const jobs = options.tasks.flatMap((task) =>
    options.conditions.flatMap((condition) =>
      Array.from({ length: options.repeat }, (_, index): Job => ({ task, condition, repeat: index + 1 }))
    )
  );

  mkdirSync(runDirectory, { recursive: true });
  console.log(`Running ${jobs.length} sessions on ${options.model} (concurrency ${options.concurrency})…`);

  const results = await runPool(jobs, options.concurrency, async (job) => {
    const result = await runJob(job, options, runDirectory, checkCode, surface);

    console.log(
      `${result.grade.pass ? '✓' : '✗'} ${job.task.id} ${job.condition} #${job.repeat}` +
        (result.workdir ? `  ${result.workdir}` : '') +
        (result.grade.pass ? '' : `  — ${result.grade.failures.join('; ')}`)
    );

    return result;
  });
  const resultsPath = join(resultsDirectory, `${stamp}.json`);

  writeFileSync(
    resultsPath,
    `${JSON.stringify({ startedAt: stamp, model: options.model, mcpUrl: options.mcpUrl, web: options.web, results }, null, 2)}\n`
  );

  console.log(`\n${report(results, options.conditions)}\n`);
  console.log(`Results: ${relative(process.cwd(), resultsPath)}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
