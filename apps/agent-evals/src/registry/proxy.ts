import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';

const UPSTREAM = 'https://registry.npmjs.org';
const TARBALL_PREFIX = '/-/videojs-preview/';
/** Older than pnpm's default one-day minimumReleaseAge, so preview builds install like a settled release. */
const PUBLISHED_AGE_MS = 3 * 24 * 60 * 60 * 1000;

/** A packed build of one package, served in place of what npm has for its name. */
export interface PreviewPackage {
  name: string;
  version: string;
  file: string;
  integrity: string;
  shasum: string;
  manifest: Record<string, unknown>;
}

export function readPreviewPackages(dir: string): PreviewPackage[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.tgz'))
    .map((file) => {
      const path = join(dir, file);
      const tarball = readFileSync(path);
      const manifest = JSON.parse(
        execFileSync('tar', ['-xzOf', path, 'package/package.json'], { encoding: 'utf8' })
      ) as Record<string, unknown>;

      return {
        name: String(manifest.name),
        version: String(manifest.version),
        file,
        integrity: `sha512-${createHash('sha512').update(tarball).digest('base64')}`,
        shasum: createHash('sha1').update(tarball).digest('hex'),
        manifest,
      };
    });
}

/**
 * Makes a preview build the `latest` version of its package. A build that reuses a published version number replaces
 * that version, so an agent pinning the exact version still gets the build under test.
 */
export function withPreviewVersion(
  packument: Record<string, unknown> | null,
  preview: PreviewPackage,
  registryUrl: string,
  now = Date.now()
): Record<string, unknown> {
  const base = packument ?? { name: preview.name, versions: {}, 'dist-tags': {}, time: {} };
  const versions = { ...(base.versions as Record<string, unknown> | undefined) };
  const time = { ...(base.time as Record<string, string> | undefined) };

  versions[preview.version] = {
    ...preview.manifest,
    _id: `${preview.name}@${preview.version}`,
    dist: {
      tarball: `${registryUrl.replace(/\/$/, '')}${TARBALL_PREFIX}${preview.file}`,
      integrity: preview.integrity,
      shasum: preview.shasum,
    },
  };
  time[preview.version] = new Date(now - PUBLISHED_AGE_MS).toISOString();
  time.modified = new Date(now).toISOString();

  return {
    ...base,
    versions,
    time,
    'dist-tags': {
      ...(base['dist-tags'] as Record<string, string> | undefined),
      latest: preview.version,
      next: preview.version,
    },
  };
}

/** Orders semver versions, prereleases included; enough of the spec for npm version lists. */
export function compareVersions(a: string, b: string): number {
  const parse = (version: string) => {
    const [core = '', prerelease] = version.split('+')[0]!.split(/-(.*)/s);

    return { numbers: core.split('.').map(Number), prerelease: prerelease ? prerelease.split('.') : [] };
  };
  const left = parse(a);
  const right = parse(b);

  for (let index = 0; index < 3; index += 1) {
    const difference = (left.numbers[index] ?? 0) - (right.numbers[index] ?? 0);
    if (difference !== 0) return difference;
  }

  // A release sorts after its own prereleases.
  if (left.prerelease.length === 0 || right.prerelease.length === 0) {
    return right.prerelease.length - left.prerelease.length;
  }

  for (let index = 0; index < Math.max(left.prerelease.length, right.prerelease.length); index += 1) {
    const x = left.prerelease[index];
    const y = right.prerelease[index];
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1;

    const numeric = /^\d+$/.test(x) && /^\d+$/.test(y);
    const difference = numeric ? Number(x) - Number(y) : x.localeCompare(y);
    if (difference !== 0) return difference;
  }

  return 0;
}

/**
 * Rolls a packument back to how npm looked at `release`: later versions disappear and `latest` is the release, or the
 * newest earlier version for a package that skipped it. Returns `null` for a package that did not exist yet.
 */
/**
 * Points a pinned release's tarballs at the proxy, in npm's standard layout. pnpm records a tarball URL from another
 * host in its lockfile and later verifies that entry's release age against that host, where a release under a day old
 * fails, so pnpm commands after the first install would reject the pinned release. Only pnpm gets this: npm lockfiles
 * record every tarball URL, and npm's should stay npm's.
 */
export function withProxyTarballs(packument: Record<string, unknown>, registryUrl: string): Record<string, unknown> {
  const origin = registryUrl.replace(/\/$/, '');
  const versions = Object.fromEntries(
    Object.entries((packument.versions ?? {}) as Record<string, { dist?: { tarball?: string } }>).map(
      ([version, manifest]) => [
        version,
        manifest.dist?.tarball?.startsWith(`${UPSTREAM}/`)
          ? {
              ...manifest,
              dist: { ...manifest.dist, tarball: `${origin}${manifest.dist.tarball.slice(UPSTREAM.length)}` },
            }
          : manifest,
      ]
    )
  );

  return { ...packument, versions };
}

export function pinToRelease(
  packument: Record<string, unknown>,
  release: string,
  now = Date.now()
): Record<string, unknown> | null {
  const versions = (packument.versions ?? {}) as Record<string, unknown>;
  const kept = Object.keys(versions)
    .filter((version) => compareVersions(version, release) <= 0)
    .sort(compareVersions);
  const latest = kept.at(-1);
  if (!latest) return null;

  const allTime = (packument.time ?? {}) as Record<string, string>;
  const time: Record<string, string> = Object.fromEntries(
    kept.flatMap((version) => (allTime[version] ? [[version, allTime[version]]] : []))
  );
  const settled = new Date(now - PUBLISHED_AGE_MS).toISOString();

  // Published a day or more ago, whatever the real date, so pnpm's release-age check never holds a pinned release back.
  time[latest] = time[latest] && time[latest] < settled ? time[latest] : settled;

  return {
    ...packument,
    versions: Object.fromEntries(kept.map((version) => [version, versions[version]])),
    time: { ...time, created: allTime.created ?? settled, modified: time[latest] },
    'dist-tags': { latest, next: latest },
  };
}

export type RegistrySource = { packagesDir: string } | { release: string };

export interface RegistryProxy {
  url: string;
  /** Packed builds served as latest; empty when pinned to a release. */
  packages: PreviewPackage[];
  release: string | null;
  /** Environment that points npm, npx, pnpm (which reads only `pnpm_config_*` since v11), Yarn, and Bun at the proxy. */
  env: Record<string, string>;
  close: () => void;
}

/**
 * Serves packed builds as the latest @videojs packages, or pins every @videojs package to one release, and forwards all
 * other requests to the public npm registry.
 */
export async function startRegistryProxy(source: RegistrySource, port = 4873): Promise<RegistryProxy> {
  const dir = 'packagesDir' in source ? source.packagesDir : null;
  const release = 'release' in source ? source.release : null;
  const packages = dir ? readPreviewPackages(dir) : [];
  const byName = new Map(packages.map((preview) => [preview.name, preview]));
  const url = `http://127.0.0.1:${port}/`;

  const server = createServer((request, response) => {
    handle(request, response).catch((error: unknown) => {
      response.statusCode = 502;
      response.end(error instanceof Error ? error.message : String(error));
    });
  });

  async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const path = request.url ?? '/';

    if (path.startsWith(TARBALL_PREFIX)) {
      const file = decodeURIComponent(path.slice(TARBALL_PREFIX.length));
      const preview = packages.find((candidate) => candidate.file === file);
      if (!preview || !dir) return notFound(response);

      response.setHeader('content-type', 'application/octet-stream');
      createReadStream(join(dir, preview.file)).pipe(response);
      return;
    }

    // Only package documents: `/<name>` or `/@scope/<name>`. Tarballs live under `/<name>/-/` and pass through.
    const decoded = decodeURIComponent(path.slice(1).split('?')[0]!);
    const name = request.method === 'GET' && /^(?:@[^/]+\/)?[^/@]+$/.test(decoded) ? decoded : '';
    const preview = byName.get(name);

    if (release && name.startsWith('@videojs/')) {
      const upstream = await fetch(`${UPSTREAM}/${name.replace('/', '%2f')}`, {
        headers: { accept: 'application/json' },
      });
      const pinned = upstream.ok ? pinToRelease((await upstream.json()) as Record<string, unknown>, release) : null;
      if (!pinned) return notFound(response);

      const pnpm = /\bpnpm\//.test(request.headers['user-agent'] ?? '');

      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(pnpm ? withProxyTarballs(pinned, url) : pinned));
      return;
    }

    if (preview) {
      const upstream = await fetch(`${UPSTREAM}/${preview.name.replace('/', '%2f')}`, {
        headers: { accept: 'application/json' },
      });
      const packument = upstream.ok ? ((await upstream.json()) as Record<string, unknown>) : null;

      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify(withPreviewVersion(packument, preview, url)));
      return;
    }

    await forward(request, response);
  }

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));

  return {
    url,
    packages,
    release,
    env: {
      npm_config_registry: url,
      pnpm_config_registry: url,
      YARN_NPM_REGISTRY_SERVER: url,
      BUN_CONFIG_REGISTRY: url,
    },
    close: () => {
      server.closeAllConnections();
      server.close();
    },
  };
}

async function forward(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const headers = new Headers();

  for (const name of ['accept', 'content-type', 'npm-command', 'user-agent', 'pnpm-command']) {
    const value = request.headers[name];

    if (typeof value === 'string') headers.set(name, value);
  }

  const chunks: Buffer[] = [];

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    for await (const chunk of request) chunks.push(chunk as Buffer);
  }

  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
  const upstream = await fetch(`${UPSTREAM}${request.url ?? '/'}`, {
    method: request.method ?? 'GET',
    headers,
    ...(body ? { body } : {}),
  });

  response.statusCode = upstream.status;
  response.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/octet-stream');

  const reader = upstream.body?.getReader();

  for (let chunk = await reader?.read(); chunk && !chunk.done; chunk = await reader?.read()) {
    response.write(chunk.value);
  }

  response.end();
}

function notFound(response: ServerResponse): void {
  response.statusCode = 404;
  response.end('Not found.');
}

/** Unpacks one preview package, for serving its files the way a CDN would. */
export function unpackPreview(dir: string, preview: PreviewPackage, target: string): string {
  mkdirSync(target, { recursive: true });
  execFileSync('tar', ['-xzf', join(dir, preview.file), '-C', target]);

  return join(target, 'package');
}
