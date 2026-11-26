import type { InstallationProject, PackageManager } from './parameters';
import { getInstallationPlayerComponentName, type UseCase } from './presets';
import type { RegistryFramework } from './shadcn';

export const INSTALLATION_FRAMEWORKS = ['react', 'html', 'vue', 'svelte'] as const;
export type InstallationFramework = (typeof INSTALLATION_FRAMEWORKS)[number];

export const INSTALLATION_TEMPLATES = [
  'none',
  'next',
  'vite',
  'start',
  'react-router',
  'astro',
  'laravel',
  'nuxt',
  'sveltekit',
] as const;
export type InstallationTemplate = (typeof INSTALLATION_TEMPLATES)[number];

export const INSTALLATION_TEMPLATE_LABELS = {
  none: 'Existing site',
  next: 'Next.js',
  vite: 'Vite',
  start: 'TanStack Start',
  'react-router': 'React Router',
  astro: 'Astro',
  laravel: 'Laravel',
  nuxt: 'Nuxt',
  sveltekit: 'SvelteKit',
} as const satisfies Record<InstallationTemplate, string>;

const TEMPLATES_BY_FRAMEWORK = {
  react: ['next', 'vite', 'start', 'react-router', 'astro', 'laravel'],
  html: ['vite', 'astro', 'laravel', 'none'],
  vue: ['vite', 'astro', 'nuxt'],
  svelte: ['vite', 'astro', 'sveltekit'],
} as const satisfies Record<InstallationFramework, readonly InstallationTemplate[]>;

/** The directory Laravel and Shadcn app scaffolds create; every other scaffold writes into the current directory. */
export const INSTALLATION_NEW_APP_DIRECTORY = 'videojs-app';

export interface InstallationProjectFiles {
  componentsAlias: string;
  componentsDirectory: string;
  player: string;
  playerImport?: string;
  usage?: string;
  config?: string;
}

export interface InstallationProjectSetupBlock {
  code: string;
  filename: string;
  language: 'js' | 'json' | 'ts';
}

function includes<const Values extends readonly string[]>(values: Values, value: string): value is Values[number] {
  return values.includes(value);
}

export function installationTemplates(framework: InstallationFramework): readonly InstallationTemplate[] {
  return TEMPLATES_BY_FRAMEWORK[framework];
}

export function isInstallationTemplate(value: string | null | undefined): value is InstallationTemplate {
  return value != null && includes(INSTALLATION_TEMPLATES, value);
}

export function defaultInstallationTemplate(framework: InstallationFramework): InstallationTemplate {
  return framework === 'react' ? 'next' : 'vite';
}

export function resolveInstallationTemplate(
  framework: InstallationFramework,
  template: InstallationTemplate | null
): InstallationTemplate {
  const templates = installationTemplates(framework);

  return template && includes(templates, template) ? template : defaultInstallationTemplate(framework);
}

export function installationProjectFiles(
  framework: InstallationFramework,
  template: InstallationTemplate,
  useCase: UseCase = 'default-video'
): InstallationProjectFiles {
  const playerComponent = getInstallationPlayerComponentName(useCase);

  if (framework === 'react') {
    if (template === 'next') {
      return {
        componentsAlias: '@/components',
        componentsDirectory: 'components',
        player: 'app/page.tsx',
      };
    }

    if (template === 'start') {
      return {
        componentsAlias: '@/components',
        componentsDirectory: 'src/components',
        player: 'src/routes/index.tsx',
      };
    }

    if (template === 'react-router') {
      return {
        componentsAlias: '~/components',
        componentsDirectory: 'app/components',
        player: 'app/routes/home.tsx',
      };
    }

    if (template === 'astro') {
      return {
        componentsAlias: '@/components',
        componentsDirectory: 'src/components',
        player: 'src/components/VideoPlayer.tsx',
        usage: 'src/pages/index.astro',
      };
    }

    if (template === 'laravel') {
      return {
        componentsAlias: '@/components',
        componentsDirectory: 'resources/js/components',
        player: 'resources/js/pages/welcome.tsx',
      };
    }

    return {
      componentsAlias: '@/components',
      componentsDirectory: 'src/components',
      player: 'src/App.tsx',
    };
  }

  if (framework === 'vue') {
    if (template === 'nuxt') {
      return {
        componentsAlias: '@/components',
        componentsDirectory: 'app/components',
        player: `app/components/${playerComponent}.client.vue`,
        playerImport: '#components',
        usage: 'app/app.vue',
        config: 'nuxt.config.ts',
      };
    }

    if (template === 'astro') {
      return {
        componentsAlias: '@/components',
        componentsDirectory: 'src/components',
        player: `src/components/${playerComponent}.vue`,
        playerImport: `../components/${playerComponent}.vue`,
        usage: 'src/pages/index.astro',
        config: 'astro.config.mjs',
      };
    }

    return {
      componentsAlias: '@/components',
      componentsDirectory: 'src/components',
      player: `src/components/${playerComponent}.vue`,
      playerImport: `./components/${playerComponent}.vue`,
      usage: 'src/App.vue',
      config: 'vite.config.ts',
    };
  }

  if (framework === 'svelte') {
    if (template === 'astro') {
      return {
        componentsAlias: '@/components',
        componentsDirectory: 'src/components',
        player: `src/components/${playerComponent}.svelte`,
        playerImport: `../components/${playerComponent}.svelte`,
        usage: 'src/pages/index.astro',
      };
    }

    return template === 'sveltekit'
      ? {
          componentsAlias: '#lib/components',
          componentsDirectory: 'src/lib/components',
          player: `src/lib/${playerComponent}.svelte`,
          usage: 'src/routes/+page.svelte',
        }
      : {
          componentsAlias: '$lib/components',
          componentsDirectory: 'src/lib/components',
          player: `src/lib/${playerComponent}.svelte`,
          usage: 'src/App.svelte',
        };
  }

  if (template === 'none') {
    return {
      componentsAlias: '@/components',
      componentsDirectory: 'components',
      player: 'index.html',
      usage: 'player.ts',
    };
  }

  if (template === 'astro') {
    return {
      componentsAlias: '@/components',
      componentsDirectory: 'src/components',
      player: 'src/pages/index.astro',
      usage: 'src/scripts/player.ts',
    };
  }

  if (template === 'laravel') {
    return {
      componentsAlias: '@/components',
      componentsDirectory: 'resources/js/components',
      player: 'resources/views/welcome.blade.php',
      usage: 'resources/js/player.ts',
    };
  }

  return {
    componentsAlias: '@/components',
    componentsDirectory: 'src/components',
    player: 'index.html',
    usage: 'src/player.ts',
  };
}

/** Alias configuration needed before a hand-authored Shadcn config can resolve a fresh app's component paths. */
export function installationProjectAliasSetup(
  framework: RegistryFramework,
  template: InstallationTemplate
): readonly InstallationProjectSetupBlock[] {
  if (!['vite', 'astro', 'laravel'].includes(template)) return [];

  const sourceRoot = template === 'laravel' ? './resources/js' : './src';
  const sourceDirectory = `${sourceRoot}/*`;
  const tsconfigCode = JSON.stringify(
    {
      compilerOptions: {
        paths: { '@/*': [sourceDirectory] },
      },
    },
    null,
    2
  );
  const tsconfigs =
    template === 'vite' && framework !== 'html' ? ['tsconfig.json', 'tsconfig.app.json'] : ['tsconfig.json'];
  const blocks: InstallationProjectSetupBlock[] = tsconfigs.map((filename) => ({
    code: tsconfigCode,
    filename,
    language: 'json',
  }));

  if (template === 'laravel') {
    blocks.push({
      code: `import path from 'node:path';

export default defineConfig({
  // Keep the existing Laravel plugin and options.
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './resources/js'),
    },
  },
});`,
      filename: 'vite.config.js',
      language: 'js',
    });
  }

  if (template !== 'vite') return blocks;

  const pluginImport = framework === 'react' ? "import react from '@vitejs/plugin-react';" : '';
  const plugins = framework === 'react' ? '  plugins: [react()],\n' : '';
  const aliasDirectory = sourceRoot;

  blocks.push({
    code: `${pluginImport ? `${pluginImport}\n` : ''}import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
${plugins}  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '${aliasDirectory}'),
    },
  },
});`,
    filename: 'vite.config.ts',
    language: 'ts',
  });

  return blocks;
}

/** Build configuration needed to expose a generated HTML entry module. */
export function installationHtmlEntrySetup(
  template: InstallationTemplate,
  entryFile: string
): readonly InstallationProjectSetupBlock[] {
  if (template !== 'laravel') return [];

  return [
    {
      code: `laravel({
  input: [
    // Keep the existing entries.
    '${entryFile}',
  ],
  refresh: true,
})`,
      filename: 'vite.config.js',
      language: 'js',
    },
  ];
}

function packageRunner(packageManager: PackageManager, executable: string): string {
  if (packageManager === 'pnpm') return `pnpm dlx ${executable}`;

  if (packageManager === 'yarn') return `npx ${executable}`;

  if (packageManager === 'bun') return `bunx --bun ${executable}`;

  return `npx ${executable}`;
}

function viteCreateCommand(framework: InstallationFramework, packageManager: PackageManager): string {
  const template = framework === 'html' ? 'vanilla-ts' : `${framework}-ts`;
  const install = `${packageManager} install`;

  if (packageManager === 'npm') {
    return `npm create vite@latest . -- --template ${template} --no-interactive\n${install}`;
  }

  if (packageManager === 'pnpm') return `pnpm create vite . --template ${template} --no-interactive\n${install}`;

  if (packageManager === 'yarn') return `yarn create vite . --template ${template} --no-interactive\n${install}`;

  return `bun create vite . --template ${template} --no-interactive\n${install}`;
}

/** A current official app scaffold for an empty directory. Existing apps skip this command. */
export function installationProjectCreateCommand(
  framework: InstallationFramework,
  template: InstallationTemplate,
  packageManager: PackageManager
): string | null {
  if (template === 'none') return null;

  if (template === 'vite') return viteCreateCommand(framework, packageManager);

  if (template === 'next') {
    const usePackageManager = `--use-${packageManager}`;
    const options = `--ts --eslint --app --no-src-dir --import-alias "@/*" ${usePackageManager} --yes`;

    if (packageManager === 'pnpm') return `pnpm create next-app . ${options}`;

    if (packageManager === 'yarn') return `yarn create next-app . ${options}`;

    if (packageManager === 'bun') return `bun create next-app . ${options}`;

    return `npx create-next-app@latest . ${options}`;
  }

  if (template === 'start') {
    return `${packageRunner(packageManager, '@tanstack/cli')} create . --framework React --package-manager ${packageManager} --blank -y`;
  }

  if (template === 'react-router') {
    return `${packageRunner(packageManager, 'create-react-router@latest')} . --package-manager ${packageManager} --yes --no-git-init`;
  }

  if (template === 'astro') {
    const addIntegration = framework === 'html' ? '' : ` --add ${framework}`;

    if (packageManager === 'npm') {
      return `npm create astro@latest . -- --template minimal${addIntegration} --yes --no-git`;
    }

    if (packageManager === 'pnpm') {
      return `pnpm create astro@latest . --template minimal${addIntegration} --yes --no-git`;
    }

    if (packageManager === 'yarn') {
      return `yarn create astro . --template minimal${addIntegration} --yes --no-git`;
    }

    return `bun create astro . --template minimal${addIntegration} --yes --no-git`;
  }

  if (template === 'laravel') {
    const starter = framework === 'react' ? ' --react' : '';
    const usePackageManager = packageManager === 'npm' ? '' : ` --${packageManager}`;

    return `laravel new ${INSTALLATION_NEW_APP_DIRECTORY}${starter}${usePackageManager} --no-interaction\ncd ${INSTALLATION_NEW_APP_DIRECTORY}`;
  }

  if (template === 'nuxt') {
    const options = `--template minimal --packageManager ${packageManager} --no-gitInit --no-modules`;

    if (packageManager === 'npm') return `npm create nuxt@latest . -- ${options}`;

    if (packageManager === 'pnpm') return `pnpm create nuxt@latest . ${options}`;

    if (packageManager === 'yarn') return `yarn create nuxt . ${options}`;

    return `bun create nuxt@latest . ${options}`;
  }

  return `${packageRunner(packageManager, 'sv')} create --template minimal --types ts --no-add-ons --install ${packageManager} .`;
}

export function installationProjectRunCommand(
  template: InstallationTemplate,
  packageManager: PackageManager
): string | null {
  if (template === 'none') return null;

  if (template === 'laravel') return 'composer run dev';

  if (packageManager === 'npm') return 'npm run dev';

  if (packageManager === 'pnpm') return 'pnpm dev';

  if (packageManager === 'yarn') return 'yarn dev';

  return 'bun run dev';
}

/** Connect an HTML page to the generated local entry module for its app setup. */
export function installationHtmlPageCode(markup: string, template: InstallationTemplate, entryFile: string): string {
  if (template === 'laravel') return `${markup}\n\n@vite('${entryFile}')`;

  if (template === 'astro') {
    const source = `../${entryFile.replace(/^src\//, '')}`;

    return `${markup}\n\n<script src="${source}"></script>`;
  }

  if (template === 'none') {
    const bundle = `/dist/${entryFile.replace(/\.ts$/, '.js')}`;

    return `${markup}\n\n<!-- Load the module your build outputs for ${entryFile}. -->\n<script type="module" src="${bundle}"></script>`;
  }

  return `${markup}\n\n<script type="module" src="/${entryFile}"></script>`;
}

function indentLines(value: string, indent: string): string {
  return value
    .split('\n')
    .map((line) => (line ? `${indent}${line}` : line))
    .join('\n');
}

/** A complete page for a new app, which replaces the scaffold's starter page instead of merging into it. */
export function installationHtmlDocumentCode(body: string, head = ''): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Video.js</title>${head ? `\n${indentLines(head, '    ')}` : ''}
  </head>
  <body>
${indentLines(body, '    ')}
  </body>
</html>`;
}

/**
 * The HTML page that renders the player: a complete document that replaces a new app's starter page, or the markup and
 * entry script to merge into an existing page.
 */
export function installationHtmlPlayerPageCode(
  markup: string,
  template: InstallationTemplate,
  entryFile: string,
  project: InstallationProject
): string {
  const page = installationHtmlPageCode(markup, template, entryFile);

  return project === 'new' ? installationHtmlDocumentCode(page) : page;
}

/** Scaffold files a new app no longer uses once the generated files replace its starter page. */
export function installationStarterFiles(
  framework: InstallationFramework,
  template: InstallationTemplate
): readonly string[] {
  if (template !== 'vite') return [];

  // create-vite's demo page imports these assets and the `public/icons.svg` sprite; nothing uses them once the player
  // replaces that page.
  const assets = ['src/assets/hero.png', 'src/assets/vite.svg', 'public/icons.svg'];

  if (framework === 'html')
    return ['src/main.ts', 'src/counter.ts', 'src/style.css', 'src/assets/typescript.svg', ...assets];

  if (framework === 'react') return ['src/App.css', 'src/assets/react.svg', ...assets];

  return framework === 'vue'
    ? ['src/components/HelloWorld.vue', 'src/assets/vue.svg', ...assets]
    : ['src/lib/Counter.svelte', 'src/assets/svelte.svg', ...assets];
}

export function installationVueConfigFilename(
  template: InstallationTemplate
): 'astro.config.mjs' | 'nuxt.config.ts' | 'vite.config.ts' {
  if (template === 'astro') return 'astro.config.mjs';

  return template === 'nuxt' ? 'nuxt.config.ts' : 'vite.config.ts';
}

export function installationReactPlayerCode(code: string, template: InstallationTemplate): string {
  if (template === 'next') return code;

  if (template === 'vite') return code.replace('function Page()', 'function App()');

  if (template === 'start') {
    return `import { createFileRoute } from '@tanstack/react-router';
${code.replace('export default function Page()', 'function Page()')}

export const Route = createFileRoute('/')({ component: Page });`;
  }

  if (template === 'astro') return code.replace('function Page()', 'function Player()');

  return code;
}

export function installationReactUsageCode(template: InstallationTemplate): string | null {
  if (template !== 'astro') return null;

  return `---
import VideoPlayer from '../components/VideoPlayer';
---

<VideoPlayer client:load />`;
}
