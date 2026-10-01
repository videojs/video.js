import {
  installationTemplatesForMethod,
  type InstallationFramework,
  type InstallationMethod,
} from '@videojs/installation';
import { describe, expect, it } from 'vite-plus/test';

import {
  renderInstallationMarkdownSelection,
  replaceInstallationMarkdownPlan,
  resolveInstallationMarkdownPlan,
  selectInstallationFramework,
} from '../markdown';

describe('resolveInstallationMarkdownPlan', () => {
  it.each([
    ['react', 'react', 'packaged'],
    ['html', 'html', 'packaged'],
    ['vue', 'vue', 'packaged'],
    ['svelte', 'svelte', 'packaged'],
    ['cdn', 'html', 'cdn'],
    ['shadcn', 'react', 'shadcn'],
  ])('renders defaults for the %s guide', (route, framework, method) => {
    const result = resolveInstallationMarkdownPlan(
      `/docs/guides/installation/${route}`,
      new URLSearchParams(),
      '10.0.0-test'
    );

    expect(result?.ok && result.plan.selection.framework).toBe(framework);
    expect(result?.ok && result.plan.selection.method).toBe(method);
    expect(result?.ok && result.plan.selection.project).toBe('existing');
    expect(result?.ok && result.plan.steps.length).toBeGreaterThan(0);
  });

  it('treats an empty Shadcn framework query as the default', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/shadcn.md',
      new URLSearchParams('framework='),
      '10.0.0-test'
    );

    expect(result?.ok).toBe(true);
    expect(result?.ok && result.plan.selection.framework).toBe('react');
  });

  it('applies every Shadcn query choice through the shared schema', () => {
    const params = new URLSearchParams({
      framework: 'html',
      project: 'new',
      preset: 'audio',
      skin: 'neutral',
      media: 'mux-audio',
      extensions: 'mux-data',
      'source-url': 'https://stream.mux.com/example.m3u8',
      'package-manager': 'pnpm',
      template: 'vite',
      styling: 'css',
    });
    const result = resolveInstallationMarkdownPlan('/docs/guides/installation/shadcn.md', params, '10.0.0-test');

    expect(result?.ok && result.plan.selection).toMatchObject({
      framework: 'html',
      project: 'new',
      sourceFramework: 'html',
      preset: 'audio',
      skinFlag: 'neutral',
      media: 'mux-audio',
      extensions: ['mux-data'],
      packageManager: 'pnpm',
      template: 'vite',
      styling: 'css',
    });
  });

  it('renders the selected project starting point', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/vue.md',
      new URLSearchParams({ project: 'new', template: 'nuxt' }),
      '10.0.0-test'
    );

    expect(result?.ok && result.plan.selection).toMatchObject({ project: 'new', template: 'nuxt' });
    expect(result?.ok && result.plan.reproduceCommand).toContain('--project new');
    expect(result?.ok && result.plan.reproduceCommand).toMatch(
      /^npx @videojs\/cli agents init --method packaged --framework vue /
    );
    expect(result?.ok && result.plan.steps[0]).toMatchObject({ title: 'Create the app' });
  });

  it('accepts a packaged TanStack Start selection on the React Markdown guide', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/react.md',
      new URLSearchParams({ template: 'start' }),
      '10.0.0-test'
    );

    expect(result).toMatchObject({
      ok: true,
      plan: { selection: { framework: 'react', method: 'packaged', template: 'start' } },
    });
  });

  const routeSelections = [
    { route: 'react', framework: 'react', method: 'packaged' },
    { route: 'html', framework: 'html', method: 'packaged' },
    { route: 'vue', framework: 'vue', method: 'packaged' },
    { route: 'svelte', framework: 'svelte', method: 'packaged' },
    { route: 'cdn', framework: 'html', method: 'cdn' },
    { route: 'shadcn', framework: 'react', method: 'shadcn' },
    { route: 'shadcn', framework: 'html', method: 'shadcn' },
  ] as const satisfies readonly {
    route: string;
    framework: InstallationFramework;
    method: InstallationMethod;
  }[];

  for (const { route, framework, method } of routeSelections) {
    for (const template of installationTemplatesForMethod(framework, method)) {
      // CDN adds the player to an existing page or scaffolds a new Vite app, never an existing Vite app.
      const projects =
        template === 'none'
          ? (['existing'] as const)
          : method === 'cdn'
            ? (['new'] as const)
            : (['new', 'existing'] as const);

      for (const project of projects) {
        it(`accepts ${route}/${framework}/${method}/${template}/${project}`, () => {
          const params = new URLSearchParams({ project, template });

          if (route === 'shadcn') params.set('framework', framework);

          const result = resolveInstallationMarkdownPlan(
            `/docs/guides/installation/${route}.md`,
            params,
            '10.0.0-test'
          );

          expect(result).toMatchObject({
            ok: true,
            plan: { selection: { framework, method, project, template } },
          });
        });
      }
    }
  }

  it('rejects an unknown Shadcn framework', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/shadcn.md',
      new URLSearchParams({ framework: 'angular' }),
      '10.0.0-test'
    );

    expect(result?.ok).toBe(false);
    expect(result && !result.ok && result.errors).toContainEqual(
      expect.objectContaining({ field: 'framework', value: 'angular' })
    );
  });

  it('rejects a Vue or Svelte Shadcn query with the packaged alternative', () => {
    for (const framework of ['vue', 'svelte']) {
      const result = resolveInstallationMarkdownPlan(
        '/docs/guides/installation/shadcn.md',
        new URLSearchParams({ framework }),
        '10.0.0-test'
      );

      expect(result).toMatchObject({
        ok: false,
        errors: [{ field: 'method', value: 'shadcn', message: expect.stringContaining('Use packaged installation') }],
      });
    }
  });

  it('rejects a framework query that conflicts with a canonical guide route', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/cdn.md',
      new URLSearchParams({ framework: 'vue' }),
      '10.0.0-test'
    );

    expect(result?.ok).toBe(false);
    expect(result && !result.ok && result.errors).toContainEqual(
      expect.objectContaining({ field: 'framework', value: 'vue' })
    );
  });

  it('accepts a method query that matches the route', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/cdn.md',
      new URLSearchParams({ method: 'cdn' }),
      '10.0.0-test'
    );

    expect(result).toMatchObject({ ok: true, plan: { selection: { method: 'cdn' } } });
  });

  it('rejects a method query that conflicts with the route', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/react.md',
      new URLSearchParams({ method: 'shadcn' }),
      '10.0.0-test'
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        {
          field: 'method',
          value: 'shadcn',
          message: 'This route uses the packaged method. Choose its canonical installation route instead.',
        },
      ],
    });
  });

  it('rejects a repeated installation parameter instead of choosing one value', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/react.md',
      new URLSearchParams('preset=audio&preset=video&media=hls'),
      '10.0.0-test'
    );

    expect(result).toEqual({
      ok: false,
      errors: [{ field: 'preset', message: 'Pass this parameter at most once.' }],
    });
  });

  it('ignores parameters outside the installation schema', () => {
    const result = resolveInstallationMarkdownPlan(
      '/docs/guides/installation/react.md',
      new URLSearchParams('utm_source=newsletter&utm_source=repeat&ref=agent&preset=audio'),
      '10.0.0-test'
    );

    expect(result).toMatchObject({ ok: true, plan: { selection: { preset: 'audio' } } });
  });
});

describe('replaceInstallationMarkdownPlan', () => {
  it('replaces only the generated boundary', () => {
    const markdown = '# Guide\n\n<!-- installation-plan:start -->\nold\n<!-- installation-plan:end -->\n\nAfter';

    expect(replaceInstallationMarkdownPlan(markdown, 'new')).toBe(
      '# Guide\n\n<!-- installation-plan:start -->\n\nnew\n\n<!-- installation-plan:end -->\n\nAfter'
    );
  });

  it('drops the boundary for readers', () => {
    const markdown = '# Guide\n\n<!-- installation-plan:start -->\nold\n<!-- installation-plan:end -->\n\nAfter';

    expect(replaceInstallationMarkdownPlan(markdown, '\nnew\n', { keepBoundary: false })).toBe(
      '# Guide\n\nnew\n\nAfter'
    );
  });

  it('preserves dollar replacement tokens verbatim', () => {
    const markdown = '# Guide\n\n<!-- installation-plan:start -->\nold\n<!-- installation-plan:end -->\n\nAfter';
    const replacement = "price $& $$ $' $` end";

    expect(replaceInstallationMarkdownPlan(markdown, replacement)).toBe(
      `# Guide\n\n<!-- installation-plan:start -->\n\n${replacement}\n\n<!-- installation-plan:end -->\n\nAfter`
    );
  });
});

describe('selectInstallationFramework', () => {
  const markdown = `Before

<!-- installation:framework react -->
React only
<!-- /installation:framework react -->

<!-- installation:framework html -->
HTML only
<!-- /installation:framework html -->

\`\`\`md
<!-- installation:framework react -->
Code example
<!-- /installation:framework react -->
\`\`\`

After`;

  it('keeps the selected source branch without changing fenced examples', () => {
    const selected = selectInstallationFramework(markdown, 'html');

    expect(selected).toContain('HTML only');
    expect(selected).not.toContain('\nReact only\n');
    expect(selected).toContain('<!-- installation:framework react -->\nCode example');
  });

  it('selects a branch that contains fenced code', () => {
    const withCode = `Before

<!-- installation:framework react -->
React only

\`\`\`tsx
<Video />
\`\`\`
<!-- /installation:framework react -->

<!-- installation:framework html -->
HTML only

\`\`\`html
<video-js></video-js>
\`\`\`
<!-- /installation:framework html -->

After`;
    const selected = selectInstallationFramework(withCode, 'html');

    expect(selected).toContain('<video-js></video-js>');
    expect(selected).not.toContain('<Video />');
    expect(selected).not.toContain('installation:framework');
  });

  it('fails when framework markers are unbalanced', () => {
    expect(() => selectInstallationFramework('<!-- installation:framework react -->\nReact only', 'react')).toThrow(
      'Unclosed installation framework branch: react'
    );
  });
});

describe('renderInstallationMarkdownSelection', () => {
  const markdown = `# Shadcn

<!-- installation-plan:start -->
Old plan
<!-- installation-plan:end -->

<!-- installation:framework react -->
React next step
<!-- /installation:framework react -->

<!-- installation:framework html -->
HTML next step
<!-- /installation:framework html -->`;

  it('renders the selected plan and matching source-framework content', () => {
    const rendered = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/shadcn',
      new URLSearchParams({ framework: 'html' }),
      '10.0.0-test'
    );

    expect(rendered).toMatchObject({ status: 200, privateResponse: false });
    expect(rendered?.body).toContain('- `framework`: `html`');
    expect(rendered?.body).toContain('HTML next step');
    expect(rendered?.body).not.toContain('React next step');
    expect(rendered?.body).not.toMatch(/installation-plan|installation:framework/);
  });

  it('pins the reproduce command only when given a command version', () => {
    const render = (options = {}) =>
      renderInstallationMarkdownSelection(
        markdown,
        '/docs/guides/installation/shadcn',
        new URLSearchParams({ framework: 'html' }),
        '10.0.0-test',
        options
      )?.body;

    expect(render()).toContain('npx @videojs/cli agents init --method shadcn');
    expect(render({ commandVersion: '9.9.9' })).toContain('npx @videojs/cli@9.9.9 agents init --method shadcn');
  });

  it('renders selected extensions through the web Markdown path', () => {
    const rendered = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/shadcn',
      new URLSearchParams({ framework: 'html', media: 'hls', extensions: 'google-cast' }),
      '10.0.0-test'
    );

    expect(rendered).toMatchObject({ status: 200, privateResponse: false });
    expect(rendered?.body).toContain('- `extensions`: `google-cast`');
    expect(rendered?.body).toContain('@videojs/google-cast@10.0.0-test');
    expect(rendered?.body).toContain('<google-cast></google-cast>');
  });

  it('can preserve both source branches in the static edge template', () => {
    const rendered = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/shadcn',
      new URLSearchParams(),
      '10.0.0-test',
      { preserveFrameworkBranches: true }
    );

    expect(rendered?.body).toContain('- `framework`: `react`');
    expect(rendered?.body).toContain('React next step');
    expect(rendered?.body).toContain('HTML next step');
    expect(rendered?.body).toContain('<!-- installation-plan:start -->');
  });

  it('uses the shared error and missing-section responses', () => {
    const invalid = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/shadcn',
      new URLSearchParams({ media: '\n\n# Injected' }),
      '10.0.0-test'
    );
    const missing = renderInstallationMarkdownSelection(
      '# Shadcn',
      '/docs/guides/installation/shadcn',
      new URLSearchParams(),
      '10.0.0-test'
    );

    expect(invalid).toMatchObject({ status: 400, privateResponse: true });
    expect(invalid?.body).not.toContain('Injected');
    expect(missing).toEqual({
      body: 'The installation guide is missing its generated installation section.\n',
      privateResponse: true,
      status: 500,
    });
  });

  it('names options as query parameters in validation errors and hints', () => {
    const result = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/cdn',
      new URLSearchParams({ project: 'existing', template: 'vite' }),
      '10.0.0-test'
    );

    expect(result?.status).toBe(400);
    expect(result?.body).toContain(
      '- template: CDN scripts go on an existing page with template=none, or into a new Vite app with project=new. For an existing Vite app, use method=packaged.'
    );
    expect(result?.body).not.toContain('--');
  });

  it('reports web query names in validation errors', () => {
    const packageManager = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/react',
      new URLSearchParams({ 'package-manager': 'deno' }),
      '10.0.0-test'
    );
    const sourceUrl = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/react',
      new URLSearchParams({ 'source-url': 'line one\nline two' }),
      '10.0.0-test'
    );
    const skin = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/shadcn',
      new URLSearchParams({ skin: 'none' }),
      '10.0.0-test'
    );
    const cdnPackageManager = renderInstallationMarkdownSelection(
      markdown,
      '/docs/guides/installation/cdn',
      new URLSearchParams({ 'package-manager': 'pnpm', project: 'new' }),
      '10.0.0-test'
    );

    expect(packageManager?.body).toContain('- package-manager: Expected one of: npm, pnpm, yarn, bun');
    expect(packageManager?.body).not.toContain('packageManager');
    expect(sourceUrl?.body).toContain('- source-url: Must not contain control characters or line breaks.');
    expect(sourceUrl?.body).not.toContain('sourceUrl');
    expect(skin?.body).toContain('the `none` skin is not available');
    expect(skin?.body).not.toContain('--skin');
    expect(cdnPackageManager).toMatchObject({ status: 200 });
    expect(cdnPackageManager?.body).toContain('- `package-manager`: `pnpm`');
    expect(cdnPackageManager?.body).toContain('pnpm create vite');
  });
});
