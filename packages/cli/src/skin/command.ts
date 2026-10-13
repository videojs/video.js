import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

import { REGISTRY_ORIGIN, registryStylings, type RegistryPreset, type RegistryStyling } from '@videojs/installation';

import packageJson from '../../package.json' with { type: 'json' };
import {
  BASE_SKIN_LABELS,
  BASE_SKINS,
  expandHome,
  FRAMEWORK_LABELS,
  FRAMEWORKS,
  HELP,
  missingChoices,
  parseFlags,
  PRESET_LABELS,
  PRESETS,
  reproduceCommand,
  resolveDefaults,
  slugify,
  STYLING_LABELS,
  UsageError,
  validateName,
  type BaseSkin,
  type SkinFlags,
  type SkinOptions,
} from './options';
import { createProject } from './project';
import { Prompter, PromptCancelled } from './prompt';

function isEmptyDirectory(path: string): boolean {
  if (!existsSync(path)) return true;

  return readdirSync(path).every((entry) => entry === '.git' || entry === '.DS_Store');
}

/** A directory the skin can go in, relative to where the command runs. */
function validateDirectory(directory: string | undefined): string | undefined {
  if (!directory?.trim()) return 'Choose a directory.';

  const target = resolve(expandHome(directory.trim()));
  if (!isEmptyDirectory(target)) return `${target} is not empty.`;

  return undefined;
}

/** Ask for each option the flags left out. */
async function promptForOptions(prompter: Prompter, flags: SkinFlags): Promise<SkinOptions> {
  const defaults = resolveDefaults(flags);

  const nameProblem = validateName(flags.name);

  // A `--name` that can't name a package is asked for again, rather than slugged to nothing.
  if (flags.name !== undefined && nameProblem) process.stdout.write(`--name: ${nameProblem}\n`);

  const name = nameProblem
    ? await prompter.text('What is your skin called?', { validate: validateName })
    : flags.name!.trim();

  const directory = expandHome(
    flags.directory ??
      (await prompter.text(`Where should it go? (relative to ${process.cwd()})`, {
        initial: `./${slugify(name)}`,
        validate: validateDirectory,
      }))
  );

  const framework =
    flags.framework ??
    (await prompter.select(
      'Which framework?',
      FRAMEWORKS.map((value) => ({ value, label: FRAMEWORK_LABELS[value] })),
      defaults.framework
    ));

  const stylings = registryStylings(framework);
  const styling: RegistryStyling =
    flags.styling ??
    (stylings.length === 1
      ? stylings[0]!
      : await prompter.select(
          'How do you want to style it?',
          stylings.map((value) => ({ value, label: STYLING_LABELS[value] })),
          stylings[0]!
        ));

  const base: BaseSkin =
    flags.base ??
    (await prompter.select(
      'Which skin do you want to start from?',
      BASE_SKINS.map((value) => ({ value, ...BASE_SKIN_LABELS[value] })),
      defaults.base
    ));

  const preset: RegistryPreset =
    flags.preset ??
    (await prompter.select(
      'Which player preset?',
      PRESETS.map((value) => ({ value, label: PRESET_LABELS[value] })),
      defaults.preset
    ));

  const install =
    flags.install ?? (await prompter.confirm(`Install dependencies with ${defaults.packageManager}?`, true));

  return { ...defaults, directory, name, framework, styling, base, preset, install };
}

/** A path relative to where the command runs; outside it, absolute reads better than a run of `../`. */
function displayPath(path: string): string {
  const relativePath = relative(process.cwd(), path);

  return relativePath.startsWith('..') ? path : relativePath || '.';
}

function run(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });

    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`\`${command} ${args.join(' ')}\` exited with ${code}.`))
    );
  });
}

async function createSkin(argv: readonly string[]): Promise<number> {
  const flags = parseFlags(argv);

  if (flags.help) {
    process.stdout.write(HELP);
    return 0;
  }

  if (flags.version) {
    process.stdout.write(`${packageJson.version}\n`);
    return 0;
  }

  // Check a directory given up front before asking anything, rather than after every question.
  if (flags.directory !== undefined) {
    const problem = validateDirectory(flags.directory);
    if (problem) throw new UsageError(`${problem} Choose a new or empty directory.`);
  }

  const interactive = !flags.yes && process.stdin.isTTY && process.stdout.isTTY;

  if (!interactive) {
    // Without prompts, say what is missing instead of quietly choosing for a script or coding agent. `--yes` accepts
    // every default, but the name has none.
    const missing = missingChoices(flags).filter((choice) => !flags.yes || choice.default === undefined);

    if (missing.length > 0) {
      const choices = missing
        .map(
          (choice) => `  ${choice.flag} ${choice.default === undefined ? '(required)' : `(default: ${choice.default})`}`
        )
        .join('\n');
      const reason = flags.yes ? '--yes accepts every default, but these have none' : 'No terminal to ask in';
      const example = reproduceCommand(resolveDefaults({ ...flags, name: flags.name || 'Neon Glow' }));

      throw new UsageError(
        `${reason}, so pass these choices${flags.yes ? '' : ', or --yes to accept their defaults'}:\n\n${choices}\n\nFor example: ${example}\n`
      );
    }
  }

  let options: SkinOptions;

  if (interactive) {
    process.stdout.write(`Create a Video.js skin (v${packageJson.version})\n\n`);

    const prompter = new Prompter();

    try {
      options = await promptForOptions(prompter, flags);
    } finally {
      prompter.close();
    }

    process.stdout.write('\n');
  } else {
    options = resolveDefaults(flags);
  }

  const root = resolve(options.directory);
  if (!isEmptyDirectory(root)) throw new UsageError(`${root} is not empty. Choose a new or empty directory.`);

  process.stdout.write('Copying the skin and its workbench…\n');

  const project = await createProject(options, slugify(options.name));

  for (const [path, source] of project.files) {
    const target = resolve(root, path);

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, source);
  }

  process.stdout.write(`Created ${project.files.size} files in ${displayPath(root)}\n`);

  // The registry isn't versioned yet, so an older CLI copies the latest skin source into its own templates.
  if (
    options.registry === REGISTRY_ORIGIN &&
    project.registryVersion &&
    project.registryVersion !== packageJson.version
  ) {
    process.stderr.write(
      `\nWarning: the skin registry is at Video.js ${project.registryVersion}, but this CLI is ${packageJson.version}. ` +
        'The workbench may not match the skin; run `@videojs/cli@latest` for a matching pair.\n'
    );
  }

  let installFailed = false;

  if (options.install) {
    process.stdout.write(`\nInstalling dependencies with ${options.packageManager}…\n`);

    try {
      await run(options.packageManager, ['install'], root);
    } catch (error) {
      // The project is written; finish with the usual next steps so the user can install it themselves.
      const message = error instanceof Error ? error.message : String(error);

      process.stderr.write(`\nThe install failed: ${message} Run it yourself from the project.\n`);
      installFailed = true;
    }
  }

  const cd = displayPath(root);
  const steps = [
    cd !== '.' && `cd ${cd.includes(' ') ? JSON.stringify(cd) : cd}`,
    (!options.install || installFailed) && `${options.packageManager} install`,
    `${options.packageManager === 'npm' ? 'npm run' : options.packageManager} dev`,
  ].filter(Boolean);
  const next = steps.map((step) => `  ${step}`).join('\n');
  const again = `To create the same skin without questions:\n\n  ${reproduceCommand(options)}`;
  // `pnpm deploy` is a built-in command, so the script always goes through `run`.
  const publish = `When it's ready to share, publish it with \`${options.packageManager} run deploy\`.`;
  const summary = `Edit your skin in ${project.skinDirectory}. Next:\n\n${next}\n\n${publish}\n\n${again}`;

  process.stdout.write(`\n${summary}\n`);

  return installFailed ? 1 : 0;
}

/**
 * `videojs skin create`: create a local skin project. Resolves with the process exit code; a cancelled prompt is a
 * choice rather than a failure, so it exits cleanly.
 */
export async function runSkinCommand(argv: readonly string[]): Promise<number> {
  try {
    return await createSkin(argv);
  } catch (error) {
    if (error instanceof PromptCancelled) {
      process.stdout.write('\nNo skin created.\n');
      return 0;
    }

    const message = error instanceof Error ? error.message : String(error);

    process.stderr.write(
      error instanceof UsageError ? `${message.trimEnd()}\nRun with --help to see every option.\n` : `${message}\n`
    );

    return 1;
  }
}
