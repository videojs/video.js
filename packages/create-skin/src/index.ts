import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

import * as prompts from '@clack/prompts';
import { registryStylings, type RegistryPreset, type RegistryStyling } from '@videojs/installation';

import packageJson from '../package.json' with { type: 'json' };
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

/** Stopping at a prompt is a choice, not a failure, so it exits cleanly. */
function cancelled(): never {
  prompts.cancel('No skin created.');
  process.exit(0);
}

function answer<Value>(value: Value | symbol): Value {
  if (prompts.isCancel(value)) cancelled();

  return value;
}

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
async function promptForOptions(flags: SkinFlags): Promise<SkinOptions> {
  const defaults = resolveDefaults(flags);

  const name =
    flags.name?.trim() ||
    answer(
      await prompts.text({
        message: 'What is your skin called?',
        placeholder: 'Neon Glow',
        validate: validateName,
      })
    ).trim();

  const directory = expandHome(
    flags.directory ??
      answer(
        await prompts.text({
          message: `Where should it go? (relative to ${process.cwd()})`,
          initialValue: `./${slugify(name)}`,
          validate: validateDirectory,
        })
      ).trim()
  );

  const framework =
    flags.framework ??
    answer(
      await prompts.select({
        message: 'Which framework?',
        options: FRAMEWORKS.map((value) => ({ value, label: FRAMEWORK_LABELS[value] })),
        initialValue: defaults.framework,
      })
    );

  const stylings = registryStylings(framework);
  const styling: RegistryStyling =
    flags.styling ??
    (stylings.length === 1
      ? stylings[0]!
      : answer(
          await prompts.select({
            message: 'How do you want to style it?',
            options: stylings.map((value) => ({ value, label: STYLING_LABELS[value] })),
            initialValue: stylings[0]!,
          })
        ));

  const base: BaseSkin =
    flags.base ??
    answer(
      await prompts.select({
        message: 'Which skin do you want to start from?',
        options: BASE_SKINS.map((value) => ({ value, ...BASE_SKIN_LABELS[value] })),
        initialValue: defaults.base,
      })
    );

  const preset: RegistryPreset =
    flags.preset ??
    answer(
      await prompts.select({
        message: 'Which player preset?',
        options: PRESETS.map((value) => ({ value, label: PRESET_LABELS[value] })),
        initialValue: defaults.preset,
      })
    );

  const install =
    flags.install ??
    answer(
      await prompts.confirm({ message: `Install dependencies with ${defaults.packageManager}?`, initialValue: true })
    );

  return { ...defaults, directory, name, framework, styling, base, preset, install };
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

async function main(argv: readonly string[]): Promise<void> {
  const flags = parseFlags(argv);

  if (flags.help) {
    process.stdout.write(HELP);
    return;
  }

  if (flags.version) {
    process.stdout.write(`${packageJson.version}\n`);
    return;
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

  if (interactive) prompts.intro(`Create a Video.js skin (v${packageJson.version})`);

  const options = interactive ? await promptForOptions(flags) : resolveDefaults(flags);
  const root = resolve(options.directory);
  if (!isEmptyDirectory(root)) throw new UsageError(`${root} is not empty. Choose a new or empty directory.`);

  const spinner = interactive ? prompts.spinner() : undefined;

  spinner?.start('Copying the skin');

  const project = await createProject(options, slugify(options.name));

  for (const [path, source] of project.files) {
    const target = resolve(root, path);

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, source);
  }

  spinner?.stop(`Created ${project.files.size} files in ${relative(process.cwd(), root) || '.'}`);

  if (options.install) {
    if (interactive) prompts.log.step(`Installing dependencies with ${options.packageManager}`);

    await run(options.packageManager, ['install'], root);
  }

  const relativeRoot = relative(process.cwd(), root);
  // A project outside the current directory reads better as an absolute path than a run of `../`.
  const cd = relativeRoot.startsWith('..') ? root : relativeRoot;
  const steps = [
    cd && `cd ${cd.includes(' ') ? JSON.stringify(cd) : cd}`,
    !options.install && `${options.packageManager} install`,
    `${options.packageManager === 'npm' ? 'npm run' : options.packageManager} dev`,
  ].filter(Boolean);
  const next = steps.map((step) => `  ${step}`).join('\n');
  const again = `To create the same skin without questions:\n\n  ${reproduceCommand(options)}`;
  const summary = `Edit your skin in ${project.skinDirectory}. Next:\n\n${next}\n\n${again}`;

  if (interactive) prompts.outro(summary);
  else process.stdout.write(`${summary}\n`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  process.stderr.write(
    error instanceof UsageError ? `${message.trimEnd()}\nRun with --help to see every option.\n` : `${message}\n`
  );

  process.exit(1);
});
