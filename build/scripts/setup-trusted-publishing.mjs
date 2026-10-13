/**
 * Configures npm trusted publishing (OIDC) for every public package that `.github/workflows/cd.yml` publishes.
 *
 * Pnpm release:trust [--dry-run] [--force] [package-name...]
 *
 * Npm only accepts a trusted publisher for a package that already exists, so a package that has never been published
 * first gets a deprecated placeholder release; the next CD run publishes the real version (with provenance) over
 * `latest`. An existing configuration that doesn't match this repository's workflow is revoked and replaced, because
 * the registry allows only one per package. `--force` also replaces configurations that look correct, for when the
 * registry rejects one anyway.
 *
 * Requires `npm login` with an account that has 2FA and write access to the packages. Each write asks for 2FA; choose
 * "skip two-factor authentication for the next 5 minutes" on the npm website to get through the batch.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';

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
const npmCommand = resolveNpmCommand();

function resolveNpmCommand() {
  const [major, minor] = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim().split('.').map(Number);
  if (major > 11 || (major === 11 && minor >= 15)) return ['npm'];

  // `npm trust` shipped in npm 11.15.
  return ['npx', '--yes', 'npm@11'];
}

/** Runs npm with the terminal attached so 2FA prompts and web-auth links reach the user. */
function npm(args, { cwd = tmpdir() } = {}) {
  const [command, ...prefix] = npmCommand;
  const result = spawnSync(command, [...prefix, ...args], { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`npm ${args.join(' ')} exited with ${result.status}`);
}

/** Runs a read-only npm command and returns stdout. Reads never prompt for 2FA, so stdout can be captured. */
function npmRead(args) {
  const [command, ...prefix] = npmCommand;
  const result = spawnSync(command, [...prefix, ...args], {
    cwd: tmpdir(),
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} exited with ${result.status}\n${result.stderr.trim()}`);
  }

  return result.stdout;
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

function describeConfig(config) {
  const permissions = config.permissions?.join(', ') || 'none';

  return `${config.type} ${config.repository ?? '?'} ${config.file ?? '?'} env=${config.environment ?? '(any)'} permissions=${permissions} id=${config.id}`;
}

async function setupPackage(name) {
  console.log(`\n${name}`);

  if (!(await existsOnRegistry(name))) {
    console.log(`  not on npm; publishing ${name}@${PLACEHOLDER_VERSION} under the "${PLACEHOLDER_TAG}" tag`);

    if (dryRun) return 'would publish placeholder and add trust';

    publishPlaceholder(name);
    await waitForRegistry(name);
    npm(['deprecate', `${name}@${PLACEHOLDER_VERSION}`, 'Placeholder release. Install a 10.x release instead.']);
  }

  const configs = listTrustConfigs(name);
  const current = configs.find(isExpectedConfig);

  for (const config of configs) console.log(`  existing: ${describeConfig(config)}`);

  if (current && configs.length === 1 && !flags.force) return 'already configured';

  if (dryRun) return configs.length ? 'would replace trust' : 'would add trust';

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

  return configs.length ? 'replaced trust' : 'added trust';
}

async function main() {
  const publicPackages = listPublicPackages();
  const unknown = positionals.filter((name) => !publicPackages.includes(name));
  if (unknown.length) throw new Error(`Not a public workspace package: ${unknown.join(', ')}`);

  const packages = positionals.length ? positionals : publicPackages;

  try {
    console.log(`npm user: ${npmRead(['whoami']).trim()}`);
  } catch {
    throw new Error('Run `npm login` first; trusted publishing setup needs an authenticated npm session.');
  }

  console.log(
    `Trusting ${REPOSITORY} .github/workflows/${WORKFLOW} (environment: ${ENVIRONMENT}) for ${packages.length} packages`
  );

  if (dryRun) console.log('Dry run: nothing will be published, revoked, or created.');

  const results = [];

  for (const name of packages) {
    try {
      results.push([name, await setupPackage(name)]);
    } catch (error) {
      console.error(`  ${error.message}`);
      results.push([name, 'FAILED']);
    }
  }

  console.log('\nSummary');

  for (const [name, result] of results) console.log(`  ${name.padEnd(32)} ${result}`);

  if (results.some(([, result]) => result === 'FAILED')) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
