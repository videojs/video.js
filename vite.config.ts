import { defineConfig } from 'vite-plus';

const ignoredPaths = [
  '**/.astro/**',
  '**/.netlify/**',
  '**/.pnpm-store/**',
  '**/.vercel/**',
  '**/.vite/**',
  '**/.next/**',
  '**/.agents/**',
  '**/.claude/**',
  '**/.vite-hooks/**',
  '**/.opencode/**',
  '**/.github/**',
  '**/*.md',
  '**/*.mdx',
  '**/*.toml',
  '**/build/AGENTS.md',
  '**/build/agents/**',
  '**/dist/**',
  '**/examples/**',
  'site/scripts/api-docs-builder/src/tests/fixtures/**',
  '**/packages/cdn/*.css',
  '**/packages/cdn/*.d.ts',
  '**/packages/cdn/*.js',
  '**/packages/cdn/*.js.map',
  '**/packages/cdn/archive/**',
  '**/packages/cdn/chunks/**',
  '**/packages/cdn/extensions/**',
  '**/packages/cdn/locales/**',
  '**/packages/cdn/media/**',
  '**/packages/cdn/src/locales/**',
  '**/styles/vjs.css',
  '**/packages/*/types/**',
  '**/packages/adapters/*/types/**',
  '**/packages/extensions/*/types/**',
  'packages/core/src/core/ui/components.generated.ts',
  'tools/oxlint/anti-slop/**',
  'tools/oxlint/videojs/**',
];

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  fmt: {
    arrowParens: 'always',
    bracketSpacing: true,
    ignorePatterns: ignoredPaths,
    jsdoc: true,
    printWidth: 120,
    semi: true,
    singleQuote: true,
    sortImports: true,
    sortPackageJson: true,
    sortTailwindcss: true,
    tabWidth: 2,
    trailingComma: 'es5',
    useTabs: false,
    overrides: [
      {
        files: ['**/*.astro'],
        options: {
          sortTailwindcss: {
            stylesheet: './site/src/styles/globals.css',
            functions: ['clsx'],
          },
        },
      },
      {
        files: ['**/*.css'],
        options: {
          singleQuote: false,
        },
      },
    ],
  },
  lint: {
    ignorePatterns: ignoredPaths,
    jsPlugins: [
      { name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts' },
      { name: 'videojs', specifier: './tools/oxlint/videojs/index.ts' },
    ],
    plugins: ['typescript', 'react'],
    options: {
      typeAware: false,
      typeCheck: false,
    },
    rules: {
      // Baseline the vendored preset as warnings while the existing codebase is migrated incrementally.
      'anti-slop/no-chained-type-assertions': 'warn',
      'anti-slop/no-conditional-empty-object-spread': 'warn',
      'anti-slop/no-known-value-widening': 'warn',
      'anti-slop/no-module-mocking': 'warn',
      'anti-slop/no-object-parameters': 'warn',
      'anti-slop/padding-line-between-statements': 'error',
      'anti-slop/no-reflect-apply': 'warn',
      'anti-slop/no-reflect-get': 'warn',
      'anti-slop/no-runtime-typeof': 'warn',
      'anti-slop/no-shape-in-symbol-names': 'warn',
      'anti-slop/no-unknown-parameters': 'warn',
      'anti-slop/no-unknown-returns': 'warn',
      'anti-slop/no-unknown-type-aliases': 'warn',
      'anti-slop/no-unsafe-dictionary-type': 'warn',
      'anti-slop/no-widen-then-assert': 'warn',
      'anti-slop/require-safety-comment-for-type-assertion': 'warn',
      'array-callback-return': 'off',
      'no-cond-assign': 'off',
      'no-unused-vars': [
        'warn',
        {
          args: 'none',
          fix: { imports: 'safe-fix', variables: 'off' },
        },
      ],
      'prefer-rest-params': 'off',
      'react/exhaustive-deps': 'warn',
      'react/jsx-no-useless-fragment': 'warn',
      'react/no-unknown-property': ['error', { ignore: ['corner-shape'] }],
      'typescript/no-confusing-void-expression': 'off',
      'typescript/no-explicit-any': 'off',
      'typescript/no-namespace': 'off',
      'typescript/no-non-null-assertion': 'off',
      'unicorn/no-document-cookie': 'off',
      'unicorn/no-thenable': 'off',
    },
    overrides: [
      {
        files: ['site/src/**'],
        excludeFiles: ['site/src/utils/twMerge.ts'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              paths: [
                {
                  name: 'tailwind-merge',
                  message: "Use '@/utils/twMerge' instead — it's configured for our custom theme.",
                },
              ],
            },
          ],
        },
      },
      {
        // Cores are mutated during render and read back with getState(). React Compiler only tracks the inputs when
        // both happen in the same component; a core mutated in one component and read in another memoises stale state.
        files: ['packages/react/src/**'],
        excludeFiles: ['packages/react/src/**/tests/**', 'packages/react/src/testing/**'],
        rules: {
          'videojs/no-orphan-core-mutation': 'error',
        },
      },
      {
        files: ['**/*.astro'],
        rules: {
          'no-unused-vars': 'off',
          'prefer-const': 'off',
          'typescript/consistent-type-imports': 'off',
        },
      },
      {
        files: ['build/plugins/tests/**'],
        rules: {
          'no-template-curly-in-string': 'off',
        },
      },
    ],
  },
  run: {
    cache: {
      scripts: true,
      tasks: true,
    },
    tasks: {
      'prepare:dev': {
        command: 'node -e ""',
        cache: false,
        dependsOn: ['site#api-docs:generate', '@videojs/sandbox#setup', '@videojs/skins#generate'],
      },
      'typecheck:workspace': {
        command: 'tsgo --build',
        cache: false,
        // The E2E suites are not project references, so type-check them as a task alongside the build graph.
        dependsOn: ['@videojs/skins#generate', '@videojs/e2e#typecheck'],
      },
    },
  },
  staged: {
    'packages/icons/src/assets/**/*.svg': 'node --import tsx packages/icons/scripts/format-icons.ts',
    '*': 'vp check --fix --no-error-on-unmatched-pattern',
  },
});
