import { homedir } from 'node:os';
import { parseArgs } from 'node:util';

import {
  PACKAGE_MANAGERS,
  REGISTRY_ORIGIN,
  REGISTRY_PRESETS,
  registryStylings,
  type PackageManager,
  type RegistryFramework,
  type RegistryPreset,
  type RegistryStyling,
  type RegistryTheme,
} from '@videojs/installation';

/** The packaged skin a new skin starts from, copied from the registry. */
export type BaseSkin = RegistryTheme;

export const FRAMEWORKS = ['react', 'html'] as const satisfies readonly RegistryFramework[];
export const BASE_SKINS = ['scaffold', 'default', 'neutral', 'compat'] as const satisfies readonly BaseSkin[];
export const PRESETS = REGISTRY_PRESETS.map(({ preset }) => preset);

export const FRAMEWORK_LABELS = { react: 'React', html: 'HTML' } as const satisfies Record<RegistryFramework, string>;
export const STYLING_LABELS = { tailwind: 'Tailwind CSS', css: 'CSS' } as const satisfies Record<
  RegistryStyling,
  string
>;

export const BASE_SKIN_LABELS = {
  scaffold: { label: 'Scaffold', hint: 'every control wired up, minimal styling' },
  default: { label: 'Default', hint: 'the packaged Video.js skin' },
  neutral: { label: 'Neutral', hint: 'the packaged skin without brand color' },
  compat: { label: 'Compat', hint: 'the packaged skin for older browsers' },
} as const satisfies Record<BaseSkin, { label: string; hint: string }>;

// SAFETY: built from every registry preset, so each `RegistryPreset` key is present.
export const PRESET_LABELS = Object.fromEntries(REGISTRY_PRESETS.map(({ preset, label }) => [preset, label])) as Record<
  RegistryPreset,
  string
>;

export interface SkinOptions {
  directory: string;
  name: string;
  framework: RegistryFramework;
  styling: RegistryStyling;
  base: BaseSkin;
  preset: RegistryPreset;
  packageManager: PackageManager;
  install: boolean;
  /** Registry origin, or a local directory that mirrors its `r/` tree. */
  registry: string;
  /** Package specifiers that replace registry pins, such as `@videojs/react` → `file:…/videojs-react.tgz`. */
  overrides: Readonly<Record<string, string>>;
}

/** Flags as typed: anything missing is prompted for, or defaulted under `--yes`. */
export interface SkinFlags {
  directory?: string | undefined;
  name?: string | undefined;
  framework?: RegistryFramework | undefined;
  styling?: RegistryStyling | undefined;
  base?: BaseSkin | undefined;
  preset?: RegistryPreset | undefined;
  packageManager?: PackageManager | undefined;
  install?: boolean | undefined;
  yes: boolean;
  help: boolean;
  version: boolean;
  registry: string;
  overrides: Readonly<Record<string, string>>;
}

export class UsageError extends Error {}

function oneOf<const Values extends readonly string[]>(
  flag: string,
  values: Values,
  value: string | undefined
): Values[number] | undefined {
  if (value === undefined) return undefined;

  if (values.includes(value)) return value;

  throw new UsageError(`--${flag} must be one of ${values.join(', ')}; received "${value}".`);
}

function parseOverrides(values: readonly string[]): Record<string, string> {
  const overrides: Record<string, string> = {};

  for (const value of values) {
    // Split on the first `=` after the package name, so scoped names and `file:` paths with `=` stay intact.
    const separator = value.indexOf('=', value.startsWith('@') ? value.indexOf('/') : 0);
    if (separator <= 0) throw new UsageError(`--override expects name=specifier; received "${value}".`);

    overrides[value.slice(0, separator)] = value.slice(separator + 1);
  }

  return overrides;
}

export function parseFlags(argv: readonly string[]): SkinFlags {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: {
      name: { type: 'string' },
      framework: { type: 'string' },
      styling: { type: 'string' },
      base: { type: 'string' },
      preset: { type: 'string' },
      'package-manager': { type: 'string' },
      install: { type: 'boolean' },
      'no-install': { type: 'boolean' },
      yes: { type: 'boolean', short: 'y', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
      registry: { type: 'string', default: REGISTRY_ORIGIN },
      override: { type: 'string', multiple: true, default: [] },
    },
  });
  if (positionals.length > 1) throw new UsageError(`Expected one directory; received ${positionals.join(', ')}.`);

  const framework = oneOf('framework', FRAMEWORKS, values.framework);
  const styling = oneOf('styling', ['tailwind', 'css'] as const, values.styling);

  if (framework && styling && !registryStylings(framework).includes(styling)) {
    throw new UsageError(
      `${FRAMEWORK_LABELS[framework]} skins support ${registryStylings(framework).join(', ')} styling only.`
    );
  }

  return {
    directory: positionals[0] === undefined ? undefined : expandHome(positionals[0]),
    name: values.name,
    framework,
    styling,
    base: oneOf('base', BASE_SKINS, values.base),
    preset: oneOf('preset', PRESETS, values.preset),
    packageManager: oneOf('package-manager', PACKAGE_MANAGERS, values['package-manager']),
    install: values['no-install'] ? false : values.install,
    yes: values.yes,
    help: values.help,
    version: values.version,
    registry: values.registry,
    overrides: parseOverrides(values.override),
  };
}

/** The package manager that launched `npm create`, `pnpm create`, `yarn create`, or `bun create`. */
export function detectPackageManager(userAgent = process.env.npm_config_user_agent): PackageManager {
  const name = userAgent?.split('/')[0];

  return PACKAGE_MANAGERS.find((manager) => manager === name) ?? 'npm';
}

/**
 * Expand a leading `~` to the home directory. A shell does this for arguments, but not for text typed at a prompt or
 * quoted, which would otherwise create a folder named `~`.
 */
export function expandHome(path: string): string {
  return path === '~' || path.startsWith('~/') || path.startsWith('~\\') ? homedir() + path.slice(1) : path;
}

/** The npm-safe slug for a skin name or directory: `Neon Glow!` → `neon-glow`. */
export function slugify(value: string): string {
  const base = value.split(/[\\/]/).filter(Boolean).at(-1) ?? '';

  return base
    .toLowerCase()
    .replace(/[^a-z0-9-~]+/g, '-')
    .replace(/^[-.~]+|-+$/g, '');
}

/** Every skin needs a name the user chose; it titles the workbench and names the package. */
export function validateName(name: string | undefined): string | undefined {
  if (!name?.trim()) return 'Give the skin a name.';

  if (!slugify(name)) return 'Use at least one letter or number in the name.';

  return undefined;
}

/**
 * Fill every flag the user skipped with the default, as `--yes` and non-interactive runs do. The name has no default,
 * so callers check it with `validateName` first; the directory follows from it.
 */
export function resolveDefaults(flags: SkinFlags): SkinOptions {
  const name = flags.name?.trim() ?? '';
  const framework = flags.framework ?? 'react';

  return {
    directory: flags.directory ?? slugify(name),
    name,
    framework,
    styling: flags.styling ?? registryStylings(framework)[0]!,
    base: flags.base ?? 'scaffold',
    preset: flags.preset ?? 'video',
    packageManager: flags.packageManager ?? detectPackageManager(),
    install: flags.install ?? true,
    registry: flags.registry,
    overrides: flags.overrides,
  };
}

/** A choice the command asks about, and the flag that answers it. */
export interface MissingChoice {
  flag: string;
  /** What `--yes` would use; a choice without one must always be passed. */
  default?: string;
}

/**
 * The choices a non-interactive run would otherwise fill silently. The directory follows from the name, and the install
 * step and package manager from the environment, so only the choices that shape the skin count.
 */
export function missingChoices(flags: SkinFlags): MissingChoice[] {
  const defaults = resolveDefaults(flags);
  const missing: MissingChoice[] = [];

  if (validateName(flags.name)) missing.push({ flag: '--name' });

  if (flags.framework === undefined) missing.push({ flag: '--framework', default: defaults.framework });

  if (flags.styling === undefined && registryStylings(defaults.framework).length > 1) {
    missing.push({ flag: '--styling', default: defaults.styling });
  }

  if (flags.base === undefined) missing.push({ flag: '--base', default: defaults.base });

  if (flags.preset === undefined) missing.push({ flag: '--preset', default: defaults.preset });

  return missing;
}

const CREATE_COMMANDS = {
  npm: 'npm create @videojs/skin@latest',
  pnpm: 'pnpm create @videojs/skin',
  yarn: 'yarn create @videojs/skin',
  bun: 'bun create @videojs/skin',
} as const satisfies Record<PackageManager, string>;

function quote(value: string): string {
  return /^[\w@%+=:,./-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`;
}

/**
 * The command that creates the same skin without asking anything, for sharing a setup or putting it in docs. npm needs
 * `--` before flags meant for the package; the other package managers pass them through.
 */
export function reproduceCommand(options: SkinOptions): string {
  const args = [
    options.directory,
    '--name',
    options.name,
    '--framework',
    options.framework,
    '--styling',
    options.styling,
    '--base',
    options.base,
    '--preset',
    options.preset,
  ];

  if (!options.install) args.push('--no-install');

  const [directory, ...flags] = args.map((arg) => quote(arg));
  const separator = options.packageManager === 'npm' ? ['--'] : [];

  return [CREATE_COMMANDS[options.packageManager], directory, ...separator, ...flags].join(' ');
}

export const HELP = `Create a local workbench for building your own Video.js skin.

Usage:
  npm create @videojs/skin [directory] --name <name> [options]

Options:
  --name <name>                 Name of the skin (required)
  [directory]                   Where to create it (default: the name as a folder in the current directory)
  --framework <react|html>      Framework the skin is written for (default: react)
  --styling <tailwind|css>      How the skin is styled; HTML skins use CSS (default: tailwind for React)
  --base <skin>                 Skin to start from: ${BASE_SKINS.join(', ')} (default: scaffold)
  --preset <preset>             Player preset: ${PRESETS.join(', ')} (default: video)
  --package-manager <name>      ${PACKAGE_MANAGERS.join(', ')} (default: the one running this command)
  --no-install                  Skip installing dependencies
  -y, --yes                     Use defaults for every option you did not pass, except --name
  -h, --help                    Show this help
  -v, --version                 Show the version

Advanced:
  --registry <url|path>         Skin registry origin, or a local registry build (default: ${REGISTRY_ORIGIN})
  --override <name=specifier>   Replace a package version, such as a local tarball; repeatable
`;
