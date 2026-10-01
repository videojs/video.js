import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse, relative, resolve } from 'node:path';

import { isPlainObject, isString } from '@videojs/utils/predicate';

import {
  renderArgumentErrors,
  renderDiscoveryMarkdown,
  renderInstallationMarkdown,
  renderSelectionErrors,
  renderSkillsMarkdown,
  type ArgumentError,
} from './markdown';
import {
  installationInputKeyFromFlag,
  installationParameterForKey,
  type InstallationInput,
  type PackageManager,
} from './parameters';
import {
  createInstallationDiscovery,
  createInstallationPlan,
  INSTALLATION_CLI_PACKAGE,
  installationCommand,
  installationReproduceInput,
  installationSelectedOptions,
  PLAYER_PACKAGES,
  type InstallationPlan,
  type PlayerPackage,
} from './plan';
import type { InstallationFramework, InstallationTemplate } from './projects';
import {
  isPackageManager,
  resolveInstallationSelection,
  type InstallationSelectionDefaults,
  type PlayerOwner,
  type SelectionError,
} from './selection';
import {
  CLAUDE_CODE_SCOPES,
  createSkillsInstructions,
  isClaudeCodeScope,
  isSkillAgent,
  SKILL_AGENTS,
  skillsCommand,
  type SkillsSelection,
} from './skills';

export interface AgentsInitResult {
  exitCode: 0 | 1 | 2;
  stdout: string;
  stderr: string;
}

interface ParsedArguments {
  json: boolean;
  selected: boolean;
  input: InstallationInput;
}

type ParseResult = { ok: true; value: ParsedArguments } | { ok: false; json: boolean; errors: SelectionError[] };

const USAGE_HINT = 'Run `agents init` without selection flags to list every option.';

function parseArguments(args: readonly string[]): ParseResult {
  const json = args.includes('--json');
  const failure = (error: SelectionError): ParseResult => ({ ok: false, json, errors: [error] });

  if (args[0] !== 'agents' || args[1] !== 'init') {
    return failure({
      field: 'arguments',
      value: args.slice(0, 2).join(' '),
      message: 'Expected `agents init` or `agents skills`.',
      hint: USAGE_HINT,
    });
  }

  const input: InstallationInput = {};
  let selected = false;

  for (let index = 2; index < args.length; index++) {
    const argument = args[index]!;
    if (argument === '--json') continue;

    const equals = argument.indexOf('=');
    const flag = equals === -1 ? argument : argument.slice(0, equals);
    const key = installationInputKeyFromFlag(flag);

    if (!key) {
      return failure({
        field: 'arguments',
        value: argument,
        message: argument.startsWith('-') ? 'Unknown flag.' : 'Unexpected argument.',
        hint: USAGE_HINT,
      });
    }

    const value = equals === -1 ? args[++index] : argument.slice(equals + 1);

    if (value === undefined || value.startsWith('--') || (value.length === 0 && key !== 'sourceUrl')) {
      return failure({ field: key, message: 'Requires a value.' });
    }

    if (input[key] !== undefined) return failure({ field: key, value, message: 'May only be provided once.' });

    input[key] = value;
    selected = true;
  }

  return { ok: true, value: { json, selected, input } };
}

function jsonDocument<Value>(value: Value): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** The newest release whose `@videojs/cli` has no `agents init`; every later release ships it. */
export const LAST_RELEASE_WITHOUT_AGENTS_INIT = '10.0.0-rc.2';

/** Compare two `x.y.z[-prerelease]` versions by semver precedence. */
export function compareVersions(a: string, b: string): number {
  const parse = (version: string) => {
    const [core = '', prerelease] = version.split('+')[0]!.split(/-(.*)/s);

    return { core: core.split('.').map(Number), prerelease: prerelease ? prerelease.split('.') : [] };
  };
  const left = parse(a);
  const right = parse(b);

  for (let index = 0; index < 3; index++) {
    const difference = (left.core[index] ?? 0) - (right.core[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }

  // A release outranks its prereleases.
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    return Math.sign(right.prerelease.length - left.prerelease.length);
  }

  for (let index = 0; index < Math.max(left.prerelease.length, right.prerelease.length); index++) {
    const leftPart = left.prerelease[index];
    const rightPart = right.prerelease[index];
    if (leftPart === undefined || rightPart === undefined) return leftPart === undefined ? -1 : 1;

    const leftNumeric = /^\d+$/.test(leftPart);
    const rightNumeric = /^\d+$/.test(rightPart);
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;

    const difference = leftNumeric ? Number(leftPart) - Number(rightPart) : leftPart.localeCompare(rightPart);
    if (difference !== 0) return Math.sign(difference);
  }

  return 0;
}

export interface InstallationVersionNotice {
  package: PlayerPackage;
  installedVersion: string;
  /**
   * Prints the same selection from the CLI release that matches the installed player, or `null` when that release has
   * no `agents init` and upgrading is the only match.
   */
  command: string | null;
  message: string;
}

function installationVersionNotice(
  plan: InstallationPlan,
  installedVersions: AgentsInitDefaults['installedVersions']
): InstallationVersionNotice | null {
  const installedVersion = installedVersions?.[plan.selection.owner];
  if (!installedVersion || installedVersion === plan.packageVersion) return null;

  const mismatch = `These instructions target Video.js ${plan.packageVersion}, but this project has \`${plan.playerPackage}@${installedVersion}\`.`;

  if (compareVersions(installedVersion, LAST_RELEASE_WITHOUT_AGENTS_INIT) <= 0) {
    return {
      package: plan.playerPackage,
      installedVersion,
      command: null,
      message: `${mismatch} That release predates \`agents init\`, so upgrade the project's Video.js packages to ${plan.packageVersion} and follow these instructions.`,
    };
  }

  const command = installationCommand(installationReproduceInput(plan.selection), installedVersion);

  return {
    package: plan.playerPackage,
    installedVersion,
    command,
    message: `${mismatch} For instructions that match the installed version, run \`${command}\`.`,
  };
}

interface InstallationPlanJson extends Omit<InstallationPlan, 'selection'> {
  versionNotice?: InstallationVersionNotice;
  selectedOptions: Record<string, string>;
  defaultedOptions: string[];
  /** Where each detected default came from, keyed by option name. */
  defaultedOptionSources: Record<string, string>;
  /** Prints how to install the Video.js skill in a coding agent. */
  skillsCommand: string;
}

function installationPlanJson(
  plan: InstallationPlan,
  versionNotice: InstallationVersionNotice | null
): InstallationPlanJson {
  const { selection, ...document } = plan;
  const defaultedOptionSources: Record<string, string> = {};

  for (const key of selection.defaulted) {
    const source = selection.defaultSources[key];

    if (source) defaultedOptionSources[installationParameterForKey(key).query] = source;
  }

  const json: InstallationPlanJson = {
    ...document,
    selectedOptions: installationSelectedOptions(plan),
    defaultedOptions: selection.defaulted.map((key) => installationParameterForKey(key).query),
    defaultedOptionSources,
    skillsCommand: skillsCommand(),
  };

  if (versionNotice) json.versionNotice = versionNotice;

  return json;
}

function versionResult(packageVersion: string, json: boolean): AgentsInitResult {
  return {
    exitCode: 0,
    stdout: json
      ? jsonDocument({ schemaVersion: 1, kind: 'version', package: INSTALLATION_CLI_PACKAGE, packageVersion })
      : `${packageVersion}\n`,
    stderr: '',
  };
}

function argumentErrorJson(errors: readonly ArgumentError[]): AgentsInitResult {
  return {
    exitCode: 2,
    stdout: jsonDocument({ schemaVersion: 1, kind: 'error', error: 'invalid_arguments', errors }),
    stderr: '',
  };
}

function internalErrorResult(json: boolean, message: string, subject: string): AgentsInitResult {
  return {
    exitCode: 1,
    stdout: json ? jsonDocument({ schemaVersion: 1, kind: 'error', error: 'internal_error', message }) : '',
    stderr: json ? '' : `Unable to create ${subject}: ${message}\n`,
  };
}

function errorResult(json: boolean, errors: readonly SelectionError[]): AgentsInitResult {
  if (json) {
    return argumentErrorJson(
      errors.map((error) => ({
        ...error,
        field: error.field === 'arguments' ? 'arguments' : installationParameterForKey(error.field).flag,
      }))
    );
  }

  return { exitCode: 2, stdout: '', stderr: `${renderSelectionErrors(errors)}\n` };
}

/** Player package versions found in a project, keyed by the player package that owns them. */
export type InstalledPlayerVersions = Partial<Record<PlayerOwner, string>>;

export interface AgentsInitDefaults extends InstallationSelectionDefaults {
  /** Used to flag instructions generated for another release than the project's player. */
  installedVersions?: InstalledPlayerVersions;
}

/**
 * Resolve one `agents init` invocation without touching the process or file system. Project detection results arrive
 * through `defaults`, so the same arguments always produce the same output.
 */
export function runAgentsInit(
  packageVersion: string,
  args: readonly string[],
  defaults: AgentsInitDefaults = {}
): AgentsInitResult {
  try {
    const json = args.includes('--json');

    // `--version` and `--help` win over every other argument, including ones that would otherwise be rejected.
    if (args.includes('--version')) return versionResult(packageVersion, json);

    const bare = args.every((argument) => argument === '--json');
    const help = bare || args.includes('--help') || args.includes('-h');
    const parsed = help ? null : parseArguments(args);
    if (parsed && !parsed.ok) return errorResult(parsed.json, parsed.errors);

    if (!parsed || !parsed.value.selected) {
      const discovery = createInstallationDiscovery(packageVersion, defaults);

      return {
        exitCode: 0,
        stdout: json
          ? jsonDocument({ ...discovery, skillsCommand: skillsCommand() })
          : renderDiscoveryMarkdown(discovery),
        stderr: '',
      };
    }

    const resolved = resolveInstallationSelection(parsed.value.input, packageVersion, defaults);
    if (!resolved.ok) return errorResult(json, resolved.errors);

    const plan = createInstallationPlan(resolved.selection, packageVersion);
    const versionNotice = installationVersionNotice(plan, defaults.installedVersions);

    return {
      exitCode: 0,
      stdout: json
        ? jsonDocument(installationPlanJson(plan, versionNotice))
        : renderInstallationMarkdown(plan, versionNotice ? { versionNotice: versionNotice.message } : {}),
      stderr: '',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return internalErrorResult(args.includes('--json'), message, 'installation instructions');
  }
}

const SKILLS_USAGE_HINT = 'Run `agents skills --help` to list every option.';

type SkillsParseResult = { ok: true; value: SkillsSelection } | { ok: false; errors: ArgumentError[] };

function parseSkillsArguments(args: readonly string[]): SkillsParseResult {
  const failure = (error: ArgumentError): SkillsParseResult => ({ ok: false, errors: [error] });
  const selection: SkillsSelection = {};

  for (let index = 2; index < args.length; index++) {
    const argument = args[index]!;
    if (argument === '--json') continue;

    const equals = argument.indexOf('=');
    const flag = equals === -1 ? argument : argument.slice(0, equals);

    if (flag === '--global') {
      if (equals !== -1) return failure({ field: flag, message: 'Takes no value.' });

      if (selection.global) return failure({ field: flag, message: 'May only be provided once.' });

      selection.global = true;
      continue;
    }

    if (flag !== '--agent' && flag !== '--scope') {
      return failure({
        field: 'arguments',
        value: argument,
        message: argument.startsWith('-') ? 'Unknown flag.' : 'Unexpected argument.',
        hint: SKILLS_USAGE_HINT,
      });
    }

    const value = equals === -1 ? args[++index] : argument.slice(equals + 1);

    if (value === undefined || value.startsWith('--') || value.length === 0) {
      return failure({ field: flag, message: 'Requires a value.' });
    }

    if (flag === '--scope') {
      if (selection.scope) return failure({ field: flag, value, message: 'May only be provided once.' });

      if (!isClaudeCodeScope(value)) {
        return failure({ field: flag, value, message: `Expected one of: ${CLAUDE_CODE_SCOPES.join(', ')}` });
      }

      selection.scope = value;
      continue;
    }

    if (selection.agents) return failure({ field: flag, value, message: 'May only be provided once.' });

    const requested = [...new Set(value.split(',').map((agent) => agent.trim()))];
    const unknown = requested.find((agent) => !isSkillAgent(agent));

    if (unknown !== undefined) {
      return failure({
        field: flag,
        value: unknown,
        message: `Expected a comma-separated list containing ${SKILL_AGENTS.join(', ')}.`,
      });
    }

    selection.agents = requested.filter(isSkillAgent);
  }

  const agents = selection.agents ?? SKILL_AGENTS;

  if (selection.scope && !agents.includes('claude-code')) {
    return failure({
      field: '--scope',
      value: selection.scope,
      message: 'Applies only to Claude Code.',
      hint: 'Add claude-code to --agent, or omit --scope.',
    });
  }

  if (selection.global && !agents.includes('other')) {
    return failure({
      field: '--global',
      message: 'Applies only to the `skills` installer.',
      hint: 'Add other to --agent, or omit --global.',
    });
  }

  return { ok: true, value: selection };
}

/**
 * Resolve one `agents skills` invocation: how to install the Video.js skill in each selected coding agent. Like `agents
 * init`, it only prints instructions.
 */
export function runAgentsSkills(packageVersion: string, args: readonly string[]): AgentsInitResult {
  const json = args.includes('--json');

  try {
    if (args.includes('--version')) return versionResult(packageVersion, json);

    const help = args.includes('--help') || args.includes('-h');
    const parsed: SkillsParseResult = help ? { ok: true, value: {} } : parseSkillsArguments(args);

    if (!parsed.ok) {
      return json
        ? argumentErrorJson(parsed.errors)
        : { exitCode: 2, stdout: '', stderr: `${renderArgumentErrors('Invalid skill options:', parsed.errors)}\n` };
    }

    const instructions = createSkillsInstructions(packageVersion, parsed.value);

    return {
      exitCode: 0,
      stdout: json ? jsonDocument(instructions) : renderSkillsMarkdown(instructions),
      stderr: '',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return internalErrorResult(json, message, 'skill instructions');
  }
}

const CLI_COMMANDS = [
  {
    command: installationCommand(),
    description: 'List installation options, or add flags to print one complete, version-matched plan.',
  },
  { command: skillsCommand(), description: 'Print how to install the Video.js skill in your coding agent.' },
] as const;

function usageResult(packageVersion: string, json: boolean): AgentsInitResult {
  if (json) {
    return {
      exitCode: 0,
      stdout: jsonDocument({
        schemaVersion: 1,
        kind: 'usage',
        package: INSTALLATION_CLI_PACKAGE,
        packageVersion,
        commands: CLI_COMMANDS,
      }),
      stderr: '',
    };
  }

  const commands = CLI_COMMANDS.map(({ command, description }) => `- \`${command}\`: ${description}`).join('\n');

  return {
    exitCode: 0,
    stdout: `# ${INSTALLATION_CLI_PACKAGE}@${packageVersion}

Video.js instructions for coding agents and the people working with them. Every command only prints; none installs packages or changes files.

${commands}

Add \`--help\` to a command for its options, \`--json\` for a structured document, or \`--version\` to print the CLI version.
`,
    stderr: '',
  };
}

/** Print the command list for bare and top-level `--help` runs, and route `agents …` to its command. */
export function runAgentsCommand(
  packageVersion: string,
  args: readonly string[],
  defaults: AgentsInitDefaults = {}
): AgentsInitResult {
  const commandArgs = args.filter((argument) => argument !== '--json');
  const json = commandArgs.length !== args.length;

  if (commandArgs.length === 0 || (commandArgs.length === 1 && ['--help', '-h'].includes(commandArgs[0]!))) {
    return usageResult(packageVersion, json);
  }

  return args[0] === 'agents' && args[1] === 'skills'
    ? runAgentsSkills(packageVersion, args)
    : runAgentsInit(packageVersion, args, defaults);
}

/** Run the instruction-only `agents` CLI from the current directory and publish its process result. */
export function runAgentsCli(packageVersion: string, args = process.argv.slice(2)): void {
  const cwd = process.cwd();
  const defaults: AgentsInitDefaults = {
    packageManager: detectPackageManager(cwd, process.env),
    installedVersions: detectInstalledPlayerVersions(cwd),
  };
  const framework = detectFramework(cwd);

  if (framework) defaults.framework = framework;

  defaults.template = detectTemplate(cwd);

  // Packaged modules need a bundler, so a page without a package.json gets CDN scripts unless another method is asked for.
  if (defaults.template.value === 'none') defaults.method = { value: 'cdn', source: defaults.template.source };

  const result = runAgentsCommand(packageVersion, args, defaults);

  if (result.stdout) process.stdout.write(result.stdout);

  if (result.stderr) process.stderr.write(result.stderr);

  process.exitCode = result.exitCode;
}

interface PackageManagerEnvironment {
  PATH?: string;
  Path?: string;
  npm_config_user_agent?: string;
}

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies'] as const;

type DependencyField = (typeof DEPENDENCY_FIELDS)[number];

interface PackageManifest {
  packageManager: string | null;
  hasWorkspaces: boolean;
  version: string | null;
  /** Declared dependency ranges by field; entries with non-string values are dropped. */
  dependencies: Readonly<Record<DependencyField, ReadonlyMap<string, string>>>;
}

function stringEntries(value: unknown): ReadonlyMap<string, string> {
  if (!isPlainObject(value)) return new Map();

  return new Map(Object.entries(value).filter((entry): entry is [string, string] => isString(entry[1])));
}

function readPackageManifest(path: string): PackageManifest | null {
  let value: unknown;

  try {
    value = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }

  if (!isPlainObject(value)) return null;

  return {
    packageManager: isString(value.packageManager) ? value.packageManager : null,
    hasWorkspaces: value.workspaces !== undefined,
    version: isString(value.version) ? value.version : null,
    dependencies: {
      dependencies: stringEntries(value.dependencies),
      devDependencies: stringEntries(value.devDependencies),
    },
  };
}

interface ProjectManifests {
  /** The start directory followed by each ancestor up to the file system root. */
  directories: readonly string[];
  manifests: readonly (PackageManifest | null)[];
  /** Index of the outermost directory that still belongs to the project. */
  boundary: number;
}

/** Walk from `cwd` to the nearest repository or workspace root, or else to the nearest package. */
function readProjectManifests(cwd: string): ProjectManifests {
  const start = resolve(cwd);
  const root = parse(start).root;
  const directories: string[] = [];
  let directory = start;

  while (true) {
    directories.push(directory);

    if (directory === root) break;

    directory = dirname(directory);
  }

  const manifests = directories.map((candidate) => readPackageManifest(join(candidate, 'package.json')));
  const workspaceBoundary = directories.findIndex(
    (candidate, index) =>
      existsSync(join(candidate, '.git')) ||
      existsSync(join(candidate, 'pnpm-workspace.yaml')) ||
      manifests[index]?.hasWorkspaces
  );
  const nearestPackage = manifests.findIndex((manifest) => manifest !== null);
  const boundary = workspaceBoundary >= 0 ? workspaceBoundary : nearestPackage >= 0 ? nearestPackage : 0;

  return { directories, manifests, boundary };
}

function nearestProjectManifest({ manifests, boundary }: ProjectManifests): PackageManifest | null {
  return manifests.slice(0, boundary + 1).find((manifest) => manifest !== null) ?? null;
}

const FRAMEWORK_DEPENDENCIES = [
  ['react', ['react', 'react-dom', 'next', '@tanstack/react-start', 'react-router', '@videojs/react']],
  ['vue', ['vue', 'nuxt']],
  ['svelte', ['svelte', '@sveltejs/kit']],
] as const satisfies ReadonlyArray<readonly [InstallationFramework, readonly string[]]>;

/** Infer the framework from the nearest project manifest. Returns `null` when no framework dependency is present. */
export function detectFramework(cwd: string): NonNullable<InstallationSelectionDefaults['framework']> | null {
  const manifest = nearestProjectManifest(readProjectManifests(cwd));

  for (const [framework, dependencies] of FRAMEWORK_DEPENDENCIES) {
    for (const field of DEPENDENCY_FIELDS) {
      const declared = manifest?.dependencies[field];

      if (dependencies.some((dependency) => declared?.has(dependency))) {
        return { value: framework, source: `package.json ${field}` };
      }
    }
  }

  return null;
}

// Specific app setups come before Vite because Astro, React Router, and Laravel projects also depend on it.
const TEMPLATE_DEPENDENCIES = [
  ['next', ['next']],
  ['start', ['@tanstack/react-start']],
  ['react-router', ['@react-router/dev']],
  ['astro', ['astro']],
  ['nuxt', ['nuxt']],
  ['sveltekit', ['@sveltejs/kit']],
  ['laravel', ['laravel-vite-plugin']],
  ['vite', ['vite']],
] as const satisfies ReadonlyArray<readonly [InstallationTemplate, readonly string[]]>;

/**
 * Infer the app setup from the nearest project manifest, or a plain HTML page when the directory has an `index.html`
 * but no manifest. The result is `null` with a source when nothing matches, so plans can say the fallback was not
 * detected.
 */
export function detectTemplate(cwd: string): NonNullable<InstallationSelectionDefaults['template']> {
  const project = readProjectManifests(cwd);
  const manifest = nearestProjectManifest(project);

  for (const [template, dependencies] of TEMPLATE_DEPENDENCIES) {
    for (const field of DEPENDENCY_FIELDS) {
      const declared = manifest?.dependencies[field];

      if (dependencies.some((dependency) => declared?.has(dependency))) {
        return { value: template, source: `package.json ${field}` };
      }
    }
  }

  if (!manifest && existsSync(join(resolve(cwd), 'index.html'))) {
    return { value: 'none', source: 'an index.html page with no package.json' };
  }

  return { value: null, source: 'no app setup detected' };
}

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?(?:\+[0-9a-z.-]+)?$/i;

/**
 * Find the `@videojs/react` and `@videojs/html` versions a project uses: the installed package when Node would resolve
 * one from `cwd`, otherwise an exact version declared in the nearest project manifest. Ranges are ignored because they
 * do not identify one release.
 */
export function detectInstalledPlayerVersions(cwd: string): InstalledPlayerVersions {
  const project = readProjectManifests(cwd);
  const manifest = nearestProjectManifest(project);
  const versions: InstalledPlayerVersions = {};

  for (const owner of ['react', 'html'] as const) {
    const packageName = PLAYER_PACKAGES[owner];
    const installed = project.directories
      .map((directory) => readPackageManifest(join(directory, 'node_modules', packageName, 'package.json'))?.version)
      .find(isString);
    const declared = DEPENDENCY_FIELDS.map((field) => manifest?.dependencies[field].get(packageName)).find(
      (version) => isString(version) && EXACT_VERSION.test(version)
    );
    const version = installed ?? declared;

    if (version) versions[owner] = version;
  }

  return versions;
}

function packageManagerFromManifest(manifest: PackageManifest | null): PackageManager | null {
  const name = manifest?.packageManager?.split('@')[0] ?? '';

  return isPackageManager(name) ? name : null;
}

function executableExists(name: string, environment: PackageManagerEnvironment): boolean {
  const path = environment.PATH ?? environment.Path ?? '';
  const extensions = process.platform === 'win32' ? ['', '.cmd', '.exe'] : [''];

  return path.split(process.platform === 'win32' ? ';' : ':').some((directory) =>
    extensions.some((extension) => {
      try {
        accessSync(join(directory, `${name}${extension}`), constants.X_OK);
        return true;
      } catch {
        return false;
      }
    })
  );
}

const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
] as const satisfies ReadonlyArray<readonly [string, PackageManager]>;

/**
 * Match an existing workspace first, then prefer pnpm for a new project when it is available. npm's user agent is
 * ignored because `npx` runs this CLI for every package manager, so it says nothing about the project's preference.
 */
export function detectPackageManager(
  cwd: string,
  environment: PackageManagerEnvironment = process.env
): NonNullable<InstallationSelectionDefaults['packageManager']> {
  const start = resolve(cwd);
  const { directories, manifests, boundary } = readProjectManifests(cwd);
  const displayPath = (directory: string, filename: string) => relative(start, join(directory, filename));

  for (let index = 0; index <= boundary; index++) {
    const directory = directories[index]!;
    const fromManifest = packageManagerFromManifest(manifests[index] ?? null);

    if (fromManifest) {
      return { value: fromManifest, source: `the ${displayPath(directory, 'package.json')} packageManager field` };
    }

    const lockfiles = LOCKFILES.filter(([filename]) => existsSync(join(directory, filename)));
    const [winner] = lockfiles;
    if (!winner) continue;

    const [lockfile, value] = winner;
    const conflicts = lockfiles
      .filter(([, manager]) => manager !== value)
      .map(([filename]) => displayPath(directory, filename));
    const conflict =
      conflicts.length > 0
        ? `; ${conflicts.join(' and ')} also found, and ${displayPath(directory, lockfile)} takes precedence`
        : '';

    return { value, source: `${displayPath(directory, lockfile)}${conflict}` };
  }

  const fromUserAgent = environment.npm_config_user_agent?.split('/')[0] ?? '';

  if (fromUserAgent !== 'npm' && isPackageManager(fromUserAgent)) {
    return {
      value: fromUserAgent,
      source: `the ${fromUserAgent} invocation (npm_config_user_agent); no lockfile or packageManager field found`,
    };
  }

  return executableExists('pnpm', environment)
    ? { value: 'pnpm', source: 'the pnpm executable on PATH; no lockfile or packageManager field found' }
    : { value: 'npm', source: 'the npm fallback; no lockfile, packageManager field, or pnpm on PATH found' };
}
