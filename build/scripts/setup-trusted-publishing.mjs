/**
 * Configures npm trusted publishing (OIDC) for every public package that `.github/workflows/cd.yml` publishes.
 *
 * Usage: `pnpm release:trust [--dry-run] [--force] [package-name...]`
 *
 * The registry only accepts a trusted publisher for a package that already exists, so a package that has never been
 * published first gets a deprecated placeholder release; the next CD run publishes the real version (with provenance)
 * over `latest`. An existing configuration that doesn't match this repository's workflow is revoked and replaced,
 * because the registry allows only one per package. `--force` also replaces configurations that look correct, for when
 * the registry rejects one anyway.
 *
 * Requires `npm login` with an account that has 2FA and write access to the packages. Reading and writing trust
 * configurations both ask for 2FA; choose "skip two-factor authentication for the next 5 minutes" on the npm website to
 * get through the batch.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs, styleText } from 'node:util';

const REPOSITORY = 'videojs/video.js';
const WORKFLOW = 'cd.yml';
const ENVIRONMENT = 'production';
const REGISTRY = 'https://registry.npmjs.org';
const PLACEHOLDER_VERSION = '0.0.0-placeholder';
const PLACEHOLDER_TAG = 'placeholder';
// npm recommends pausing between trust writes to avoid rate limiting.
const WRITE_DELAY_MS = 2000;

const root = resolve(import.meta.dirname, '../..');

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'dry-run': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },

    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (flags.help) {
  console.log('Usage: pnpm release:trust [--dry-run] [--force] [package-name...]');
  process.exit(0);
}

const dryRun = flags['dry-run'];
const RESULTS = dryRun
  ? {
      ok: 'already configured',
      add: 'would add',
      replace: 'would replace',
      placeholder: 'would publish placeholder + add',
    }
  : { ok: 'already configured', add: 'added', replace: 'replaced', placeholder: 'published placeholder + added' };
const npmCommand = resolveNpmCommand();

function resolveNpmCommand() {
  const [major, minor] = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim().split('.').map(Number);
  if (major > 11 || (major === 11 && minor >= 15)) return ['npm'];

  // `npm trust` shipped in npm 11.15.
  return ['npx', '--yes', 'npm@11'];
}

/**
 * The current package's progress line stays open until its result is known. Anything else written meanwhile (2FA
 * prompts, npm output) first ends the line, and the result line is then reprinted in full.
 */
const progress = { label: '', open: false, interrupted: false };

function startProgress(label) {
  process.stdout.write(label);
  Object.assign(progress, { label, open: true, interrupted: false });
}

function breakProgress() {
  if (!progress.open) return;

  process.stdout.write('\n');
  Object.assign(progress, { open: false, interrupted: true });
}

function endProgress(result) {
  process.stdout.write(`${progress.interrupted ? progress.label : ''}${result}\n`);
  progress.open = false;
}

function log(text = '') {
  breakProgress();
  console.log(text);
}

/** Runs npm with the terminal attached so 2FA prompts and web-auth links reach the user. */
function npm(args, { cwd = tmpdir() } = {}) {
  const [command, ...prefix] = npmCommand;

  breakProgress();

  const result = spawnSync(command, [...prefix, ...args], { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`npm ${args.join(' ')} exited with ${result.status}`);
}

function npmCapture(args) {
  const [command, ...prefix] = npmCommand;

  return spawnSync(command, [...prefix, ...args], {
    cwd: tmpdir(),
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
}

/**
 * Runs a read-only npm command and returns stdout. npm only prompts for 2FA when stdout is a terminal, so a captured
 * run fails with EOTP instead; authenticate through an interactive run of the same command, then read again.
 */
function npmRead(args) {
  let result = npmCapture(args);

  if (result.status !== 0 && /\bEOTP\b/.test(result.stderr)) {
    log(
      styleText(
        'cyan',
        '  npm needs 2FA. Tick "skip two-factor authentication for the next 5 minutes" to approve the rest.'
      )
    );
    npm(args.filter((arg) => arg !== '--json'));
    result = npmCapture(args);
  }

  if (result.status !== 0) throw new Error(`npm ${args[0]} ${args[1] ?? ''}: ${npmErrorReason(result.stderr)}`);

  return result.stdout;
}

/** Reduces npm's stderr to `CODE: first message`, dropping notices and the debug-log pointer. */
function npmErrorReason(stderr) {
  const lines = stderr
    .split('\n')
    .filter((line) => line.startsWith('npm error '))
    .map((line) => line.slice('npm error '.length).trim())
    .filter((line) => line && !line.startsWith('A complete log'));
  const code = lines.find((line) => line.startsWith('code '))?.slice('code '.length);
  const message = lines.find((line) => !line.startsWith('code '));

  return [code, message].filter(Boolean).join(': ') || stderr.trim().split('\n').at(-1) || 'unknown error';
}

/** Lists the packages `pnpm -r publish --filter "./packages/**"` publishes in cd.yml. */
function listPublicPackages() {
  const output = execFileSync('pnpm', ['ls', '-r', '--depth', '-1', '--json', '--filter', './packages/**'], {
    cwd: root,
    encoding: 'utf8',
  });

  return JSON.parse(output)
    .filter((pkg) => !pkg.private)
    .map((pkg) => pkg.name)
    .sort();
}

async function existsOnRegistry(name) {
  const response = await fetch(`${REGISTRY}/${name.replace('/', '%2f')}`, {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
  });
  if (response.status === 404) return false;

  if (!response.ok) throw new Error(`Registry lookup for ${name} failed with ${response.status}`);

  return true;
}

async function waitForRegistry(name) {
  for (let attempt = 0; attempt < 15; attempt++) {
    if (await existsOnRegistry(name)) return;

    await sleep(2000);
  }

  throw new Error(`${name} still isn't visible on the registry after publishing the placeholder`);
}

function publishPlaceholder(name) {
  const dir = mkdtempSync(join(tmpdir(), 'videojs-placeholder-'));

  try {
    const manifest = {
      name,
      version: PLACEHOLDER_VERSION,
      description: 'Placeholder that reserves this name for Video.js trusted publishing. Install a 10.x release.',
      license: 'Apache-2.0',
      repository: { type: 'git', url: `https://github.com/${REPOSITORY}` },
    };

    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(join(dir, 'README.md'), `# ${name}\n\n${manifest.description}\n`);
    npm(['publish', '--access', 'public', '--tag', PLACEHOLDER_TAG], { cwd: dir });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** `npm trust list --json` prints each configuration as a pretty-printed object followed by a blank line. */
function listTrustConfigs(name) {
  return npmRead(['trust', 'list', name, '--json'])
    .split(/\n\s*\n/)
    .filter((chunk) => chunk.trim())
    .map((chunk) => JSON.parse(chunk));
}

function isExpectedConfig(config) {
  return (
    config.type === 'github' &&
    config.repository === REPOSITORY &&
    config.file === WORKFLOW &&
    config.environment === ENVIRONMENT &&
    Array.isArray(config.permissions) &&
    config.permissions.includes('createPackage')
  );
}

const PERMISSION_LABELS = { createPackage: 'publish', createStagedPackage: 'stage publish' };

/** Summarizes a configuration as `repo · file · environment · permissions`, prefixed by its provider unless GitHub. */
function describeConfig(config) {
  const permissions = config.permissions?.map((p) => PERMISSION_LABELS[p] ?? p).join(' + ') || 'no permissions';
  const parts = [
    config.type === 'github' ? null : config.type,
    config.repository ?? 'unknown repo',
    config.file ?? 'unknown workflow',
    config.environment ?? 'any environment',
    permissions,
  ];

  return parts.filter(Boolean).join(' · ');
}

/**
 * Resolves to `{ previous, kind, result }`: `previous` describes the trusted publishers found before any change, and
 * `kind` is `ok` (nothing to do) or `change`.
 */
async function setupPackage(name) {
  let placeholder = false;

  if (!(await existsOnRegistry(name))) {
    if (dryRun) return { previous: [], kind: 'change', result: RESULTS.placeholder };

    publishPlaceholder(name);
    await waitForRegistry(name);
    npm(['deprecate', `${name}@${PLACEHOLDER_VERSION}`, 'Placeholder release. Install a 10.x release instead.']);
    placeholder = true;
  }

  const configs = listTrustConfigs(name);
  const previous = configs.map(describeConfig);

  if (configs.length === 1 && isExpectedConfig(configs[0]) && !flags.force) {
    return { previous, kind: 'ok', result: RESULTS.ok };
  }

  const result = placeholder ? RESULTS.placeholder : configs.length ? RESULTS.replace : RESULTS.add;

  if (dryRun) return { previous, kind: 'change', result };

  for (const config of configs) {
    npm(['trust', 'revoke', name, '--id', config.id]);
    await sleep(WRITE_DELAY_MS);
  }

  npm([
    'trust',
    'github',
    name,
    '--repository',
    REPOSITORY,
    '--file',
    WORKFLOW,
    '--environment',
    ENVIRONMENT,
    '--allow-publish',
    '--yes',
  ]);
  await sleep(WRITE_DELAY_MS);

  return { previous, kind: 'change', result };
}

const KIND_STYLES = { ok: 'green', change: 'yellow', failed: 'red' };

function printTotals(rows) {
  const counts = new Map();

  for (const { result, kind } of rows) counts.set(result, { kind, count: (counts.get(result)?.count ?? 0) + 1 });

  const parts = [...counts].map(([result, { kind, count }]) => styleText(KIND_STYLES[kind], `${count} ${result}`));

  console.log(`\n  ${styleText('bold', `${rows.length} packages`)}  ${parts.join(styleText('dim', ' · '))}`);
}

async function main() {
  const publicPackages = listPublicPackages();
  const unknown = positionals.filter((name) => !publicPackages.includes(name));
  if (unknown.length) throw new Error(`Not a public workspace package: ${unknown.join(', ')}`);

  const packages = positionals.length ? positionals : publicPackages;

  const nameWidth = Math.max(...packages.map((name) => name.length));
  const indexWidth = String(packages.length).length;
  let user;

  try {
    user = npmRead(['whoami']).trim();
  } catch {
    throw new Error('Run `npm login` first; trusted publishing setup needs an authenticated npm session.');
  }

  const field = (label, value) => console.log(`  ${styleText('dim', label.padEnd(12))}${value}`);

  console.log(styleText('bold', `\nnpm trusted publishing${dryRun ? ' (dry run, no changes)' : ''}\n`));
  field('user', user);
  field('publisher', `${REPOSITORY} · ${WORKFLOW} · ${ENVIRONMENT} · publish`);
  field('packages', String(packages.length));
  console.log();

  // Details sit under the package name, past the `[ n/total] ` index.
  const detailIndent = ' '.repeat(2 + indexWidth * 2 + 4);
  const detail = (style, text) => console.log(styleText(style, `${detailIndent}${text}`));
  const rows = [];

  for (const [i, name] of packages.entries()) {
    const index = styleText('dim', `[${String(i + 1).padStart(indexWidth)}/${packages.length}]`);

    if (i > 0) console.log();

    startProgress(`  ${index} ${name.padEnd(nameWidth)}  `);

    try {
      const { previous, kind, result } = await setupPackage(name);

      rows.push({ result, kind });
      endProgress(styleText(KIND_STYLES[kind], result));

      // An already-configured package's publisher is the one in the header.
      if (kind !== 'ok') for (const config of previous) detail('dim', `↳ ${config}`);
    } catch (error) {
      rows.push({ result: 'failed', kind: 'failed' });
      endProgress(styleText('red', 'failed'));
      detail('red', `↳ ${error.message}`);
      process.exitCode = 1;
    }
  }

  printTotals(rows);

  console.log();
}

try {
  await main();
} catch (error) {
  breakProgress();
  console.error(styleText('red', error.message));
  process.exitCode = 1;
}
