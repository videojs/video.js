/**
 * Configures npm trusted publishing (OIDC) for every public package that `.github/workflows/cd.yml` publishes.
 *
 * Usage: `pnpm release:trust [--dry-run] [--force] [--check] [package-name...]`
 *
 * The registry only accepts a trusted publisher for a package that already exists, so a package that has never been
 * published first gets a deprecated placeholder release; the next CD run publishes the real version (with provenance)
 * over `latest`. A package can have several trusted publishers; only those for this repository's `cd.yml` are managed.
 * If none of them has the expected environment and permissions, they're revoked and one correct publisher is added.
 * Publishers for other workflows or repositories (for example, the Video.js 8 release workflow) are left alone.
 * `--force` also replaces a `cd.yml` publisher that looks correct, which is needed when it expired before its first
 * publish: npm still lists expired configurations unchanged.
 *
 * Requires `npm login` with an account that has 2FA and write access to the packages. Reading and writing trust
 * configurations both ask for 2FA; when npm's website offers "skip two-factor authentication for the next 5 minutes",
 * tick it to get through the batch.
 *
 * `--check` needs no npm login: it fails when a public package isn't on npm yet, which is the one case CI can detect,
 * because reading trust configurations requires 2FA. CI runs it on release PRs.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

    check: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (flags.help) {
  console.log('Usage: pnpm release:trust [--dry-run] [--force] [--check] [package-name...]');
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

  if (needsOtp(result)) {
    npmWithOtp(args.filter((arg) => arg !== '--json'));
    result = npmCapture(args);
  }

  if (result.status !== 0) throw npmError(args, result);

  return result.stdout;
}

function needsOtp(result) {
  return result.status !== 0 && /\bEOTP\b/.test(result.stderr);
}

function npmWithOtp(args) {
  log(styleText('cyan', '  npm needs 2FA. If it offers to skip 2FA for the next 5 minutes, tick it.'));
  npm(args);
}

function npmError(args, result) {
  return new Error(`npm ${args[0]} ${args[1] ?? ''}: ${npmErrorReason(result.stderr)}`);
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

/** Whether a configuration trusts this repository's release workflow, whatever its environment or permissions. */
function isManagedConfig(config) {
  return config.type === 'github' && config.repository === REPOSITORY && config.file === WORKFLOW;
}

function isExpectedConfig(config) {
  return (
    isManagedConfig(config) &&
    config.environment === ENVIRONMENT &&
    Array.isArray(config.permissions) &&
    config.permissions.includes('createPackage')
  );
}

const PERMISSION_LABELS = { createPackage: 'publish', createStagedPackage: 'stage', manageDistTags: 'tags' };

/**
 * Summarizes a configuration compactly, e.g. `videojs/videojs-v8 release.yml (Deploy) publish+tags`. The provider is
 * only named when it isn't GitHub, and the repository only when it isn't this one (the header names it).
 */
function describeConfig(config) {
  const permissions = config.permissions?.map((p) => PERMISSION_LABELS[p] ?? p).join('+') || 'no permissions';
  const parts = [
    config.type === 'github' ? null : `${config.type}:`,
    config.repository === REPOSITORY ? null : (config.repository ?? 'unknown repo'),
    config.file ?? 'unknown workflow',
    `(${config.environment ?? 'any env'})`,
    permissions,
  ];

  return parts.filter(Boolean).join(' ');
}

/**
 * Resolves to `{ replaced, kept, kind, result }`: descriptions of the `cd.yml` publishers that were (or would be)
 * revoked and of the other publishers left in place, and `kind`, which is `ok` (nothing to do) or `change`.
 */
async function setupPackage(name) {
  let placeholder = false;

  if (!(await existsOnRegistry(name))) {
    if (dryRun) return { replaced: [], kept: [], kind: 'change', result: RESULTS.placeholder };

    publishPlaceholder(name);
    await waitForRegistry(name);
    npm(['deprecate', `${name}@${PLACEHOLDER_VERSION}`, 'Placeholder release. Install a 10.x release instead.']);
    placeholder = true;
  }

  const configs = listTrustConfigs(name);
  const managed = configs.filter(isManagedConfig);
  const kept = configs.filter((config) => !isManagedConfig(config)).map(describeConfig);
  const trusted = managed.some(isExpectedConfig) && !flags.force;
  const replaced = trusted ? [] : managed.map(describeConfig);
  const kind = trusted ? 'ok' : 'change';
  const result = trusted
    ? RESULTS.ok
    : placeholder
      ? RESULTS.placeholder
      : managed.length
        ? RESULTS.replace
        : RESULTS.add;

  if (dryRun) return { replaced, kept, kind, result };

  if (!trusted) await replaceTrust(name, managed);

  return { replaced, kept, kind, result };
}

/** Revokes the given `cd.yml` publishers and adds the expected one; other publishers are never passed in. */
async function replaceTrust(name, managed) {
  for (const config of managed) {
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
}

const KIND_STYLES = { ok: 'green', change: 'yellow', failed: 'red' };

function printTotals(rows) {
  const counts = new Map();

  for (const { result, kind } of rows) counts.set(result, { kind, count: (counts.get(result)?.count ?? 0) + 1 });

  const parts = [...counts].map(([result, { kind, count }]) => styleText(KIND_STYLES[kind], `${count} ${result}`));

  console.log(`\n  ${styleText('bold', `${rows.length} packages`)}  ${parts.join(styleText('dim', ' · '))}`);
}

/** Fails when a package isn't on npm yet, and reports the command that fixes it (as a GitHub step summary in CI). */
async function checkPublished(packages) {
  const exists = await Promise.all(packages.map(existsOnRegistry));
  const missing = packages.filter((_, i) => !exists[i]);
  const command = `pnpm release:trust ${missing.join(' ')}`;

  console.log(styleText('bold', '\nnpm trusted publishing check\n'));

  if (!missing.length) {
    console.log(styleText('green', `  All ${packages.length} public packages are on npm.`));
    console.log(styleText('dim', '  Run `pnpm release:trust --dry-run` locally to verify their trusted publishers.\n'));
    return;
  }

  console.log(`  ${packages.length} public packages · ${styleText('red', `${missing.length} not on npm yet`)}\n`);

  for (const name of missing) console.log(styleText('red', `  ✗ ${name}`));

  console.log(`\n  npm can only attach a trusted publisher to a package that already exists. Run:\n\n    ${command}\n`);

  if (process.env.GITHUB_ACTIONS) {
    for (const name of missing)
      console.log(`::error title=${name} is not on npm::Run \`${command}\`, then re-run this check.`);
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = [
      '### npm trusted publishing',
      '',
      `These public packages aren't on npm yet, so publishing this release would fail for them:`,
      '',
      ...missing.map((name) => `- [ ] \`${name}\``),
      '',
      'A maintainer with npm 2FA and access to the packages runs this, then re-runs the check:',
      '',
      '```sh',
      'npm login',
      command,
      '```',
      '',
    ];

    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n'));
  }

  process.exitCode = 1;
}

async function main() {
  const publicPackages = listPublicPackages();
  const unknown = positionals.filter((name) => !publicPackages.includes(name));
  if (unknown.length) throw new Error(`Not a public workspace package: ${unknown.join(', ')}`);

  const packages = positionals.length ? positionals : publicPackages;

  if (flags.check) return checkPublished(packages);

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
  field('publisher', `${REPOSITORY} ${WORKFLOW} (${ENVIRONMENT}) publish`);

  field('packages', String(packages.length));
  console.log();

  // Details sit under the package name, past the `[ n/total] ` index.
  const detailIndent = ' '.repeat(2 + indexWidth * 2 + 4);
  const detail = (style, text) => console.log(styleText(style, `${detailIndent}${text}`));
  const index = (i) => styleText('dim', `[${String(i + 1).padStart(indexWidth)}/${packages.length}]`);
  const rows = [];

  for (const [i, name] of packages.entries()) {
    if (i > 0) console.log();

    startProgress(`  ${index(i)} ${name.padEnd(nameWidth)}  `);

    try {
      const { replaced, kept, kind, result } = await setupPackage(name);

      rows.push({ result, kind });
      endProgress(styleText(KIND_STYLES[kind], result));

      for (const config of replaced) detail('dim', `↳ ${config}`);

      for (const config of kept) detail('dim', `↳ ${config} (kept)`);
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
