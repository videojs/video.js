import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type Framework = 'react' | 'html' | 'vue' | 'svelte';
export type InstallMethod = 'packaged' | 'shadcn' | 'cdn';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
export type Preset = 'video' | 'audio' | 'live-video' | 'live-audio' | 'background-video';

/**
 * What a correct result looks like. Names follow the installation options in `agents init` and the docs. Omitted fields
 * are not graded, such as the install method of a customization task.
 */
export interface TaskExpectation {
  /** `any` accepts whatever framework the agent picks, such as for a new app with no stated stack. */
  framework: Framework | 'any';
  /** `any` accepts whatever player the agent chooses and records the choice; the default requires Video.js 10. */
  library?: 'videojs-10' | 'any';
  method?: InstallMethod;
  preset?: Preset;
  /**
   * `minimal` is the understated skin, renamed neutral in 10.0.0-rc.5. Tasks and results keep the old name, so runs
   * from either side of the rename still compare.
   */
  skin?: 'default' | 'minimal' | 'none';
  media?: string;
  /** The media URL the prompt gives. The player must request it, or the same Mux asset in another format. */
  source?: string;
  /** Text on the page the player must sit below, such as the intro paragraph the prompt names. */
  after?: string;
  /**
   * Video.js 8 that the project keeps on purpose, such as another page the prompt leaves alone. The page under test
   * must still run Video.js 10 only.
   */
  v8?: 'forbidden' | 'elsewhere';
  /** `click` presses the player's play button; `autoplay` expects playback without interaction. */
  playback: 'click' | 'autoplay';
}

/**
 * `core` runs by default. `extended` covers more frameworks, `generic` names no library, `customize` starts from a
 * working Video.js 10 player and asks for a change, `realworld` works inside apps with data, routes, and several
 * players, and `onboarding` leaves a decision the user has to make, for the interactive arm to measure asking.
 */
export const SUITES = ['core', 'extended', 'generic', 'customize', 'realworld', 'onboarding'] as const;
export type Suite = (typeof SUITES)[number];

/**
 * `smoke` tasks sit at the ceiling for the agents that matter and run once per release to catch breakage. `main` tasks
 * still separate good releases from bad ones, so they get the trials.
 */
export const TIERS = ['smoke', 'main'] as const;
export type Tier = (typeof TIERS)[number];

export interface Task {
  id: string;
  dir: string;
  /** The first wording. */
  prompt: string;
  /** Every wording, from `PROMPT.md`, `PROMPT.2.md`, and so on. Trial `n` sends wording `n`, cycling. */
  prompts: string[];
  fixture: string;
  suite: Suite;
  tier: Tier;
  /** Arms the task runs in, when it only makes sense in some, such as a mismatched builder prompt. */
  arms: string[] | null;
  expect: TaskExpectation;
  /**
   * Flags the builder arm passes to `agents init` in place of the ones derived from `expect`, to test an agent handed a
   * command that does not fit the project.
   */
  builder: Record<string, string> | null;
  /** Reference solution script for the oracle agent, when the task has one. */
  solution: string | null;
  /** Script that prepares the project before the agent starts, such as installing a player to customize. */
  setup: string | null;
  /** Local services the container runs for the trial, such as `live-hls`, a live stream at media.acme.test. */
  services: string[];
  /** Module with browser and project assertions specific to the task (`check.ts`). */
  check: string | null;
  /** The simulated user's answer card for the interactive arm (`user.json`). */
  user: string | null;
  /**
   * Deliberate mistakes applied after the solution (`mutants/<name>.sh`), each naming the check that has to catch it in
   * a `# expect: <check>` line. They show the grader rejects near misses, not just empty projects.
   */
  mutants: Array<{ name: string; script: string; expect: string }>;
}

export interface Fixture {
  name: string;
  dir: string;
  framework: Framework | null;
  template: string | null;
  packageManager: PackageManager | null;
  /** Shell command, `null` for a site without a build step, or `detect` to infer it from the finished project. */
  build: string | null;
  /** Shell command with a `{port}` placeholder, `static` for a plain file server, or `detect`. */
  serve: string;
  /** The app to build and serve, relative to the workspace, when the fixture is a workspace of several packages. */
  root?: string;
}

/** Harness metadata that stays out of the agent's workspace. */
export const FIXTURE_METADATA = 'fixture.json';

export const EVALS_ROOT = resolve(import.meta.dirname, '..');

/** Resolves a path the user typed against the directory they ran the command in; pnpm scripts move to the package. */
export function fromInvocation(path: string): string {
  return resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

/**
 * Tasks under `tasks/`, plus any held-out task directories in `EVAL_EXTRA_TASKS` (colon-separated). Held-out tasks live
 * outside this repository, so people writing the docs and the skill never see them; they use the fixtures here.
 */
export function loadTasks(root = EVALS_ROOT, extraDirs = extraTaskDirs()): Task[] {
  const tasks = [join(root, 'tasks'), ...extraDirs].flatMap((tasksDir) =>
    // Directories starting with `_` hold shared setup scripts and assets, not tasks.
    readdirSync(tasksDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
      .map((entry) => loadTask(join(tasksDir, entry.name)))
  );
  const ids = new Set<string>();

  for (const { id } of tasks) {
    if (ids.has(id)) throw new Error(`Task id ${id} appears twice.`);

    ids.add(id);
  }

  return tasks.sort((a, b) => a.id.localeCompare(b.id));
}

function extraTaskDirs(): string[] {
  return (process.env.EVAL_EXTRA_TASKS ?? '').split(':').filter(Boolean);
}

function loadTask(dir: string): Task {
  const id = dir.split('/').at(-1)!;
  const config = JSON.parse(readFileSync(join(dir, 'task.json'), 'utf8')) as Pick<
    Task,
    'fixture' | 'suite' | 'expect'
  > & {
    tier?: Tier;
    arms?: string[];
    builder?: Record<string, string>;
    setup?: string;
    services?: string[];
  };
  const solution = join(dir, 'solution.sh');
  const check = join(dir, 'check.ts');
  const user = join(dir, 'user.json');
  const prompts = readdirSync(dir)
    .map((name) => ({ name, order: /^PROMPT(?:\.(\d+))?\.md$/.exec(name) }))
    .filter((entry): entry is { name: string; order: RegExpExecArray } => entry.order !== null)
    .sort((a, b) => Number(a.order[1] ?? 1) - Number(b.order[1] ?? 1))
    .map(({ name }) => readFileSync(join(dir, name), 'utf8').trim());
  if (prompts.length === 0) throw new Error(`Task ${id} has no PROMPT.md.`);

  return {
    id,
    dir,
    prompt: prompts[0]!,
    prompts,
    fixture: config.fixture,
    suite: config.suite,
    tier: config.tier ?? 'main',
    arms: config.arms ?? null,
    expect: config.expect,
    builder: config.builder ?? null,
    solution: existsSync(solution) ? solution : null,
    setup: config.setup ? resolve(dir, config.setup) : null,
    services: config.services ?? [],
    check: existsSync(check) ? check : null,
    user: existsSync(user) ? user : null,
    mutants: loadMutants(join(dir, 'mutants')),
  };
}

function loadMutants(dir: string): Task['mutants'] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((name) => name.endsWith('.sh'))
    .sort()
    .map((name) => {
      const script = join(dir, name);
      const expect = /^#\s*expect:\s*([\w-]+)/m.exec(readFileSync(script, 'utf8'))?.[1];
      if (!expect) throw new Error(`${script} needs a "# expect: <check>" line.`);

      return { name: name.replace(/\.sh$/, ''), script, expect };
    });
}

/** The wording trial `index` (from 1) sends. */
export function taskPrompt(task: Pick<Task, 'prompts'>, index: number): { prompt: string; variant: number } {
  const variant = ((index - 1) % task.prompts.length) + 1;

  return { prompt: task.prompts[variant - 1]!, variant };
}

export function loadFixture(name: string, root = EVALS_ROOT): Fixture {
  const dir = join(root, 'fixtures', name);
  const config = JSON.parse(readFileSync(join(dir, FIXTURE_METADATA), 'utf8')) as Omit<Fixture, 'name' | 'dir'>;

  return { ...config, name, dir };
}

export interface TaskFilter {
  /** Suites to include, or `full` for every task. Ignored when `ids` names tasks. */
  suites: readonly string[];
  /** Tiers to include; empty for every tier. */
  tiers?: readonly string[];
  /** Task ids where `*` matches any run of characters. */
  ids: readonly string[];
  frameworks: readonly string[];
  methods: readonly string[];
  presets: readonly string[];
}

/** Selects tasks by id, or by suite, then narrows them by what each task expects. Empty lists match everything. */
export function selectTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  const matchers = filter.ids.map((id) => new RegExp(`^${id.split('*').map(escapeRegExp).join('.*')}$`));
  // A task that leaves a field ungraded, such as a customization's install method, only matches an empty filter.
  const within = (values: readonly string[], value: string | undefined) =>
    values.length === 0 || (value !== undefined && values.includes(value));
  const selected = tasks.filter(
    (task) =>
      (matchers.length > 0
        ? matchers.some((matcher) => matcher.test(task.id))
        : filter.suites.includes('full') || filter.suites.includes(task.suite)) &&
      within(filter.tiers ?? [], task.tier) &&
      within(filter.frameworks, task.expect.framework) &&
      within(filter.methods, task.expect.method) &&
      within(filter.presets, task.expect.preset)
  );
  if (selected.length === 0) throw new Error('No tasks match the selection.');

  return selected;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
