/** Install the real hosted registry skins consumed by the Sandbox with the stock Shadcn CLI. */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { isString } from '@videojs/utils/predicate';

const projectDir = resolve(import.meta.dirname, '..');
const workspaceDir = resolve(projectDir, '../..');
const registryDir = resolve(workspaceDir, 'packages/skins/dist/shadcn/r');
const require = createRequire(import.meta.url);
const shadcnBin = require.resolve('shadcn');
const generatedDir = resolve(projectDir, 'app/_generated');
const presets = ['video', 'audio', 'live-video', 'live-audio'] as const;

const inWorkspace = existsSync(resolve(workspaceDir, 'pnpm-workspace.yaml'));
const localRegistry = existsSync(resolve(registryDir, 'react/registry.json'));
const server = localRegistry ? createServer() : undefined;
const address = server
  ? await listen(server)
  : (process.env.VIDEOJS_REGISTRY_URL ?? 'https://shadcn.videojs.org/r').replace(/\/$/, '');

if (server) {
  server.on('request', async (request, response) => {
    const path = new URL(request.url ?? '/', address).pathname.slice(1);
    const source = await readFile(resolve(registryDir, path), 'utf8').catch(() => undefined);

    response.setHeader('access-control-allow-origin', '*');
    response.setHeader('cache-control', 'no-store');

    if (!source) {
      response.statusCode = 404;
      response.end('Not found.');
      return;
    }

    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.end(withoutPackagePins(source));
  });
}

/** Each catalog gets its own project alias because the Sandbox loads combinations a real pick-one consumer never does. */
const installs = [
  {
    catalog: 'react',
    destination: 'react-tailwind-default',
    alias: '@registry-react-tailwind-default',
    globalStyles: true,
    presets,
    baseStyle: 'base.css',
  },
  {
    catalog: 'react/neutral',
    destination: 'react-tailwind-neutral',
    alias: '@registry-react-tailwind-neutral',
    globalStyles: false,
    presets,
    baseStyle: 'base.css',
  },
  {
    catalog: 'react/compat',
    destination: 'react-tailwind-compat',
    alias: '@registry-react-tailwind-compat',
    globalStyles: true,
    presets,
    baseStyle: 'base.css',
  },
  {
    catalog: 'react/css',
    destination: 'react-css-default',
    alias: '@registry-react-css-default',
    globalStyles: false,
    presets,
    baseStyle: 'base.css',
  },
  {
    catalog: 'react/css/neutral',
    destination: 'react-css-neutral',
    alias: '@registry-react-css-neutral',
    globalStyles: false,
    presets,
    baseStyle: 'base.css',
  },
  {
    catalog: 'react/css/compat',
    destination: 'react-css-compat',
    alias: '@registry-react-css-compat',
    globalStyles: false,
    presets,
    baseStyle: 'base.css',
  },
  {
    catalog: 'html',
    destination: 'html-default',
    alias: '@registry-html-default',
    globalStyles: false,
    presets,
    baseStyle: 'base.css',
  },
  {
    catalog: 'html/neutral',
    destination: 'html-neutral',
    alias: '@registry-html-neutral',
    globalStyles: false,
    presets,
    baseStyle: 'base.css',
  },
  {
    catalog: 'html/compat',
    destination: 'html-compat',
    alias: '@registry-html-compat',
    globalStyles: false,
    presets,
    baseStyle: 'base.css',
  },
] as const;

await rm(generatedDir, { recursive: true, force: true });

try {
  for (const install of installs) await installCatalog(install, address);

  const styles = installs
    .filter((install) => install.globalStyles)
    .map((install) => `@import "./registry/${install.destination}/index.css";`)
    .join('\n');

  await writeFile(resolve(generatedDir, 'styles.css'), `${styles}\n`);
} catch (error) {
  // Inside the workspace the registry is the local build, so a failure there is a bug. Outside it, a StackBlitz
  // template for instance, the hosted registry may be unreachable or not deployed yet; the sandbox still has the
  // package skins, so keep going without the registry ones.
  if (localRegistry) throw error;

  await writeEmptyRegistry();
  console.warn(`Registry skins unavailable from ${address}; the sandbox offers the package skins only.`);
  console.warn(error instanceof Error ? error.message.split('\n')[0] : String(error));
} finally {
  if (server) await close(server);
}

// CI containers check the repository out under another user, and git refuses such trees unless the directory is
// marked safe, so mark it for this one command rather than requiring a global config step.
if (inWorkspace) {
  await runCommand(
    'git',
    ['-c', `safe.directory=${workspaceDir}`, 'check-ignore', '--quiet', 'apps/sandbox/app/_generated'],
    workspaceDir
  );
}

if (existsSync(resolve(generatedDir, 'registry/react-tailwind-default/components/videojs'))) {
  console.log(`Installed 12 React Tailwind, 12 React CSS, and 12 HTML source-owned Sandbox skins from ${address}.`);
}

/**
 * The local registry pins `@videojs/*` to the workspace version, which npm may not have yet, for instance on a release
 * branch that bumped it. Only the copied source files matter here, so drop the pins: the fixture already lists those
 * packages, and the Shadcn CLI skips installing an unpinned dependency that is present.
 */
function withoutPackagePins(source: string): string {
  // SAFETY: the registry build validated these documents against the Shadcn schema; only `dependencies` changes.
  const document = JSON.parse(source) as { dependencies?: string[] };
  if (!document.dependencies) return source;

  document.dependencies = document.dependencies.map((dependency) => dependency.replace(/^(@videojs\/[^@]+)@.+$/, '$1'));

  return `${JSON.stringify(document)}\n`;
}

/** What `app/styles.css` imports and scans, with nothing in it, so the app compiles without the registry skins. */
async function writeEmptyRegistry(): Promise<void> {
  await rm(generatedDir, { recursive: true, force: true });
  await mkdir(resolve(generatedDir, 'registry'), { recursive: true });
  await writeFile(resolve(generatedDir, 'styles.css'), '/* No registry skins were installed. */\n');
}

async function installCatalog(install: (typeof installs)[number], address: string): Promise<void> {
  const root = await mkdtemp(resolve(tmpdir(), `videojs-sandbox-${install.catalog.replaceAll('/', '-')}-`));
  const destination = resolve(generatedDir, 'registry', install.destination);

  try {
    await writeFixture(root, `${address}/${install.catalog}`, install.alias, install.baseStyle);

    const items = install.presets.map((preset) => `@videojs/${preset}`);

    await runCommand(
      process.execPath,
      [shadcnBin, 'add', ...items, '--cwd', root, '--yes', '--overwrite', '--silent'],
      root
    );

    await mkdir(resolve(destination, '..'), { recursive: true });
    await cp(resolve(root, 'src'), destination, { recursive: true });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function writeFixture(root: string, address: string, alias: string, baseStyle: string): Promise<void> {
  const packageJson = {
    name: 'videojs-sandbox-skins',
    private: true,
    type: 'module',
    packageManager: 'pnpm@12.6.0',
    // Every package the registry items depend on, so the CLI copies files without installing anything.
    dependencies: {
      '@videojs/core': '*',
      '@videojs/fcast': '*',
      '@videojs/html': '*',
      '@videojs/react': '*',
      cn: '*',
      react: '*',
    },
  };
  const components = {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'new-york',
    rsc: false,
    tsx: true,
    tailwind: {
      config: '',
      css: 'src/index.css',
      baseColor: 'neutral',
      cssVariables: true,
      prefix: '',
    },
    aliases: {
      components: `${alias}/components`,
      ui: `${alias}/components/ui`,
      utils: `${alias}/lib/utils`,
      lib: `${alias}/lib`,
      hooks: `${alias}/hooks`,
    },
    registries: {
      '@videojs': `${address}/{name}.json`,
    },
  };
  const tsconfig = {
    compilerOptions: {
      jsx: 'react-jsx',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      noEmit: true,
      paths: { [`${alias}/*`]: ['./src/*'] },
      skipLibCheck: true,
      strict: true,
      target: 'ES2022',
    },
    include: ['src'],
  };

  await mkdir(resolve(root, 'src/lib'), { recursive: true });
  await writeFile(resolve(root, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  await writeFile(resolve(root, 'components.json'), `${JSON.stringify(components, null, 2)}\n`);
  await writeFile(resolve(root, 'tsconfig.json'), `${JSON.stringify(tsconfig, null, 2)}\n`);
  await writeFile(resolve(root, 'src/index.css'), `@import "./components/videojs/styles/${baseStyle}";\n`);
  await writeFile(resolve(root, 'src/lib/utils.ts'), "export { cn } from 'cn';\n");
}

async function runCommand(
  executable: string,
  args: readonly string[],
  cwd: string
): Promise<{ readonly stdout: string; readonly stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    execFile(
      executable,
      [...args],
      {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, CI: '1', FORCE_COLOR: '0', NO_COLOR: '1' },
        maxBuffer: 100 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (!error) {
          resolvePromise({ stdout, stderr });
          return;
        }

        reject(
          new Error([`${executable} ${args.join(' ')}`, stdout, stderr].filter(Boolean).join('\n'), {
            cause: error,
          })
        );
      }
    );
  });
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolvePromise);
  });

  const address = server.address();
  if (!address || isString(address)) throw new Error('Could not resolve the registry server address.');

  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    server.close((error) => (error ? reject(error) : resolvePromise()));
  });
}
