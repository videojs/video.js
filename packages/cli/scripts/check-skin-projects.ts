/**
 * Create a `videojs skin create` project for each supported combination against this checkout, then install, typecheck,
 * and build it. The registry, the workbench templates, and the player the CLI generates change independently; this is
 * where they meet. Every framework and styling pair runs every preset on the Scaffold skin, and every base skin on the
 * video preset, rather than the full product. Pass words to run only the combinations whose names contain all of them:
 * `pnpm -F @videojs/cli check:projects react neutral`.
 */
import { mkdir, rm } from 'node:fs/promises';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';

import { registryStylings, type RegistryFramework, type RegistryStyling } from '@videojs/installation';

import { BASE_SKINS, FRAMEWORKS, PRESETS, type BaseSkin } from '../src/skin/options.ts';
import { execFileAsync, prepareLocalCli, type LocalCli } from './local-cli.ts';

interface Combination {
  name: string;
  framework: RegistryFramework;
  styling: RegistryStyling;
  base: BaseSkin;
  preset: (typeof PRESETS)[number];
}

/** A step that failed for one combination, with the output that explains why. */
class Failure extends Error {
  constructor(
    readonly combination: Combination,
    readonly step: string,
    readonly output: string
  ) {
    super(`${combination.name}: ${step} failed`);
  }
}

const projectsDir = join(tmpdir(), 'videojs-skin-projects');
/** Installs share the pnpm store, and `tsc` and Vite each use a core, so a few projects at a time saturate a runner. */
const concurrency = Number(process.env.SKIN_PROJECTS_CONCURRENCY) || Math.max(1, Math.min(4, availableParallelism()));

function combinations(): Combination[] {
  const pairs = FRAMEWORKS.flatMap((framework) =>
    registryStylings(framework).map((styling) => ({ framework, styling }))
  );
  const all = new Map<string, Combination>();
  const add = (combination: Omit<Combination, 'name'>) => {
    const name = `${combination.framework}-${combination.styling}-${combination.base}-${combination.preset}`;

    all.set(name, { name, ...combination });
  };

  for (const pair of pairs) {
    for (const preset of PRESETS) add({ ...pair, base: 'scaffold', preset });

    for (const base of BASE_SKINS) add({ ...pair, base, preset: 'video' });
  }

  return [...all.values()];
}

async function step(combination: Combination, name: string, command: string, args: string[], cwd: string) {
  try {
    await execFileAsync(command, args, { cwd, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // SAFETY: `execFile` rejects with an Error carrying the captured streams.
    const { stdout = '', stderr = '', message } = error as { stdout?: string; stderr?: string; message: string };

    throw new Failure(combination, name, `${stdout}${stderr}` || message);
  }
}

async function check(combination: Combination, cli: LocalCli): Promise<void> {
  const directory = join(projectsDir, combination.name);
  const started = performance.now();

  await rm(directory, { recursive: true, force: true });

  await step(
    combination,
    'create',
    process.execPath,
    [
      cli.entry,
      'skin',
      'create',
      directory,
      '--name',
      combination.name,
      '--framework',
      combination.framework,
      '--styling',
      combination.styling,
      '--base',
      combination.base,
      '--preset',
      combination.preset,
      '--package-manager',
      'pnpm',
      '--no-install',
      ...cli.args,
    ],
    projectsDir
  );
  await step(combination, 'install', 'pnpm', ['install'], directory);
  await step(combination, 'typecheck', 'pnpm', ['run', 'typecheck'], directory);
  await step(combination, 'build', 'pnpm', ['run', 'build'], directory);

  console.log(`✓ ${combination.name} (${((performance.now() - started) / 1000).toFixed(1)}s)`);
}

/** Run every check, a few at a time, and collect each failure instead of stopping at the first. */
async function checkAll(selected: readonly Combination[], cli: LocalCli): Promise<Failure[]> {
  const failures: Failure[] = [];
  const queue = [...selected];

  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      for (let combination = queue.shift(); combination; combination = queue.shift()) {
        try {
          await check(combination, cli);
        } catch (error) {
          if (!(error instanceof Failure)) throw error;

          failures.push(error);
          console.log(`✗ ${error.message}`);
        }
      }
    })
  );

  return failures;
}

function report(failure: Failure): void {
  const title = `skin create ${failure.combination.name}: ${failure.step} failed`;

  if (process.env.GITHUB_ACTIONS) {
    console.log(`::group::${title}\n${failure.output}\n::endgroup::`);
    console.log(`::error title=${title}::Run \`pnpm -F @videojs/cli check:projects ${failure.combination.name}\``);
  } else {
    console.error(`\n── ${title} ──\n${failure.output}`);
  }
}

async function main(): Promise<void> {
  const filters = process.argv.slice(2).filter((arg) => arg !== '--');
  const selected = combinations().filter(({ name }) => filters.every((filter) => name.includes(filter)));
  if (selected.length === 0) throw new Error(`No combination matches ${filters.join(' ')}.`);

  const started = performance.now();
  const cli = await prepareLocalCli();

  await mkdir(projectsDir, { recursive: true });
  console.log(`Checking ${selected.length} skin projects in ${projectsDir}, ${concurrency} at a time…`);

  const failures = await checkAll(selected, cli);
  const elapsed = `${((performance.now() - started) / 1000).toFixed(0)}s`;

  for (const failure of failures) report(failure);

  if (failures.length > 0) {
    console.error(`\n${failures.length} of ${selected.length} skin projects failed in ${elapsed}.`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${selected.length} skin projects install, typecheck, and build (${elapsed}).`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
