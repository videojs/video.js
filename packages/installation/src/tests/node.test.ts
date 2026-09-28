import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { INSTALLATION_DEMO_SOURCES } from '../defaults';
import {
  compareVersions,
  detectFramework,
  detectInstalledPlayerVersions,
  detectPackageManager,
  detectTemplate,
  LAST_RELEASE_WITHOUT_AGENTS_INIT,
  runAgentsCommand,
  runAgentsInit,
  runAgentsSkills,
  type AgentsInitDefaults,
} from '../node';
import { installationCompatibility } from '../options';
import {
  INSTALLATION_BLOCK_OPERATIONS,
  INSTALLATION_BLOCK_PLACEMENTS,
  INSTALLATION_STEP_CONDITIONS,
  installationCommand,
} from '../plan';
import { INSTALLATION_FRAMEWORKS } from '../projects';
import { installationMethodsForFramework, installationTemplatesForMethod, sourceFrameworkFor } from '../selection';
import { defaultRegistryStyling } from '../shadcn';

const reactProject = {
  framework: { value: 'react', source: 'package.json dependencies' },
} as const satisfies AgentsInitDefaults;

const yarnProject = {
  packageManager: { value: 'yarn', source: 'yarn.lock' },
} as const satisfies AgentsInitDefaults;

/** Split a printed command whose quoted values never contain an escaped quote. */
function commandArguments(command: string): string[] {
  const words = command.match(/'[^']*'|\S+/g) ?? [];

  return words.slice(2).map((word) => (word.startsWith("'") ? word.slice(1, -1) : word));
}

function withTemporaryDirectory(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'videojs-installation-'));

  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('installationCommand', () => {
  it('runs the CLI package without forcing an npm tag', () => {
    expect(installationCommand(undefined, null)).toBe('npx @videojs/cli agents init');
    expect(installationCommand()).toBe('npx @videojs/cli agents init');
    expect(installationCommand({ framework: 'react', media: 'hls' }, '10.0.0')).toBe(
      'npx @videojs/cli@10.0.0 agents init --framework react --media hls'
    );
  });
});

describe('runAgentsInit', () => {
  it('returns discovery without modifying a project', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init'], reactProject);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('never installs packages');
    expect(result.stdout).toContain('--method');
  });

  it('uses the detected package manager and gives fully explicit examples', () => {
    const discovery = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--json'], yarnProject).stdout);
    const packageManager = discovery.options.find(({ flag }: { flag: string }) => flag === '--package-manager');

    expect(packageManager.default).toBe('yarn (from yarn.lock)');

    const viteProject = { template: { value: 'vite', source: 'package.json devDependencies' } } as const;
    const detected = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--json'], viteProject).stdout);
    const undetected = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--json'], {
        template: { value: null, source: 'no app setup detected' },
      }).stdout
    );
    const template = (discovery: { options: { flag: string; default: string }[] }) =>
      discovery.options.find(({ flag }) => flag === '--template')!.default;

    expect(template(detected)).toBe('vite (from package.json devDependencies)');
    expect(runAgentsInit('10.0.0', ['agents', 'init'], viteProject).stdout).toContain(
      'Default: vite (from package.json devDependencies).'
    );
    expect(template(undetected)).toBe('next for React; vite otherwise');

    const source = 'an index.html page with no package.json';
    const plainPage = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--json'], { method: { value: 'cdn', source } }).stdout
    );

    expect(plainPage.options.find(({ flag }: { flag: string }) => flag === '--method').default).toBe(
      `cdn (from ${source})`
    );

    // SAFETY: discovery JSON is produced by createInstallationDiscovery, whose examples field is a string array.
    for (const example of discovery.examples as string[]) {
      const args = example.split(' ').slice(2);
      const result = runAgentsInit('10.0.0', args);

      expect(result.exitCode, example).toBe(0);
      expect(result.stdout, example).toContain('Defaulted options: none.');
    }
  });

  it('returns complete selected instructions', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--method', 'shadcn', '--media', 'hls']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('## Create components.json');
    expect(result.stdout).toContain(
      'pnpm dlx shadcn@latest registry add @videojs=https://shadcn.videojs.org/r/html/{name}.json'
    );
    expect(result.stdout).toContain('Shadcn skips configured namespaces');
    expect(result.stdout).toContain('## Install the media adapter');
    expect(result.stdout).toContain('pnpm add @videojs/hlsjs-video@10.0.0');
    expect(result.stdout).toContain('vite.config.ts');
    expect(result.stdout).toContain("import '@/components/videojs/video/skin';");
  });

  it('adds selected extensions to packages and player code', () => {
    const result = runAgentsInit(
      '10.0.0',
      ['agents', 'init', '--media', 'hls', '--extensions', 'google-cast'],
      reactProject
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('@videojs/google-cast@10.0.0');
    expect(result.stdout).toContain("import { GoogleCast } from '@videojs/react/extensions/google-cast'");
    expect(result.stdout).toContain('<GoogleCast />');
  });

  it('omits the unused package manager for an existing CDN page', () => {
    const result = runAgentsInit('10.0.0', [
      'agents',
      'init',
      '--method',
      'cdn',
      '--project',
      'existing',
      '--template',
      'none',
      '--json',
    ]);
    const value = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(value.selectedOptions['package-manager']).toBeUndefined();
    expect(value.defaultedOptions).not.toContain('package-manager');
    expect(
      value.steps
        .flatMap(({ blocks }: { blocks: Array<{ code: string }> }) => blocks.map(({ code }) => code))
        .join('\n')
    ).not.toContain('pnpm');
  });

  it('uses an existing HTML setup without inventing scaffold or run commands', () => {
    const result = runAgentsInit('10.0.0', [
      'agents',
      'init',
      '--method',
      'packaged',
      '--framework',
      'html',
      '--template',
      'none',
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('## Prepare');
    expect(result.stdout).not.toContain('## Run your app');
    expect(result.stdout).not.toContain('create vite');
    expect(result.stdout).not.toContain('pnpm dev');
  });

  it('shows the likely development command for an existing named app setup', () => {
    const result = runAgentsInit(
      '10.0.0',
      [
        'agents',
        'init',
        '--method',
        'packaged',
        '--framework',
        'react',
        '--project',
        'existing',
        '--template',
        'start',
      ],
      reactProject
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('## Prepare');
    expect(result.stdout).toContain('## Run your app');
    expect(result.stdout).toContain('pnpm dev');
    expect(result.stdout).not.toContain('Continue in the existing');
  });

  it('rejects Shadcn for Vue and Svelte projects', () => {
    for (const framework of ['vue', 'svelte']) {
      const result = runAgentsInit('10.0.0', ['agents', 'init', '--framework', framework, '--method', 'shadcn']);

      expect(result.exitCode).toBe(2);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain(
        '- --method "shadcn": Shadcn installation is available for React and plain HTML. Use packaged installation for Vue or Svelte.'
      );
    }
  });

  it('lets Shadcn scaffold a new React Tailwind app without double scaffolding', () => {
    const result = runAgentsInit(
      '10.0.0',
      ['agents', 'init', '--method', 'shadcn', '--project', 'new', '--template', 'vite', '--styling', 'tailwind'],
      reactProject
    );

    expect(result.stdout).toContain('pnpm dlx shadcn@latest init --template vite');
    expect(result.stdout).not.toContain('pnpm dlx shadcn@latest init --base base --preset nova --yes');
    expect(result.stdout).not.toContain('# Optional: run if components.json does not exist.');
    expect(result.stdout).not.toContain('pnpm create vite');
  });

  it('keeps alias-free Shadcn initialization with the registry commands', () => {
    const result = runAgentsInit(
      '10.0.0',
      ['agents', 'init', '--method', 'shadcn', '--project', 'existing', '--template', 'next', '--styling', 'tailwind'],
      reactProject
    );

    expect(result.stdout).not.toContain('## Configure Shadcn');
    expect(result.stdout).toContain(
      '## Create components.json\n\n_Only when components.json is missing._\n\nThe registry steps below need components.json'
    );
    expect(result.stdout).toContain('`shadcn init` also rewrites the theme tokens in the global stylesheet');
    expect(result.stdout).toContain('## Add the Video.js Registry');
    expect(result.stdout).toContain('## Add the skin source');
    expect(result.stdout).toContain('Make sure the working tree is clean or checkpointed');
    expect(result.stdout).toContain('ask before committing');
    expect(result.stdout).not.toContain('Commit current source first');
    expect(result.stdout).toContain('```bash\npnpm dlx shadcn@latest init --base base --preset nova --yes\n```');
  });

  it('creates a missing standard components.json and converts a nonstandard one', () => {
    const json = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--method', 'shadcn', '--framework', 'html', '--json']).stdout
    );
    const markdown = runAgentsInit('10.0.0', ['agents', 'init', '--method', 'shadcn', '--framework', 'html']).stdout;
    const step = (id: string) => json.steps.find((candidate: { id: string }) => candidate.id === id);

    expect(step('configure-app-aliases')).toMatchObject({
      condition: 'when-components-json-missing-or-nonstandard',
      blocks: [
        { filename: 'tsconfig.json', operation: 'merge' },
        { filename: 'vite.config.ts', operation: 'merge' },
      ],
    });
    expect(step('create-components-json')).toMatchObject({
      condition: 'when-components-json-missing',
      blocks: [{ filename: 'components.json', operation: 'create' }],
    });
    expect(step('convert-components-json')).toMatchObject({
      condition: 'when-components-json-nonstandard',
      blocks: [{ filename: 'components.json', operation: 'replace' }],
    });
    expect(step('convert-components-json').blocks[0].anchor).toBeUndefined();
    expect(step('convert-components-json').description).toContain('keep the existing values under aliases');
    expect(markdown).toContain(
      '_Only when components.json is missing or does not use the standard https://ui.shadcn.com/schema.json schema._'
    );
    expect(markdown).toContain(
      '_Only when components.json exists but does not use the standard https://ui.shadcn.com/schema.json schema._'
    );
    expect(markdown).not.toContain('Skip this step when components.json');
  });

  it('omits the app-alias step when the app setup needs no aliases', () => {
    const json = JSON.parse(
      runAgentsInit('10.0.0', [
        'agents',
        'init',
        '--method',
        'shadcn',
        '--framework',
        'react',
        '--project',
        'existing',
        '--template',
        'next',
        '--styling',
        'css',
        '--json',
      ]).stdout
    );
    const stepIds = json.steps.map(({ id }: { id: string }) => id);

    expect(stepIds).not.toContain('configure-app-aliases');
    expect(stepIds.slice(0, 2)).toEqual(['create-components-json', 'convert-components-json']);
  });

  it('writes Shadcn aliases where Vite and Shadcn both resolve them', () => {
    const result = runAgentsInit(
      '10.0.0',
      ['agents', 'init', '--method', 'shadcn', '--template', 'vite', '--styling', 'css'],
      reactProject
    );

    expect(result.stdout).toContain('### `tsconfig.json`');
    expect(result.stdout).toContain('### `tsconfig.app.json`');
    expect(result.stdout).toContain('"tsx": true');
    expect(result.stdout).not.toContain('"baseUrl"');
  });

  it('uses Astro and Laravel entry conventions for HTML apps', () => {
    const astro = runAgentsInit('10.0.0', ['agents', 'init', '--framework', 'html', '--template', 'astro']);
    const laravel = runAgentsInit('10.0.0', [
      'agents',
      'init',
      '--framework',
      'html',
      '--project',
      'new',
      '--template',
      'laravel',
    ]);

    expect(astro.stdout).toContain('<script src="../scripts/player.ts"></script>');
    expect(astro.stdout).not.toContain('<script type="module" src="../scripts/player.ts"></script>');
    expect(laravel.stdout).toContain('laravel new videojs-app --pnpm --no-interaction');
    expect(laravel.stdout).toContain('## Configure your app entry');
    expect(laravel.stdout).toContain("'resources/js/player.ts'");
  });

  it('keeps the optional Vite scaffold in CDN agent instructions', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--method', 'cdn', '--project', 'new']);

    expect(result.stdout).toContain('## Create the app');
    expect(result.stdout).toContain('pnpm create vite');
    expect(result.stdout).toContain('## Run your app');
    expect(result.stdout).toContain('Scaffold a minimal Vite site');
    expect(result.stdout).toContain('Replace the starter page with this page');
    expect(result.stdout.match(/### `index.html`/g)).toHaveLength(1);
  });

  it('places CDN scripts in the head and markup in the body of an existing page', () => {
    const json = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--method', 'cdn', '--json']).stdout);
    const markdown = runAgentsInit('10.0.0', ['agents', 'init', '--method', 'cdn']).stdout;
    const blocks = json.steps.flatMap(({ blocks }: { blocks: unknown[] }) => blocks);

    expect(blocks).toEqual([
      expect.objectContaining({ filename: 'index.html', operation: 'merge', placement: 'head' }),
      expect.objectContaining({ filename: 'index.html', operation: 'merge', placement: 'body' }),
    ]);
    expect(markdown).toContain('### `index.html` (head)\n\n_Merge this into the page `<head>`._');
    expect(markdown).toContain(
      '### `index.html` (body)\n\n_Merge this into the page `<body>` where the player should appear._'
    );
  });

  it('replaces starter pages in new apps and merges into existing ones without demo headings', () => {
    const blocksFor = (args: string[]) =>
      JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', ...args, '--json'], reactProject).stdout).steps.find(
        ({ id }: { id: string }) => id === 'player'
      );
    const next = blocksFor(['--project', 'new', '--template', 'next']);
    const nextExisting = blocksFor(['--project', 'existing', '--template', 'next']);
    const vite = blocksFor(['--framework', 'html', '--project', 'new', '--template', 'vite']);
    const vue = blocksFor(['--framework', 'vue', '--project', 'new', '--template', 'vite']);
    const vueExisting = blocksFor(['--framework', 'vue', '--project', 'existing', '--template', 'vite']);

    expect(next.blocks).toEqual([expect.objectContaining({ filename: 'app/page.tsx', operation: 'replace' })]);
    expect(nextExisting.blocks).toEqual([expect.objectContaining({ filename: 'app/page.tsx', operation: 'merge' })]);
    expect(vite.blocks).toEqual([
      expect.objectContaining({ filename: 'src/player.ts', operation: 'create' }),
      expect.objectContaining({
        filename: 'index.html',
        operation: 'replace',
        code: expect.stringMatching(/^<!doctype html>/),
      }),
    ]);
    expect(vite.removeFiles).toEqual(['src/main.ts', 'src/counter.ts', 'src/style.css', 'src/typescript.svg']);
    expect(vue.blocks.map(({ operation }: { operation: string }) => operation)).toEqual(['create', 'replace']);
    expect(vue.removeFiles).toEqual(['src/components/HelloWorld.vue']);
    expect(vueExisting.blocks.map(({ operation }: { operation: string }) => operation)).toEqual(['merge', 'merge']);
    expect(vueExisting.removeFiles).toBeUndefined();
    expect(JSON.stringify(vueExisting)).not.toContain('<h1>');
  });

  it('runs every step after a subdirectory scaffold from the new app directory', () => {
    const shadcn = JSON.parse(
      runAgentsInit(
        '10.0.0',
        [
          'agents',
          'init',
          '--method',
          'shadcn',
          '--project',
          'new',
          '--template',
          'next',
          '--styling',
          'tailwind',
          '--json',
        ],
        reactProject
      ).stdout
    );
    const markdown = runAgentsInit(
      '10.0.0',
      ['agents', 'init', '--method', 'shadcn', '--project', 'new', '--template', 'next', '--styling', 'tailwind'],
      reactProject
    ).stdout;
    const inPlace = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--project', 'new', '--template', 'next', '--json'], reactProject)
        .stdout
    );

    expect(shadcn.steps.map(({ workingDirectory }: { workingDirectory: string }) => workingDirectory)).toEqual([
      '.',
      ...shadcn.steps.slice(1).map(() => 'videojs-app'),
    ]);
    expect(markdown).toContain('It creates `videojs-app`');
    expect(markdown).toContain('## Add the Video.js Registry\n\n_Working directory: `videojs-app`._');
    expect(inPlace.steps.every(({ workingDirectory }: { workingDirectory: string }) => workingDirectory === '.')).toBe(
      true
    );
  });

  it('marks the development server as long-running', () => {
    const json = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--template', 'vite', '--json']).stdout);
    const markdown = runAgentsInit('10.0.0', ['agents', 'init', '--template', 'vite']).stdout;

    expect(json.steps.at(-1)).toMatchObject({
      id: 'run',
      blocks: [{ code: 'pnpm dev', operation: 'run', longRunning: true }],
    });
    expect(markdown).toContain('_Long-running: start it in the background, verify the result, then stop it._');
  });

  it('describes the copied HTML skin insertion in JSON', () => {
    const json = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--method', 'shadcn', '--framework', 'html', '--json']).stdout
    );
    const page = json.steps
      .find(({ id }: { id: string }) => id === 'player')
      .blocks.find(({ filename }: { filename: string }) => filename === 'index.html');

    expect(page.insertContents).toEqual([
      {
        anchor: '<!-- Paste the contents of src/components/videojs/video/skin.html here. -->',
        from: 'src/components/videojs/video/skin.html',
      },
    ]);
    expect(page.code).toContain(page.insertContents[0].anchor);
  });

  it('points copied skin paths at the components alias from components.json', () => {
    const html = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--method', 'shadcn', '--framework', 'html', '--json']).stdout
    );
    const react = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--method', 'shadcn', '--framework', 'react', '--json']).stdout
    );
    const description = (plan: { steps: { id: string; description: string }[] }) =>
      plan.steps.find(({ id }) => id === 'player')!.description;

    expect(description(html)).toContain(
      'Use the aliases.components value from components.json when it differs from the generated @/components path: the skin file then lives under the directory that alias maps to instead of src/components, and the skin import uses that alias.'
    );
    expect(description(react)).toContain(
      'Use the aliases.components value from components.json in the skin import when it differs from the generated @/components path.'
    );
  });

  it('keeps packaged Nuxt player markup on the client', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--framework', 'vue', '--template', 'nuxt']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('app/components/VideoPlayer.client.vue');
    expect(result.stdout).toContain("import { VideoPlayer } from '#components'");
    expect(result.stdout).not.toContain("from './components/VideoPlayer.client.vue'");
  });

  it('does not add framework setup instructions to an existing Astro app', () => {
    const result = runAgentsInit(
      '10.0.0',
      ['agents', 'init', '--method', 'shadcn', '--template', 'astro', '--json'],
      reactProject
    );
    // SAFETY: runAgentsInit produced instruction JSON above, whose steps expose stable string IDs.
    const steps = JSON.parse(result.stdout).steps as Array<{ id: string }>;

    expect(result.exitCode).toBe(0);
    expect(steps.some(({ id }) => id === 'configure-framework')).toBe(false);
  });

  it('re-runs the generated native-audio command without changing its selection', () => {
    const first = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--preset', 'audio', '--media', 'html5-audio', '--json']).stdout
    );
    const args = first.reproduceCommand.split(' ').slice(2);

    expect(first.reproduceCommand).toMatch(
      /^npx @videojs\/cli@10\.0\.0 agents init --method packaged --framework html /
    );

    const reproduced = runAgentsInit('10.0.0', [...args, '--json']);

    expect(reproduced.exitCode).toBe(0);
    expect(JSON.parse(reproduced.stdout).selectedOptions).toEqual(first.selectedOptions);
  });

  it('documents the plan vocabulary in discovery', () => {
    const json = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--json']).stdout);
    const markdown = runAgentsInit('10.0.0', ['agents', 'init']).stdout;

    expect(Object.keys(json.planFormat.operations)).toEqual(['create', 'merge', 'replace', 'run']);
    expect(Object.keys(json.planFormat.placements)).toEqual(['head', 'body']);
    expect(Object.keys(json.planFormat.conditions)).toEqual([
      'when-components-json-missing',
      'when-components-json-missing-or-nonstandard',
      'when-components-json-nonstandard',
    ]);
    expect(Object.keys(json.planFormat.fields)).toContain('steps[].blocks[].longRunning');
    expect(markdown).toContain('## Plan format');
    expect(markdown).toContain('- `steps[].workingDirectory`: ');
    expect(markdown).toContain('- `when-components-json-missing-or-nonstandard`: ');
  });

  it('returns one JSON document', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--json']);
    const value = JSON.parse(result.stdout);

    expect(result.stderr).toBe('');
    expect(value.kind).toBe('discovery');
    expect(value.options.find(({ flag }: { flag: string }) => flag === '--method').values).toEqual([
      'packaged',
      'shadcn',
      'cdn',
    ]);
    expect(value.compatibility.mediaByPreset.audio).toEqual(['html5-audio', 'mux-audio', 'spotify']);
  });

  it('exposes public option names without internal selection fields in instruction JSON', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--preset', 'background-video', '--json']);
    const value = JSON.parse(result.stdout);

    expect(value.kind).toBe('instructions');
    expect(value.selection).toBeUndefined();
    expect(value.selectedOptions).toMatchObject({
      method: 'packaged',
      framework: 'html',
      preset: 'background-video',
      'package-manager': 'pnpm',
    });
    expect(value.selectedOptions.skin).toBeUndefined();
    expect(value.selectedOptions.cdnBase).toBeUndefined();
    expect(value.defaultedOptions).not.toContain('skin');
  });

  it('supports top-level discovery and version JSON forms', () => {
    const discovery = JSON.parse(runAgentsInit('10.0.0', ['--help', '--json'], reactProject).stdout);
    const bareJson = JSON.parse(runAgentsInit('10.0.0', ['--json'], reactProject).stdout);
    const version = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--version', '--json'], reactProject).stdout);
    const topLevelVersion = JSON.parse(runAgentsInit('10.0.0', ['--version', '--json'], reactProject).stdout);

    expect(discovery.kind).toBe('discovery');
    expect(bareJson.kind).toBe('discovery');
    expect(version).toMatchObject({ kind: 'version', package: '@videojs/cli', packageVersion: '10.0.0' });
    expect(topLevelVersion).toEqual(version);
  });

  it('escapes a custom source URL in generated markup and Markdown fences', () => {
    const source = 'https://example.com/video.mp4?label="four````ticks"&autoplay=1';
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--source-url', source]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      'src="https://example.com/video.mp4?label=&quot;four````ticks&quot;&amp;autoplay=1"'
    );
    expect(result.stdout).toContain('`````html');
    expect(result.stdout).toContain(`- \`source-url\`: \`\`\`\`\`${source}\`\`\`\`\``);
    expect(result.stdout).not.toContain(`src="${source}"`);
  });

  it('uses the demo source when source-url is explicitly empty', () => {
    const separate = runAgentsInit('10.0.0', ['agents', 'init', '--source-url', '']);
    const equals = runAgentsInit('10.0.0', ['agents', 'init', '--source-url=']);
    const missingMethod = runAgentsInit('10.0.0', ['agents', 'init', '--method', '']);

    expect(separate.exitCode).toBe(0);
    expect(separate.stdout).toContain(INSTALLATION_DEMO_SOURCES.videoMp4);
    expect(equals.exitCode).toBe(0);
    expect(equals.stdout).toContain(INSTALLATION_DEMO_SOURCES.videoMp4);
    expect(missingMethod.exitCode).toBe(2);
  });

  it('treats an explicit demo source as a choice that reruns to the same plan', () => {
    const failures: string[] = [];

    for (const [preset, media] of Object.entries(installationCompatibility.mediaByPreset)) {
      for (const renderer of media) {
        const args = [
          'agents',
          'init',
          '--method',
          'packaged',
          '--framework',
          'html',
          '--project',
          'existing',
          '--preset',
          preset,
          ...(preset === 'background-video' ? [] : ['--skin', 'default']),
          '--media',
          renderer,
          '--extensions',
          'none',
          '--source-url',
          'demo',
          '--package-manager',
          'pnpm',
          '--template',
          'vite',
        ];
        const markdown = runAgentsInit('10.0.0', args);
        const first = JSON.parse(runAgentsInit('10.0.0', [...args, '--json']).stdout);
        const rerun = JSON.parse(
          runAgentsInit('10.0.0', [...commandArguments(first.reproduceCommand), '--json']).stdout
        );
        const label = `${preset}/${renderer}`;

        if (!markdown.stdout.includes('Defaulted options: none.')) failures.push(`${label}: defaulted options`);

        if (first.resolvedSourceUrl === 'demo') failures.push(`${label}: unresolved demo source`);

        if (JSON.stringify(rerun.selectedOptions) !== JSON.stringify(first.selectedOptions)) {
          failures.push(`${label}: rerun changed selected options`);
        }

        if (JSON.stringify(rerun.steps) !== JSON.stringify(first.steps)) failures.push(`${label}: rerun changed steps`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('accepts only http(s) source URLs besides the demo keyword', () => {
    for (const source of ['not a url', 'javascript:alert(1)', 'ftp://example.com/video.mp4', '//example.com/a.mp4']) {
      const result = runAgentsInit('10.0.0', ['agents', 'init', '--source-url', source, '--json']);

      expect(result.exitCode, source).toBe(2);
      expect(JSON.parse(result.stdout).errors, source).toEqual([
        expect.objectContaining({ field: '--source-url', message: expect.stringContaining('http:// or https://') }),
      ]);
    }

    expect(runAgentsInit('10.0.0', ['agents', 'init', '--source-url', 'http://example.com/a.mp4']).exitCode).toBe(0);
  });

  it('returns valid framework-specific next links in JSON and Markdown', () => {
    const json = runAgentsInit('10.0.0', ['agents', 'init', '--framework', 'vue', '--json']);
    const markdown = runAgentsInit('10.0.0', ['agents', 'init', '--framework', 'vue']);
    const value = JSON.parse(json.stdout);

    expect(value.next).toEqual([
      { label: 'Customize skins', url: 'https://videojs.org/docs/framework/html/guides/customize-skins' },
      { label: 'Browser support', url: 'https://videojs.org/docs/framework/html/guides/browser-support' },
    ]);
    expect(markdown.stdout).toContain('## Next steps');
    expect(markdown.stdout).toContain(
      '[Customize skins](https://videojs.org/docs/framework/html/guides/customize-skins)'
    );
  });

  it('pins package installs and source media adapters to the requested release', () => {
    const packaged = runAgentsInit(
      '10.0.0-rc.2',
      ['agents', 'init', '--media', 'mux-video', '--package-manager', 'npm'],
      reactProject
    );
    const shadcn = runAgentsInit(
      '10.0.0-rc.2',
      ['agents', 'init', '--method', 'shadcn', '--media', 'hls', '--package-manager', 'npm'],
      reactProject
    );

    expect(packaged.stdout).toContain(
      'npm install @videojs/react@10.0.0-rc.2 @videojs/mux-video@10.0.0-rc.2 @videojs/mux-data@10.0.0-rc.2'
    );
    expect(shadcn.stdout).toContain('npm install @videojs/hlsjs-video@10.0.0-rc.2');
    expect(shadcn.stdout).not.toContain('@videojs/_media-hls');
  });

  it('omits skin from background-video instructions and reproduction commands', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--preset', 'background-video']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain('- `skin`:');
    expect(result.stdout).not.toContain('--skin');
  });

  it('covers every framework and installation method in one discovery', () => {
    const markdown = runAgentsInit('10.0.0', ['agents', 'init'], reactProject);
    const json = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--json']).stdout);
    const option = (name: string) => json.options.find(({ flag }: { flag: string }) => flag === name);

    expect(json.package).toBe('@videojs/cli');
    expect(json.command).toBe('npx @videojs/cli@10.0.0 agents init');
    expect(option('--method').values).toEqual(['packaged', 'shadcn', 'cdn']);
    expect(option('--framework').values).toEqual(['react', 'html', 'vue', 'svelte']);
    expect(option('--framework').default).toBe('detected from package.json dependencies; otherwise html');
    expect(Object.keys(json.compatibility.methodsByFramework)).toEqual(['react', 'html', 'vue', 'svelte']);
    expect(json.examples).toEqual([
      expect.stringMatching(/^npx @videojs\/cli@10\.0\.0 agents init --method packaged --framework react /),
      expect.stringMatching(/^npx @videojs\/cli@10\.0\.0 agents init --method shadcn --framework html /),
      expect.stringMatching(/^npx @videojs\/cli@10\.0\.0 agents init --method cdn --framework html /),
    ]);
    expect(markdown.stdout).toContain('Default: react (from package.json dependencies).');
    expect(markdown.stdout).toContain('- `html`: app setups');
    expect(markdown.stdout).toContain('- `svelte`: app setups');
    expect(markdown.stdout).toContain('CDN is plain HTML only');
  });

  it('derives the player package from the framework', () => {
    const react = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--framework', 'react', '--json']).stdout);
    const vue = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--framework', 'vue', '--json']).stdout);

    expect(react).toMatchObject({ package: '@videojs/cli', playerPackage: '@videojs/react' });
    expect(vue).toMatchObject({ package: '@videojs/cli', playerPackage: '@videojs/html' });
  });

  it('lists a detected framework as a defaulted option with its source and pins it in the rerun command', () => {
    const markdown = runAgentsInit('10.0.0', ['agents', 'init', '--media', 'hls'], reactProject);
    const json = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--media', 'hls', '--json'], reactProject).stdout
    );
    const explicit = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--framework', 'vue', '--json'], reactProject).stdout
    );

    expect(markdown.stdout).toContain('Defaulted options: method, framework (react from package.json dependencies),');
    expect(json.selectedOptions.framework).toBe('react');
    expect(json.defaultedOptions).toContain('framework');
    expect(json.defaultedOptionSources).toEqual({ framework: 'package.json dependencies' });
    expect(json.reproduceCommand).toContain('--framework react');
    expect(explicit.selectedOptions.framework).toBe('vue');
    expect(explicit.defaultedOptions).not.toContain('framework');
    expect(explicit.defaultedOptionSources).toEqual({});
  });

  it('explains a detected package manager in Markdown and JSON', () => {
    const args = ['agents', 'init', '--media', 'hls'];
    const markdown = runAgentsInit('10.0.0', args, yarnProject);
    const json = JSON.parse(runAgentsInit('10.0.0', [...args, '--json'], yarnProject).stdout);
    const explicit = JSON.parse(
      runAgentsInit('10.0.0', [...args, '--package-manager', 'npm', '--json'], yarnProject).stdout
    );
    const cdnPage = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--method', 'cdn', '--json'], yarnProject).stdout
    );

    expect(markdown.stdout).toContain('package-manager (yarn from yarn.lock)');
    expect(json.defaultedOptionSources).toEqual({ 'package-manager': 'yarn.lock' });
    expect(explicit.defaultedOptionSources).toEqual({});
    expect(cdnPage.defaultedOptionSources).toEqual({});
  });

  it('defaults to plain HTML when no framework is detected', () => {
    const json = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--media', 'hls', '--json']).stdout);

    expect(json.selectedOptions.framework).toBe('html');
    expect(json.defaultedOptions).toContain('framework');
    expect(json.defaultedOptionSources).toEqual({});
  });

  it('defaults a plain HTML page to CDN scripts unless another method or framework is requested', () => {
    const source = 'an index.html page with no package.json';
    const plainPage = { method: { value: 'cdn', source }, template: { value: 'none', source } } as const;
    const args = ['agents', 'init', '--media', 'hls'];
    const markdown = runAgentsInit('10.0.0', args, plainPage);
    const json = JSON.parse(runAgentsInit('10.0.0', [...args, '--json'], plainPage).stdout);
    const packaged = JSON.parse(runAgentsInit('10.0.0', [...args, '--method', 'packaged', '--json'], plainPage).stdout);
    const react = JSON.parse(runAgentsInit('10.0.0', [...args, '--framework', 'react', '--json'], plainPage).stdout);

    expect(markdown.stdout).toContain(`Defaulted options: method (cdn from ${source}),`);
    expect(json.selectedOptions).toMatchObject({ method: 'cdn', project: 'existing', template: 'none' });
    expect(json.defaultedOptionSources).toEqual({ method: source, template: source });
    expect(json.reproduceCommand).toContain('--method cdn');
    expect(packaged.selectedOptions.method).toBe('packaged');
    expect(packaged.defaultedOptionSources).toEqual({ template: source });
    expect(react.selectedOptions.method).toBe('packaged');
    expect(react.defaultedOptionSources).not.toHaveProperty('method');
  });

  it('points at the matching CLI release when the project has another player version', () => {
    const defaults = { ...reactProject, installedVersions: { react: '10.0.0-rc.3', html: '10.0.0' } };
    const args = ['agents', 'init', '--preset', 'audio', '--media', 'html5-audio'];
    const markdown = runAgentsInit('10.0.0', args, defaults);
    const json = JSON.parse(runAgentsInit('10.0.0', [...args, '--json'], defaults).stdout);
    const command = json.reproduceCommand.replace('@videojs/cli@10.0.0 ', '@videojs/cli@10.0.0-rc.3 ');

    expect(json.versionNotice).toEqual({
      package: '@videojs/react',
      installedVersion: '10.0.0-rc.3',
      command,
      message: expect.stringContaining(`run \`${command}\``),
    });
    expect(command).toContain('--framework react');
    expect(markdown.stdout).toContain(
      `> **Version mismatch.** These instructions target Video.js 10.0.0, but this project has \`@videojs/react@10.0.0-rc.3\`. For instructions that match the installed version, run \`${command}\`.`
    );
    expect(markdown.stdout.indexOf('Version mismatch')).toBeLessThan(markdown.stdout.indexOf('## Selected options'));
  });

  it('asks to upgrade when the installed player predates agents init', () => {
    const defaults = { ...reactProject, installedVersions: { react: LAST_RELEASE_WITHOUT_AGENTS_INIT } };
    const json = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--preset', 'video', '--json'], defaults).stdout
    );

    expect(json.versionNotice).toEqual({
      package: '@videojs/react',
      installedVersion: LAST_RELEASE_WITHOUT_AGENTS_INIT,
      command: null,
      message: expect.stringContaining("predates `agents init`, so upgrade the project's Video.js packages to 10.0.0"),
    });
    expect(json.versionNotice.message).not.toContain('npx');
  });

  it('omits the version notice when the installed player matches or belongs to the other framework', () => {
    const args = ['agents', 'init', '--framework', 'html', '--json'];
    const matching = JSON.parse(runAgentsInit('10.0.0', args, { installedVersions: { html: '10.0.0' } }).stdout);
    const otherPlayer = JSON.parse(
      runAgentsInit('10.0.0', args, { installedVersions: { react: '10.0.0-rc.1' } }).stdout
    );

    expect(matching.versionNotice).toBeUndefined();
    expect(otherPlayer.versionNotice).toBeUndefined();
    expect(runAgentsInit('10.0.0', args.slice(0, -1), { installedVersions: { html: '10.0.0' } }).stdout).not.toContain(
      'Version mismatch'
    );
  });

  it('offers CDN on an existing page or in a new Vite app only', () => {
    const cdn = ['agents', 'init', '--framework', 'html', '--method', 'cdn'];
    const existingVite = runAgentsInit('10.0.0', [...cdn, '--project', 'existing', '--template', 'vite']);
    const vite = runAgentsInit('10.0.0', [...cdn, '--template', 'vite', '--json']);

    expect(existingVite.exitCode).toBe(2);
    expect(existingVite.stderr).toContain('For an existing Vite app, use --method packaged.');
    expect(existingVite.stderr).toContain('with --template none, or into a new Vite app with --project new.');
    expect(JSON.parse(vite.stdout).selectedOptions).toMatchObject({ project: 'new', template: 'vite' });
  });

  it('renders every supported framework, method, app setup, and starting point without hidden defaults', () => {
    const failures: string[] = [];
    let scenarioCount = 0;

    for (const framework of INSTALLATION_FRAMEWORKS) {
      for (const method of installationMethodsForFramework(framework)) {
        for (const template of installationTemplatesForMethod(framework, method)) {
          const projects =
            template === 'none'
              ? (['existing'] as const)
              : method === 'cdn'
                ? (['new'] as const)
                : (['new', 'existing'] as const);

          for (const project of projects) {
            scenarioCount += 1;
            const args = [
              'agents',
              'init',
              '--method',
              method,
              '--framework',
              framework,
              '--project',
              project,
              '--preset',
              'video',
              '--skin',
              'default',
              '--media',
              'html5-video',
              '--extensions',
              'none',
              '--source-url',
              INSTALLATION_DEMO_SOURCES.videoMp4,
              '--package-manager',
              'pnpm',
              '--template',
              template,
            ];

            if (method === 'shadcn') {
              args.push('--styling', defaultRegistryStyling(sourceFrameworkFor(framework)));
            }

            const result = runAgentsInit('10.0.0-test', args);
            const jsonResult = runAgentsInit('10.0.0-test', [...args, '--json']);
            const label = `${framework}/${method}/${template}/${project}`;

            if (result.exitCode !== 0 || !result.stdout.includes('Defaulted options: none.')) {
              failures.push(`${label}: ${result.stderr || result.stdout}`);
            }

            if (jsonResult.exitCode !== 0) {
              failures.push(`${label} JSON: ${jsonResult.stderr || jsonResult.stdout}`);
              continue;
            }

            // SAFETY: successful --json output above is produced by installationPlanJson with this stable shape.
            const document = JSON.parse(jsonResult.stdout) as {
              defaultedOptions: string[];
              steps: Array<{
                id: string;
                condition?: string;
                workingDirectory: string;
                blocks: Array<{
                  code: string;
                  operation: string;
                  filename?: string;
                  anchor?: string;
                  placement?: string;
                }>;
              }>;
            };
            const stepIds = document.steps.map(({ id }) => id);
            const code = document.steps.flatMap(({ blocks }) => blocks.map((block) => block.code)).join('\n');

            if (document.defaultedOptions.length > 0) failures.push(`${label}: hidden defaults`);

            if (new Set(stepIds).size !== stepIds.length) failures.push(`${label}: duplicate step IDs`);

            if (document.steps.some(({ blocks }) => blocks.length === 0 || blocks.some((block) => !block.code))) {
              failures.push(`${label}: empty instruction block`);
            }

            if (code.includes('undefined') || code.includes('<app-directory>')) {
              failures.push(`${label}: unresolved generated value`);
            }

            if ((project === 'new') !== stepIds.includes('prepare-app')) {
              failures.push(`${label}: incorrect app preparation`);
            }

            for (const step of document.steps) {
              const targets = step.blocks
                .filter((block) => block.filename)
                .map((block) => `${block.filename} ${block.anchor ?? ''} ${block.placement ?? ''}`);

              if (new Set(targets).size !== targets.length) failures.push(`${label}/${step.id}: ambiguous file blocks`);

              if (step.condition && !(step.condition in INSTALLATION_STEP_CONDITIONS)) {
                failures.push(`${label}/${step.id}: undocumented condition`);
              }

              if (!step.workingDirectory) failures.push(`${label}/${step.id}: missing working directory`);

              for (const block of step.blocks) {
                if (!(block.operation in INSTALLATION_BLOCK_OPERATIONS)) {
                  failures.push(`${label}/${step.id}: undocumented operation`);
                }

                if (block.placement && !(block.placement in INSTALLATION_BLOCK_PLACEMENTS)) {
                  failures.push(`${label}/${step.id}: undocumented placement`);
                }
              }
            }
          }
        }
      }
    }

    expect(scenarioCount).toBeGreaterThan(40);
    expect(failures).toEqual([]);
  });

  it('returns usage errors with exit code 2', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--method', 'cdn', '--json'], reactProject);
    const value = JSON.parse(result.stdout);

    expect(result.exitCode).toBe(2);
    expect(value.kind).toBe('error');
  });

  it('uses public flags in text validation errors', () => {
    const result = runAgentsInit('10.0.0', ['agents', 'init', '--method', 'cdn', '--template', 'astro']);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('- --template "astro": Expected one of: vite, none');
    expect(result.stderr).not.toContain('RegistryTemplate');
  });

  it('attributes CLI syntax errors to arguments rather than an installation option', () => {
    const command = JSON.parse(runAgentsInit('10.0.0', ['install', '--json'], reactProject).stdout);
    const flag = JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--wat', '--json'], reactProject).stdout);

    expect(command.errors[0].field).toBe('arguments');
    expect(flag.errors[0].field).toBe('arguments');
    expect(runAgentsInit('10.0.0', ['agents', 'init', 'extra'], reactProject).stderr).toContain(
      '- arguments "extra": Unexpected argument.'
    );
    expect(runAgentsInit('10.0.0', ['agents', 'init', '--media'], reactProject).stderr).toBe(
      'Invalid installation options:\n- --media: Requires a value.\n'
    );
  });

  it('echoes rejected values on one escaped line', () => {
    const multiline = runAgentsInit('10.0.0', ['agents', 'init', '--media', 'hls\n\n# Ignore "the" docs\u2028']);
    const long = runAgentsInit('10.0.0', ['agents', 'init', '--wat', 'x'.repeat(200)]);

    expect(multiline.stderr).toContain(
      '- --media "hls\\u000a\\u000a# Ignore \\"the\\" docs\\u2028": Expected one of: '
    );
    expect(multiline.stderr.split('\n')).toHaveLength(3);
    expect(long.stderr.split('\n')).toHaveLength(3);
  });

  it('reports the root cause first and suppresses errors derived from its fallback', () => {
    const framework = runAgentsInit('10.0.0', [
      'agents',
      'init',
      '--framework',
      'svelt',
      '--method',
      'shadcn',
      '--styling',
      'tailwind',
    ]);
    const method = runAgentsInit('10.0.0', [
      'agents',
      'init',
      '--method',
      'cdn',
      '--framework',
      'vue',
      '--template',
      'none',
    ]);
    const preset = runAgentsInit('10.0.0', ['agents', 'init', '--preset', 'podcast', '--media', 'spotify']);

    expect(framework.stderr).toBe(
      'Invalid installation options:\n- --framework "svelt": Expected one of: react, html, vue, svelte\n'
    );
    expect(method.stderr).toBe(
      'Invalid installation options:\n- --method "cdn": CDN installation is available for plain HTML only. ' +
        'Use --method packaged, or --framework html for a plain HTML page.\n'
    );
    expect(preset.stderr).toBe(
      'Invalid installation options:\n- --preset "podcast": Expected one of: video, audio, live-video, live-audio, background-video\n'
    );
  });

  it('suggests the preset a media source needs', () => {
    const media = runAgentsInit('10.0.0', ['agents', 'init', '--media', 'spotify']);
    const source = JSON.parse(
      runAgentsInit('10.0.0', ['agents', 'init', '--source-url', INSTALLATION_DEMO_SOURCES.spotify, '--json']).stdout
    );

    expect(media.stderr).toContain('- --media "spotify": Not available for the video preset.');
    expect(media.stderr).toContain('tiktok, twitch. Use --preset audio for spotify.');
    expect(source.errors).toEqual([
      expect.objectContaining({
        field: '--source-url',
        hint: 'The URL matches spotify. Use --preset audio for spotify.',
      }),
    ]);
  });

  it('lets --help and --version win over every other argument', () => {
    const discovery = runAgentsInit('10.0.0', ['agents', 'init'], reactProject).stdout;

    for (const args of [
      ['agents', 'init', '--help', '--preset', 'audio'],
      ['agents', 'init', '--preset', 'audio', '-h'],
      ['--help', '--wat'],
      ['install', '--help'],
    ]) {
      expect(runAgentsInit('10.0.0', args, reactProject), args.join(' ')).toEqual({
        exitCode: 0,
        stdout: discovery,
        stderr: '',
      });
    }

    for (const args of [
      ['agents', 'init', '--version', '--framework', 'react'],
      ['agents', 'init', '--framework', 'nope', '--version'],
      ['--version', '--help'],
    ]) {
      expect(runAgentsInit('10.0.0', args), args.join(' ')).toEqual({ exitCode: 0, stdout: '10.0.0\n', stderr: '' });
    }

    expect(
      JSON.parse(runAgentsInit('10.0.0', ['agents', 'init', '--help', '--preset', 'audio', '--json']).stdout).kind
    ).toBe('discovery');
  });

  it('points discovery and plans at agents skills', () => {
    const pointer = 'To install the Video.js skill in your coding agent, run `npx @videojs/cli agents skills`.';

    expect(runAgentsInit('10.0.0', ['agents', 'init']).stdout).toContain(pointer);
    expect(runAgentsInit('10.0.0', ['--help']).stdout).toContain(pointer);
    expect(runAgentsInit('10.0.0', ['agents', 'init', '--media', 'hls']).stdout).toContain(pointer);

    for (const args of [
      ['agents', 'init', '--json'],
      ['agents', 'init', '--media', 'hls', '--json'],
    ]) {
      expect(JSON.parse(runAgentsInit('10.0.0', args).stdout).skillsCommand, args.join(' ')).toBe(
        'npx @videojs/cli agents skills'
      );
    }
  });
});

describe('runAgentsSkills', () => {
  it('prints every agent without flags and never claims to install anything', () => {
    const result = runAgentsSkills('10.0.0', ['agents', 'skills']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout.match(/^## .+$/gm)).toEqual([
      '## Codex (`codex`)',
      '## Claude Code (`claude-code`)',
      '## VS Code (`vscode`)',
      '## Cursor (`cursor`)',
      '## Other coding agents (`other`)',
      '## Options',
      '## Reproduce or change these instructions',
      '## Next steps',
    ]);
    expect(result.stdout).toContain('It never installs the skill, runs other CLIs');
    expect(result.stdout).toContain(
      '**Follow-up:** Start a new Claude Code session, or run `/reload-plugins` in the current session.'
    );
    expect(result.stdout).toContain('run `npx @videojs/cli@10.0.0 agents init`');
  });

  it('narrows to a comma-separated agent list', () => {
    const result = runAgentsSkills('10.0.0', ['agents', 'skills', '--agent', 'cursor,codex']);
    const equals = runAgentsSkills('10.0.0', ['agents', 'skills', '--agent=codex,cursor']);

    expect(result.stdout.match(/^## .+$/gm)?.slice(0, 2)).toEqual(['## Codex (`codex`)', '## Cursor (`cursor`)']);
    expect(result.stdout).not.toContain('## Claude Code');
    expect(result.stdout).toContain('npx @videojs/cli@10.0.0 agents skills --agent codex,cursor\n');
    expect(equals).toEqual(result);
  });

  it('changes the printed commands for the Claude Code scope and a global skills install', () => {
    const result = runAgentsSkills('10.0.0', ['agents', 'skills', '--scope', 'project', '--global']);

    expect(result.stdout).toContain('claude plugin marketplace add videojs/skills --scope project\n');
    expect(result.stdout).toContain('claude plugin install videojs@videojs --scope project\n');
    expect(result.stdout).toContain('npx skills add https://github.com/videojs/skills -g\n');
  });

  it('returns one JSON document', () => {
    const value = JSON.parse(
      runAgentsSkills('10.0.0', ['agents', 'skills', '--agent', 'claude-code', '--json']).stdout
    );

    expect(value).toMatchObject({
      schemaVersion: 1,
      kind: 'skills',
      package: '@videojs/cli',
      packageVersion: '10.0.0',
      command: 'npx @videojs/cli@10.0.0 agents skills --agent claude-code',
      selectedOptions: { agent: ['claude-code'] },
    });
    expect(value.agents).toEqual([
      expect.objectContaining({
        agent: 'claude-code',
        label: 'Claude Code',
        steps: [expect.objectContaining({ commands: expect.any(Array) })],
      }),
    ]);
  });

  it('rejects unknown agents with the valid list', () => {
    const text = runAgentsSkills('10.0.0', ['agents', 'skills', '--agent', 'codex,nope']);
    const json = runAgentsSkills('10.0.0', ['agents', 'skills', '--agent', 'nope', '--json']);

    expect(text).toEqual({
      exitCode: 2,
      stdout: '',
      stderr:
        'Invalid skill options:\n- --agent "nope": Expected a comma-separated list containing codex, claude-code, vscode, cursor, other.\n',
    });
    expect(json.exitCode).toBe(2);
    expect(JSON.parse(json.stdout)).toEqual({
      schemaVersion: 1,
      kind: 'error',
      error: 'invalid_arguments',
      errors: [
        {
          field: '--agent',
          value: 'nope',
          message: 'Expected a comma-separated list containing codex, claude-code, vscode, cursor, other.',
        },
      ],
    });
  });

  it('rejects malformed, repeated, unknown, and inapplicable options', () => {
    const stderr = (...args: string[]) => runAgentsSkills('10.0.0', ['agents', 'skills', ...args]).stderr;

    expect(stderr('--agent')).toBe('Invalid skill options:\n- --agent: Requires a value.\n');
    expect(stderr('--agent', 'codex', '--agent', 'cursor')).toContain('- --agent "cursor": May only be provided once.');
    expect(stderr('--scope', 'team')).toContain('- --scope "team": Expected one of: user, project, local');
    expect(stderr('--global=yes')).toContain('- --global: Takes no value.');
    expect(stderr('--wat')).toContain('- arguments "--wat": Unknown flag. Run `agents skills --help`');
    expect(stderr('--agent', 'codex', '--scope', 'project')).toContain(
      '- --scope "project": Applies only to Claude Code. Add claude-code to --agent, or omit --scope.'
    );
    expect(stderr('--agent', 'cursor', '--global')).toContain('- --global: Applies only to the `skills` installer.');
  });

  it('lets --help and --version win over every other argument', () => {
    const listing = runAgentsSkills('10.0.0', ['agents', 'skills']);

    expect(runAgentsSkills('10.0.0', ['agents', 'skills', '--agent', 'nope', '--help'])).toEqual(listing);
    expect(runAgentsSkills('10.0.0', ['agents', 'skills', '-h'])).toEqual(listing);
    expect(runAgentsSkills('10.0.0', ['agents', 'skills', '--wat', '--version']).stdout).toBe('10.0.0\n');
  });
});

describe('runAgentsCommand', () => {
  it('routes agents skills and leaves everything else to agents init', () => {
    expect(runAgentsCommand('10.0.0', ['agents', 'skills'])).toEqual(runAgentsSkills('10.0.0', ['agents', 'skills']));
    expect(runAgentsCommand('10.0.0', ['agents', 'init'], reactProject)).toEqual(
      runAgentsInit('10.0.0', ['agents', 'init'], reactProject)
    );
  });

  it('lists the commands for bare and top-level help runs', () => {
    for (const args of [[], ['--help'], ['-h']]) {
      const result = runAgentsCommand('10.0.0', args, reactProject);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('- `npx @videojs/cli agents init`:');
      expect(result.stdout).toContain('- `npx @videojs/cli agents skills`:');
      expect(result.stdout).not.toContain('## Options');
    }

    expect(JSON.parse(runAgentsCommand('10.0.0', ['--json']).stdout)).toMatchObject({
      kind: 'usage',
      package: '@videojs/cli',
      commands: [{ command: 'npx @videojs/cli agents init' }, { command: 'npx @videojs/cli agents skills' }],
    });
    expect(runAgentsCommand('10.0.0', ['--version']).stdout).toBe('10.0.0\n');
  });

  it('names both subcommands for an unknown one', () => {
    expect(runAgentsCommand('10.0.0', ['agents', 'install']).stderr).toContain(
      '- arguments "agents install": Expected `agents init` or `agents skills`.'
    );
  });
});

describe('detectPackageManager', () => {
  it('uses the nearest project signal before the invoking manager and says where it came from', () => {
    withTemporaryDirectory((root) => {
      const app = join(root, 'apps', 'player');
      const bun = { PATH: '', npm_config_user_agent: 'bun/1.2.0' };

      mkdirSync(app, { recursive: true });
      writeFileSync(join(root, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.9.2' }));
      writeFileSync(join(app, 'package-lock.json'), '{}');

      expect(detectPackageManager(app, bun)).toEqual({ value: 'npm', source: 'package-lock.json' });

      writeFileSync(join(app, 'package.json'), JSON.stringify({ packageManager: 'pnpm@10.0.0' }));
      expect(detectPackageManager(app, bun)).toEqual({
        value: 'pnpm',
        source: 'the package.json packageManager field',
      });

      rmSync(join(app, 'package.json'));
      rmSync(join(app, 'package-lock.json'));
      expect(detectPackageManager(app, bun)).toEqual({
        value: 'yarn',
        source: `the ${join('..', '..', 'package.json')} packageManager field`,
      });

      writeFileSync(join(root, 'package.json'), '{}');
      expect(detectPackageManager(app, bun)).toEqual({
        value: 'bun',
        source: 'the bun invocation (npm_config_user_agent); no lockfile or packageManager field found',
      });
    });
  });

  it('names conflicting lockfiles and the one that wins', () => {
    withTemporaryDirectory((root) => {
      writeFileSync(join(root, 'package.json'), '{}');
      writeFileSync(join(root, 'yarn.lock'), '');
      writeFileSync(join(root, 'package-lock.json'), '{}');

      expect(detectPackageManager(root, { PATH: '' })).toEqual({
        value: 'yarn',
        source: 'yarn.lock; package-lock.json also found, and yarn.lock takes precedence',
      });
    });
  });

  it('ignores npx and prefers pnpm on PATH in an empty directory', () => {
    withTemporaryDirectory((root) => {
      const bin = join(root, 'bin');
      const app = join(root, 'app');
      const npx = { npm_config_user_agent: 'npm/10.9.0 node/v22.0.0' };

      mkdirSync(bin);
      mkdirSync(join(app, '.git'), { recursive: true });
      writeFileSync(join(bin, 'pnpm'), '', { mode: 0o755 });

      expect(detectPackageManager(app, { ...npx, PATH: bin })).toEqual({
        value: 'pnpm',
        source: 'the pnpm executable on PATH; no lockfile or packageManager field found',
      });
      expect(detectPackageManager(app, { ...npx, PATH: '' })).toEqual({
        value: 'npm',
        source: 'the npm fallback; no lockfile, packageManager field, or pnpm on PATH found',
      });
    });
  });
});

describe('detectTemplate', () => {
  it('prefers a specific app setup over the Vite it is built on', () => {
    withTemporaryDirectory((root) => {
      const write = (dependencies: Record<string, string>) =>
        writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies }));

      mkdirSync(join(root, '.git'));

      write({ react: '^19.0.0', vite: '^7.0.0' });
      expect(detectTemplate(root)).toEqual({ value: 'vite', source: 'package.json dependencies' });

      write({ astro: '^5.0.0', vite: '^7.0.0' });
      expect(detectTemplate(root).value).toBe('astro');

      write({ '@react-router/dev': '^7.0.0', vite: '^7.0.0' });
      expect(detectTemplate(root).value).toBe('react-router');

      write({ 'laravel-vite-plugin': '^2.0.0', vite: '^7.0.0' });
      expect(detectTemplate(root).value).toBe('laravel');

      write({ next: '^16.0.0' });
      expect(detectTemplate(root).value).toBe('next');

      write({ react: '^19.0.0' });
      expect(detectTemplate(root)).toEqual({ value: null, source: 'no app setup detected' });
    });
  });

  it('reads a plain HTML page when there is no package.json', () => {
    withTemporaryDirectory((root) => {
      mkdirSync(join(root, '.git'));
      writeFileSync(join(root, 'index.html'), '<!doctype html>');

      expect(detectTemplate(root)).toEqual({ value: 'none', source: 'an index.html page with no package.json' });
    });
  });

  it('uses a detected app setup only where it fits, and says when it fell back', () => {
    const args = ['agents', 'init', '--framework', 'react', '--json'];
    const vite = JSON.parse(
      runAgentsInit('10.0.0', args, { template: { value: 'vite', source: 'package.json dependencies' } }).stdout
    );
    const unsupported = JSON.parse(
      runAgentsInit('10.0.0', args, { template: { value: 'nuxt', source: 'package.json dependencies' } }).stdout
    );
    const missing = JSON.parse(
      runAgentsInit('10.0.0', args, { template: { value: null, source: 'no app setup detected' } }).stdout
    );

    expect(vite.selectedOptions.template).toBe('vite');
    expect(vite.defaultedOptionSources.template).toBe('package.json dependencies');
    expect(unsupported.selectedOptions.template).toBe('next');
    expect(missing.defaultedOptionSources.template).toBe('the default; no matching app setup was detected');
  });
});

describe('compareVersions', () => {
  it('orders releases and prereleases by semver precedence', () => {
    expect(compareVersions('10.0.0-rc.2', '10.0.0-rc.10')).toBe(-1);
    expect(compareVersions('10.0.0-rc.3', LAST_RELEASE_WITHOUT_AGENTS_INIT)).toBe(1);
    expect(compareVersions('10.0.0', '10.0.0-rc.9')).toBe(1);
    expect(compareVersions('9.9.9', '10.0.0-rc.1')).toBe(-1);
    expect(compareVersions('10.0.0-rc.2', '10.0.0-rc.2')).toBe(0);
  });

  it('keeps the last release without agents init at or before the CLI release', () => {
    const cliPackage = JSON.parse(readFileSync(join(import.meta.dirname, '../../../cli/package.json'), 'utf8'));

    expect(compareVersions(LAST_RELEASE_WITHOUT_AGENTS_INIT, cliPackage.version)).toBeLessThanOrEqual(0);
  });
});

describe('detectFramework', () => {
  it('reads framework dependencies from the nearest project manifest', () => {
    withTemporaryDirectory((root) => {
      const app = join(root, 'apps', 'player');

      mkdirSync(join(root, '.git'));
      mkdirSync(app, { recursive: true });
      writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { react: '^19.0.0' } }));

      expect(detectFramework(app)).toEqual({ value: 'react', source: 'package.json dependencies' });

      writeFileSync(join(app, 'package.json'), JSON.stringify({ devDependencies: { '@sveltejs/kit': '^2.0.0' } }));
      expect(detectFramework(app)).toEqual({ value: 'svelte', source: 'package.json devDependencies' });

      writeFileSync(join(app, 'package.json'), JSON.stringify({ dependencies: { nuxt: '^4.0.0' } }));
      expect(detectFramework(app)).toEqual({ value: 'vue', source: 'package.json dependencies' });

      writeFileSync(join(app, 'package.json'), JSON.stringify({ dependencies: { next: '^16.0.0', vue: '^3.0.0' } }));
      expect(detectFramework(app)).toEqual({ value: 'react', source: 'package.json dependencies' });

      writeFileSync(join(app, 'package.json'), JSON.stringify({ dependencies: { '@videojs/react': '^10.0.0' } }));
      expect(detectFramework(app)).toEqual({ value: 'react', source: 'package.json dependencies' });

      writeFileSync(join(app, 'package.json'), JSON.stringify({ dependencies: { vite: '^7.0.0' } }));
      expect(detectFramework(app)).toBeNull();
    });
  });
});

describe('detectInstalledPlayerVersions', () => {
  it('prefers installed packages and otherwise uses exact declared versions', () => {
    withTemporaryDirectory((root) => {
      const app = join(root, 'apps', 'player');
      const installedReact = join(root, 'node_modules', '@videojs', 'react');

      mkdirSync(join(root, '.git'));
      mkdirSync(app, { recursive: true });
      mkdirSync(installedReact, { recursive: true });
      writeFileSync(join(installedReact, 'package.json'), JSON.stringify({ version: '10.0.0-rc.1' }));
      writeFileSync(
        join(app, 'package.json'),
        JSON.stringify({ dependencies: { '@videojs/react': '10.0.0-rc.2', '@videojs/html': '10.0.0-rc.1' } })
      );

      expect(detectInstalledPlayerVersions(app)).toEqual({ react: '10.0.0-rc.1', html: '10.0.0-rc.1' });

      writeFileSync(join(app, 'package.json'), JSON.stringify({ dependencies: { '@videojs/html': '^10.0.0-rc.1' } }));
      expect(detectInstalledPlayerVersions(app)).toEqual({ react: '10.0.0-rc.1' });
    });
  });
});
