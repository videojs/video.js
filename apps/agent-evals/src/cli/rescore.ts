// Re-scores finished trials with the current checks, from what each trial recorded, without running agents again.
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { analyzeProject, type StaticReport } from '../grade/static.ts';
import { EVALS_ROOT, FIXTURE_METADATA, fromInvocation, loadFixture, loadTasks, type Task } from '../tasks.ts';
import { scoreChecks, type TrialResult } from '../trial/result.ts';

const HELP = `Usage: pnpm evals:rescore <label | run dir>... [--static]

  Recomputes each trial's checks and outcome from its recorded detection and browser results, so a scoring change
  applies to finished runs. Each trial keeps the expectations it recorded, which match the prompt it was sent, even
  when the task has changed since. The first rescore keeps each changed original as result.original.json. Summarize
  again with pnpm evals:report afterwards.

  --static   Also rerun detection (install method, preset, skin, media) on the finished project, rebuilt from its
             workspace.tgz, or from the fixture and diff.patch for trials without one. Tasks with a setup script need
             workspace.tgz. Browser checks need the page itself; rerun those trials instead.
`;

const regradeStatic = process.argv.includes('--static');
const targets = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));

if (targets.length === 0 || process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(HELP);
  process.exit(targets.length === 0 ? 1 : 0);
}

const tasks = new Map(loadTasks().map((task) => [task.id, task]));
let scored = 0;
let changed = 0;

for (const runDir of targets.flatMap(resolveRuns)) {
  const trialsDir = join(runDir, 'trials');

  for (const name of readdirSync(trialsDir).filter((entry) => !entry.includes('.infra-'))) {
    const resultFile = join(trialsDir, name, 'result.json');
    if (!existsSync(resultFile)) continue;

    const result = JSON.parse(readFileSync(resultFile, 'utf8')) as TrialResult;
    const task = tasks.get(result.trial.task);

    if (!task) {
      console.warn(`Skipped ${name}: task ${result.trial.task} no longer exists.`);
      continue;
    }

    const { steps } = result;
    const detected = regradeStatic
      ? (redetect(join(trialsDir, name), result, task) ?? result.detected)
      : result.detected;
    const next = scoreChecks({
      task: { ...task, expect: result.trial.expect },
      detected,
      install: steps.install,
      build: steps.build,
      serveError: steps.serveError,
      browser: steps.browser,
      expected: { release: result.environment.release, packages: result.environment.packages },
      projectAssertions: steps.projectAssertions ?? null,
    });

    scored += 1;

    if (
      JSON.stringify({ detected, checks: next.checks, outcome: next.outcome }) ===
      JSON.stringify({ detected: result.detected, checks: result.checks, outcome: result.outcome })
    ) {
      continue;
    }

    const original = join(trialsDir, name, 'result.original.json');

    if (!existsSync(original)) copyFileSync(resultFile, original);

    writeFileSync(
      resultFile,
      `${JSON.stringify({ ...result, detected, checks: next.checks, outcome: next.outcome }, null, 2)}\n`
    );
    changed += 1;
  }
}

console.log(`Rescored ${scored} trials; ${changed} changed.`);

/**
 * Detection rerun on the finished project, or `null` when it cannot be rebuilt. Installed versions came from
 * node_modules, which neither source keeps, so they carry over from the recorded detection.
 */
function redetect(trialDir: string, result: TrialResult, task: Task): StaticReport | null {
  const scratch = mkdtempSync(join(tmpdir(), 'evals-rescore-'));

  try {
    const app = join(scratch, 'app');
    const archive = join(trialDir, 'workspace.tgz');

    if (existsSync(archive)) {
      execFileSync('tar', ['-xzf', archive, '-C', scratch]);
    } else if (!task.setup && existsSync(join(trialDir, 'diff.patch'))) {
      cpSync(loadFixture(task.fixture).dir, app, {
        recursive: true,
        filter: (source) => !source.includes('node_modules') && !source.endsWith(FIXTURE_METADATA),
      });
      // The fixture may have moved on since, such as a new packageManager line; apply what still fits.
      spawnSync('git', ['apply', '--reject', '--whitespace=nowarn', join(trialDir, 'diff.patch')], {
        cwd: app,
        stdio: 'ignore',
      });
      restoreDependencies(app, result.detected.videojsPackages);
    } else {
      return null;
    }

    const root = join(app, result.project?.root ?? '.');
    const files = listFiles(root);
    const detected = analyzeProject(root, files);

    for (const [name, version] of Object.entries(result.detected.videojsPackages)) {
      if (name in detected.videojsPackages) detected.videojsPackages[name] = version;
    }

    return { ...detected, installedVersions: result.detected.installedVersions ?? null };
  } catch (error) {
    console.warn(`Could not rebuild ${trialDir}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/** Puts back the Video.js dependencies the trial recorded, in case the manifest's part of the diff no longer applies. */
function restoreDependencies(app: string, packages: Record<string, string>): void {
  const manifestPath = join(app, 'package.json');
  if (!existsSync(manifestPath)) return;

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { dependencies?: Record<string, string> };

  manifest.dependencies = { ...manifest.dependencies, ...packages };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function listFiles(root: string): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath, entry.name)))
    .filter((file) => !/(^|\/)(node_modules|\.git|\.next|dist|\.svelte-kit|\.nuxt|\.output|\.astro)\//.test(file));
}

/** A run directory, or every run under results/<label>. */
function resolveRuns(target: string): string[] {
  const dir = fromInvocation(target);
  if (existsSync(join(dir, 'trials'))) return [dir];

  const labelDir = join(EVALS_ROOT, 'results', target);
  if (!existsSync(labelDir)) throw new Error(`${target} is neither a run directory nor a label under results/.`);

  return readdirSync(labelDir)
    .map((entry) => join(labelDir, entry))
    .filter((entry) => existsSync(join(entry, 'trials')));
}
