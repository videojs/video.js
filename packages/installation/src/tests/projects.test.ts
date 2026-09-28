import { describe, expect, it } from 'vite-plus/test';

import {
  installationHtmlDocumentCode,
  installationHtmlPageCode,
  installationHtmlEntrySetup,
  installationHtmlPlayerPageCode,
  installationProjectCreateCommand,
  installationProjectFiles,
  installationProjectAliasSetup,
  installationProjectRunCommand,
  installationReactPlayerCode,
  installationStarterFiles,
} from '../projects';

describe('installationProjectFiles', () => {
  it('maps app setups to files the framework actually renders', () => {
    expect(installationProjectFiles('react', 'next').player).toBe('app/page.tsx');
    expect(installationProjectFiles('react', 'vite').player).toBe('src/App.tsx');
    expect(installationProjectFiles('react', 'start').player).toBe('src/routes/index.tsx');
    expect(installationProjectFiles('vue', 'nuxt')).toMatchObject({
      config: 'nuxt.config.ts',
      player: 'app/components/VideoPlayer.client.vue',
      playerImport: '#components',
      usage: 'app/app.vue',
    });
    expect(installationProjectFiles('vue', 'astro')).toMatchObject({
      config: 'astro.config.mjs',
      player: 'src/components/VideoPlayer.vue',
      playerImport: '../components/VideoPlayer.vue',
      usage: 'src/pages/index.astro',
    });
    expect(installationProjectFiles('svelte', 'sveltekit')).toMatchObject({
      componentsAlias: '#lib/components',
      player: 'src/lib/VideoPlayer.svelte',
      usage: 'src/routes/+page.svelte',
    });
    expect(installationProjectFiles('svelte', 'astro')).toMatchObject({
      componentsAlias: '@/components',
      player: 'src/components/VideoPlayer.svelte',
      playerImport: '../components/VideoPlayer.svelte',
      usage: 'src/pages/index.astro',
    });
    expect(installationProjectFiles('html', 'none')).toMatchObject({
      player: 'index.html',
      usage: 'player.ts',
    });
    expect(installationProjectFiles('vue', 'vite', 'live-audio').player).toBe('src/components/LiveAudioPlayer.vue');
    expect(installationProjectFiles('svelte', 'sveltekit', 'background-video').player).toBe(
      'src/lib/BackgroundVideoPlayer.svelte'
    );
  });
});

describe('installationProjectCreateCommand', () => {
  it('uses the selected package manager and official app scaffold', () => {
    expect(installationProjectCreateCommand('react', 'vite', 'pnpm')).toBe(
      'pnpm create vite . --template react-ts --no-interactive\npnpm install'
    );
    expect(installationProjectCreateCommand('vue', 'nuxt', 'npm')).toBe(
      'npm create nuxt@latest . -- --template minimal --packageManager npm --no-gitInit --no-modules'
    );
    expect(installationProjectCreateCommand('svelte', 'sveltekit', 'pnpm')).toBe(
      'pnpm dlx sv create --template minimal --types ts --no-add-ons --install pnpm .'
    );
    expect(installationProjectCreateCommand('vue', 'astro', 'pnpm')).toContain('--add vue');
    expect(installationProjectCreateCommand('svelte', 'astro', 'pnpm')).toContain('--add svelte');
    expect(installationProjectCreateCommand('react', 'next', 'pnpm')).toContain('--no-src-dir --import-alias "@/*"');
    expect(installationProjectCreateCommand('react', 'laravel', 'pnpm')).toBe(
      'laravel new videojs-app --react --pnpm --no-interaction\ncd videojs-app'
    );
    expect(installationProjectRunCommand('vite', 'pnpm')).toBe('pnpm dev');
    expect(installationProjectRunCommand('laravel', 'pnpm')).toBe('composer run dev');
    expect(installationProjectCreateCommand('html', 'none', 'pnpm')).toBeNull();
    expect(installationProjectRunCommand('none', 'pnpm')).toBeNull();
  });
});

describe('installationProjectAliasSetup', () => {
  it('configures aliases for app scaffolds that do not provide them', () => {
    expect(installationProjectAliasSetup('react', 'vite')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ filename: 'tsconfig.json', code: expect.stringContaining('"@/*"') }),
        expect.objectContaining({ filename: 'tsconfig.app.json', code: expect.stringContaining('"@/*"') }),
        expect.objectContaining({ filename: 'vite.config.ts', code: expect.stringContaining("'@': path.resolve") }),
      ])
    );
    expect(installationProjectAliasSetup('html', 'astro')[0]?.code).toContain('"@/*"');
    expect(installationProjectAliasSetup('html', 'laravel')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ filename: 'tsconfig.json', code: expect.stringContaining('./resources/js/*') }),
        expect.objectContaining({ filename: 'vite.config.js', code: expect.stringContaining("'@': path.resolve") }),
      ])
    );
    expect(installationProjectAliasSetup('react', 'vite').every(({ code }) => !code.includes('baseUrl'))).toBe(true);
    expect(installationProjectAliasSetup('react', 'next')).toEqual([]);
  });
});

describe('installationHtmlEntrySetup', () => {
  it('adds the generated Laravel entry to the existing Vite inputs', () => {
    expect(installationHtmlEntrySetup('laravel', 'resources/js/player.ts')).toEqual([
      expect.objectContaining({
        filename: 'vite.config.js',
        language: 'js',
        code: expect.stringContaining("'resources/js/player.ts'"),
      }),
    ]);
    expect(installationHtmlEntrySetup('vite', 'src/player.ts')).toEqual([]);
  });
});

describe('installationHtmlPageCode', () => {
  it('connects the generated entry using each app setup convention', () => {
    expect(installationHtmlPageCode('<video-player />', 'vite', 'src/player.ts')).toContain(
      '<script type="module" src="/src/player.ts"></script>'
    );
    expect(installationHtmlPageCode('<video-player />', 'astro', 'src/scripts/player.ts')).toContain(
      '<script src="../scripts/player.ts"></script>'
    );
    expect(installationHtmlPageCode('<video-player />', 'laravel', 'resources/js/player.ts')).toContain(
      "@vite('resources/js/player.ts')"
    );
  });

  it('loads the built module for an existing site instead of TypeScript source', () => {
    const page = installationHtmlPageCode('<video-player />', 'none', 'player.ts');

    expect(page).toContain('<script type="module" src="/dist/player.js"></script>');
    expect(page).not.toContain('src="/player.ts"');
  });
});

describe('installationReactPlayerCode', () => {
  it('wraps a TanStack Start page in a file route', () => {
    const result = installationReactPlayerCode('export default function Page() {\n  return <p>Player</p>;\n}', 'start');

    expect(result).toContain("import { createFileRoute } from '@tanstack/react-router';");
    expect(result).toContain("export const Route = createFileRoute('/')({ component: Page });");
    expect(result).not.toContain('export default function Page');
  });
});

describe('installationHtmlDocumentCode', () => {
  it('places head content and the page body in a complete document', () => {
    const page = installationHtmlDocumentCode('<video-player>\n</video-player>', '<script type="module"></script>');

    expect(page).toMatch(/^<!doctype html>\n<html lang="en">/);
    expect(page).toContain('    <title>Video.js</title>\n    <script type="module"></script>\n  </head>');
    expect(page).toContain('  <body>\n    <video-player>\n    </video-player>\n  </body>');
  });
});

describe('installationHtmlPlayerPageCode', () => {
  it('replaces a new app page with a complete document and merges into an existing one', () => {
    const page = installationHtmlPageCode('<video-player></video-player>', 'vite', 'src/player.ts');

    expect(installationHtmlPlayerPageCode('<video-player></video-player>', 'vite', 'src/player.ts', 'existing')).toBe(
      page
    );
    expect(installationHtmlPlayerPageCode('<video-player></video-player>', 'vite', 'src/player.ts', 'new')).toBe(
      installationHtmlDocumentCode(page)
    );
  });
});

describe('installationStarterFiles', () => {
  it('lists the Vite starter files a replaced starter page leaves unused', () => {
    expect(installationStarterFiles('html', 'vite')).toContain('src/main.ts');
    expect(installationStarterFiles('react', 'vite')).toEqual(['src/App.css']);
    expect(installationStarterFiles('react', 'next')).toEqual([]);
  });
});
