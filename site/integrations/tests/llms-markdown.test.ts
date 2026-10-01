// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { SITE_DESCRIPTION } from '../../src/consts';
import { sidebar } from '../../src/docs.config';
import { isLink, isSection, type Sidebar } from '../../src/types/docs';
import {
  buildSectionFiles,
  convertPage,
  createTurndown,
  generateChronologicalIndex,
  generateDocsCorpus,
  generateDocsIndex,
  generateInstallationIndex,
  generatePageFooter,
  generateRootIndex,
  llmsIndexPaths,
  type SectionFile,
} from '../llms-markdown';

const SITE_URL = 'https://videojs.org';
const turndown = createTurndown();

function convert(body: string, attributes = ''): string {
  const html = `<html><body><article data-llms-content ${attributes}>${body}</article></body></html>`;
  const page = convertPage(html, turndown, SITE_URL);
  if (!page) throw new Error('page has no llms content');

  return page.markdown;
}

/** One tab group as `Tabs.tsx` renders it: labels in a tablist, every panel present in the DOM. */
function tabGroup(panels: Array<{ label: string; html: string }>): string {
  const tabs = panels.map(({ label }, index) => `<button role="tab" data-value="${index}">${label}</button>`).join('');
  const bodies = panels.map(({ html }, index) => `<div role="tabpanel" data-value="${index}">${html}</div>`).join('');

  return `<div data-tabs-root><div role="tablist">${tabs}</div>${bodies}</div>`;
}

function firstSidebarSlug(items: Sidebar): string {
  for (const item of items) {
    if (isSection(item)) return firstSidebarSlug(item.contents);

    if (!isLink(item)) return item.slug;
  }

  throw new Error('sidebar has no pages');
}

/** The first page of each of the first two top-level sections (Guides and Components, neither framework-limited). */
function firstSlugOfTwoSections(): string[] {
  return sidebar
    .filter(isSection)
    .slice(0, 2)
    .map((section) => firstSidebarSlug(section.contents));
}

function htmlPage(slug: string, markdown: string, description?: string) {
  return { pathname: `/docs/framework/html/${slug}`, title: 'Page', description, framework: 'html', markdown };
}

const guidesSection: SectionFile = {
  label: 'Guides',
  directory: 'guides',
  indexUrl: `${SITE_URL}/docs/framework/html/guides/llms.txt`,
  fullUrl: `${SITE_URL}/docs/framework/html/guides/llms-full.txt`,
  tokens: 90_000,
  index: '',
  full: '',
};

describe('convertPage', () => {
  it('emits an authored table as a GFM pipe table with escaped pipes and padded colspans', () => {
    const markdown = convert(`
      <table>
        <caption>Supported values</caption>
        <thead><tr><th>Value</th><th colspan="2">Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>'a' | 'b'</code></td><td>Either</td><td>letter</td></tr>
          <tr><td>none</td><td>Nothing<br>at all</td><td></td></tr>
        </tbody>
      </table>`);

    expect(markdown).toBe(
      [
        '*Supported values*',
        '',
        '| Value | Meaning | |',
        '| --- | --- | --- |',
        "| `'a' \\| 'b'` | Either | letter |",
        '| none | Nothing at all | |',
      ].join('\n')
    );
  });

  it('folds an API reference entry back into one row with its full type and description', () => {
    const markdown = convert(`
      <table data-apiref-table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th data-llms-ignore>Details</th></tr></thead>
        <tbody data-apiref-row>
          <tr>
            <td>
              <span><code>label<span data-apiref-required>*</span></code><a href="#Button-label" data-llms-ignore></a></span>
              <div data-apiref-attribute>attribute <code>aria-label</code></div>
            </td>
            <td data-apiref-cell="type"><code>object</code></td>
            <td><code>''</code></td>
            <td data-llms-ignore><button>toggle</button></td>
          </tr>
          <tr data-apiref-detail-row>
            <td colspan="4">
              <div data-apiref-description>
                <div data-llms-ignore>Description</div>
                <div>Custom label for the <code>button</code>.</div>
              </div>
              <div data-apiref-type>
                <div data-llms-ignore>Type</div>
                <pre data-language="ts"><code>{ key: string; text: string }
  | string</code></pre>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody data-apiref-row>
          <tr>
            <td><code>disabled</code></td>
            <td data-apiref-cell="type"><code>boolean</code></td>
            <td><span>—</span></td>
            <td data-llms-ignore></td>
          </tr>
        </tbody>
      </table>`);

    expect(markdown).toBe(
      [
        '| Prop | Type | Default | Description |',
        '| --- | --- | --- | --- |',
        "| `label` (required) (attribute `aria-label`) | `{ key: string; text: string } \\| string` | `''` | Custom label for the `button`. |",
        '| `disabled` | `boolean` | — | |',
      ].join('\n')
    );
  });

  it('moves a hidden detail row into the toggle cell and joins its definition list', () => {
    const markdown = convert(`
      <table>
        <thead><tr><th>Import</th><th>Description</th><th>Details</th></tr></thead>
        <tbody>
          <tr><td><code>@videojs/html/video</code></td><td>Video preset.</td><td><button></button></td></tr>
          <tr hidden><td colspan="3"><dl>
            <dt>Feature bundle</dt><dd><code>videoFeatures</code></dd>
            <dt>Features</dt><dd><a href="/a">playback</a>, <a href="/b">time</a></dd>
          </dl></td></tr>
        </tbody>
      </table>`);

    expect(markdown).toBe(
      [
        '| Import | Description | Details |',
        '| --- | --- | --- |',
        '| `@videojs/html/video` | Video preset. | **Feature bundle:** `videoFeatures`; **Features:** [playback](https://videojs.org/a), [time](https://videojs.org/b) |',
      ].join('\n')
    );
  });

  it('keeps list items inside a table cell on their own lines', () => {
    const markdown = convert(
      '<table><tr><th>Name</th><th>Description</th></tr><tr><td><code>modal</code></td><td>Modality:<ul><li><code>false</code>: non-modal; content stays interactive.</li><li><code>true</code>: modal.</li></ul></td></tr></table>'
    );

    expect(markdown).toBe(
      '| Name | Description |\n| --- | --- |\n| `modal` | Modality:<br>- `false`: non-modal; content stays interactive.<br>- `true`: modal. |'
    );
  });

  it('keeps numbered list items inside a table cell on their own lines', () => {
    const markdown = convert(
      '<table><tr><th>Name</th><th>Steps</th></tr><tr><td><code>setup</code></td><td>Order:<ol start="3"><li>Install.</li><li>Configure.</li></ol></td></tr></table>'
    );

    expect(markdown).toBe('| Name | Steps |\n| --- | --- |\n| `setup` | Order:<br>3. Install.<br>4. Configure. |');
  });

  it('escapes angle brackets in prose and keeps code spans in link cards', () => {
    expect(convert('<p>Now &lt;audio&gt; can join, 1 &lt; 2.</p>')).toBe('Now \\<audio> can join, 1 < 2.');

    const card = convert(
      '<div class="docs-link-card"><a href="/x"><span>Read more about <code>&lt;media-container&gt;</code></span><svg></svg></a></div>'
    );

    expect(card).toBe('- [Read more about `<media-container>`](https://videojs.org/x)');
  });

  it('points same-page links at the heading slugs a renderer derives and records each heading id', () => {
    const page = convertPage(
      '<article data-llms-content><p><a href="#root-css">Root vars</a> and <a href="#thumb-css">thumb vars</a>.</p><h4 id="root-css">CSS custom properties</h4><h4 id="thumb-css">CSS custom properties</h4></article>',
      turndown,
      SITE_URL
    );

    expect(page?.markdown).toContain('[Root vars](#css-custom-properties) and [thumb vars](#css-custom-properties-1).');
    expect(page?.headingIds).toEqual(
      new Map([
        ['css-custom-properties', 'root-css'],
        ['css-custom-properties-1', 'thumb-css'],
      ])
    );
  });

  it('keeps authored escapes inside fenced code', () => {
    const markdown = convert('<p>snake_case</p><pre data-language="bash">grep -E "a\\_b|c\\-d"</pre>');

    expect(markdown).toBe('snake_case\n\n```bash\ngrep -E "a\\_b|c\\-d"\n```');
  });

  it('demotes step titles to bold text and keeps identifiers unescaped', () => {
    const steps = convert(
      '<ol><li class="step"><span data-llms-ignore>1</span><div><h3 data-step-title>Add the element</h3><div><p>Body</p></div></div></li></ol>'
    );

    expect(steps).toBe('1. **Add the element**\n\n   Body');
    expect(convert('<p>VJS8_LEGACY_INIT is <code>Promise</code>-based.</p><hr>')).toBe(
      'VJS8_LEGACY_INIT is `Promise`-based.\n\n---'
    );
  });

  it('keeps heading text that a transparent wrapper would otherwise eject', () => {
    expect(convert('<h3 id="root"><div class="contents">Root</div></h3><p>Body</p>')).toBe('### Root\n\nBody');
  });

  it('leaves marker wrappers in place for their own rules', () => {
    const markdown = convert('<div data-installation-plan class="contents"><p>Steps</p></div>');

    expect(markdown).toBe('<!-- installation-plan:start -->\n\nSteps\n\n<!-- installation-plan:end -->');
  });

  it('marks source-framework branches for request-time and package selection', () => {
    const markdown = convert(
      '<div data-shadcn-framework="react"><p>React only</p></div><div data-shadcn-framework="html"><p>HTML only</p></div>'
    );

    expect(markdown).toContain(
      '<!-- installation:framework react -->\nReact only\n<!-- /installation:framework react -->'
    );
    expect(markdown).toContain(
      '<!-- installation:framework html -->\nHTML only\n<!-- /installation:framework html -->'
    );
  });

  it('restores the separators between code chips', () => {
    const markdown = convert(
      '<p>Supports <span class="code-list__item"><code>autoplay</code></span><span class="code-list__item"><code>muted</code></span></p>'
    );

    expect(markdown).toBe('Supports `autoplay`, `muted`.');
  });

  it('renders callouts as blockquotes that name their type and title', () => {
    const markdown = convert(`
      <aside data-aside="caution">
        <div></div>
        <div>
          <div><svg></svg></div>
          <div>
            <p data-aside-title>Load your script as a module</p>
            <div data-aside-body><p>Use <code>type="module"</code>.</p><p>Second paragraph.</p></div>
          </div>
        </div>
      </aside>
      <aside data-aside="note"><p data-aside-title>Note</p><div data-aside-body><p>Plain note.</p></div></aside>`);

    expect(markdown).toBe(
      [
        '> **Caution: Load your script as a module**',
        '>',
        '> Use `type="module"`.',
        '>',
        '> Second paragraph.',
        '',
        '> **Note**',
        '>',
        '> Plain note.',
      ].join('\n')
    );
  });

  it('drops a frame label that only repeats the fence language', () => {
    const cases = [
      { label: 'js', language: 'javascript' },
      { label: 'HTML', language: 'html' },
      { label: 'code', language: 'plaintext' },
    ];

    for (const { label, language } of cases) {
      const markdown = convert(tabGroup([{ label, html: `<pre data-language="${language}">x()</pre>` }]));

      expect(markdown, label).toBe(`\`\`\`${language}\nx()\n\`\`\``);
    }
  });

  it('keeps filename labels and every label of a multi-panel group', () => {
    const single = convert(tabGroup([{ label: 'index.ts', html: '<pre data-language="ts">x()</pre>' }]));

    expect(single).toBe('**index.ts**\n\n```ts\nx()\n```');

    const multiple = convert(
      tabGroup([
        { label: 'npm', html: '<pre data-language="bash">npm i</pre>' },
        { label: 'pnpm', html: '<pre data-language="bash">pnpm add</pre>' },
      ])
    );

    expect(multiple).toBe('**npm**\n\n```bash\nnpm i\n```\n\n**pnpm**\n\n```bash\npnpm add\n```');
  });

  it('keeps the opening fence flush when an astro-slot wraps indented code', () => {
    const markdown = convert(
      '<p>Create:</p><div><astro-slot><pre data-language="js">  const a = 1;\n  b();</pre></astro-slot></div>'
    );

    expect(markdown).toBe('Create:\n\n```js\n  const a = 1;\n  b();\n```');
  });

  it('fills a streamed Suspense boundary from its hidden payload', () => {
    const group = tabGroup([
      { label: 'npm', html: '<!--$?--><template id="r1B:0"></template><pre data-llms-ignore>loading</pre><!--/$-->' },
    ]);
    const markdown = convert(`${group}<div hidden id="r1S:0"><pre data-language="bash">npx shadcn add</pre></div>`);

    expect(markdown).toBe('**npm**\n\n```bash\nnpx shadcn add\n```');
  });

  it('links embedded frames instead of dropping them', () => {
    const markdown = convert('<p>Watch:</p><iframe src="https://www.youtube.com/embed/abc" title="Demo"></iframe>');

    expect(markdown).toBe('Watch:\n\n[Demo](https://www.youtube.com/embed/abc)');
  });

  it('uses a dash marker sized to its content indent', () => {
    const markdown = convert(
      '<ul><li>One<ul><li>Nested</li></ul></li><li>Two</li></ul><ol start="3"><li>Three</li></ol>'
    );

    expect(markdown).toBe('- One\n  - Nested\n- Two\n\n3. Three');
  });

  it('keeps blank lines inside a list item free of trailing spaces', () => {
    const markdown = convert('<ol><li><p>Step</p><pre data-language="bash">run</pre></li><li><p>Next</p></li></ol>');

    expect(markdown).toBe('1. Step\n\n   ```bash\n   run\n   ```\n2. Next');
  });

  it('passes hidden llms-only blocks through and drops ignored ones', () => {
    const markdown = convert(
      '<div data-llms-ignore>Sep 8, 2026•</div><h1>Title</h1><div hidden data-llms-only><p>Published 2026-09-08.</p></div>'
    );

    expect(markdown).toBe('# Title\n\nPublished 2026-09-08.');
  });
});

describe('generateInstallationIndex', () => {
  it('lists canonical routes and only supported Markdown query parameters', () => {
    const markdown = generateInstallationIndex(SITE_URL);

    expect(markdown).toContain(
      '- [HTML source](https://videojs.org/docs/guides/installation/shadcn.md?framework=html)'
    );
    expect(markdown).not.toContain('shadcn.md?framework=vue');
    expect(markdown).toContain('`framework`: On the Shadcn page, choose `react` or `html`.');
    expect(markdown).toContain('`extensions`:');
    expect(markdown).toContain('Applies when method=shadcn.');
    expect(markdown).toContain('Use `project=existing&template=none` for an existing page');
    expect(markdown).not.toMatch(/--[a-z]/);
    expect(markdown).toContain('`package-manager`');
    expect(markdown).toContain('`package-manager`: The command runner used for app setup');
    expect(markdown).toContain('Default: pnpm.');
    expect(markdown).not.toContain("Default: the project's package manager");
    expect(markdown).not.toContain('`method`:');
    expect(markdown).not.toContain('`install-method`:');
  });
});

describe('generatePageFooter', () => {
  it('ends the file with a newline and lists every framework index', () => {
    expect(generatePageFooter('docs/guides/installation/shadcn', undefined, ['react', 'html'], SITE_URL)).toBe(
      [
        '',
        '',
        '---',
        '',
        'React documentation: https://videojs.org/docs/framework/react/llms.txt',
        'HTML documentation: https://videojs.org/docs/framework/html/llms.txt',
        'All documentation: https://videojs.org/llms.txt',
        '',
      ].join('\n')
    );
  });
});

describe('generateRootIndex', () => {
  it('describes each entry and lists the complete files under Optional with a size', () => {
    const index = generateRootIndex({
      frameworks: ['react', 'html'],
      fullTokens: new Map([
        ['html', 243_000],
        ['react', 245_400],
      ]),
      hasBlog: true,
      hasChangelog: true,
      otherPages: [{ pathname: '/about-this-player', title: 'About this player', description: 'What this is.' }],
      siteUrl: SITE_URL,
    });

    expect(index).toContain(`> ${SITE_DESCRIPTION}\n`);
    expect(index).toContain(
      '> AI coding agents can install the [Video.js skill](https://github.com/videojs/skills) to find version-matched documentation and follow current Video.js 10 patterns.\n'
    );
    expect(index).toContain(
      '> The `video.js` package on npm is still Video.js 8. Video.js 10 ships as `@videojs/react` and `@videojs/html`.\n'
    );
    expect(index).toContain(
      '- [HTML documentation](https://videojs.org/docs/framework/html/llms.txt): Every HTML guide and reference page, each with a one-line description.\n' +
        '- [React documentation](https://videojs.org/docs/framework/react/llms.txt): Every React guide'
    );
    expect(index).toContain('- [About this player](https://videojs.org/about-this-player.md): What this is.');
    expect(index).toContain(
      '## Optional\n\n- [HTML documentation, complete](https://videojs.org/docs/framework/html/llms-full.txt): Every HTML page in one file (about 243k tokens)'
    );
    expect(index).not.toContain('Html');
  });

  it('lists section-level complete files after the framework ones', () => {
    const index = generateRootIndex({
      frameworks: ['html'],
      sections: new Map([['html', [guidesSection]]]),
      hasBlog: false,
      hasChangelog: false,
      otherPages: [],
      siteUrl: SITE_URL,
    });

    expect(index).toContain(
      '- [HTML documentation, complete](https://videojs.org/docs/framework/html/llms-full.txt): Every HTML page in one file, for tools that ingest a corpus rather than follow links.\n' +
        '- [HTML Guides, complete](https://videojs.org/docs/framework/html/guides/llms-full.txt): Every HTML guides page in one file (about 90k tokens).\n'
    );
  });
});

describe('generateDocsIndex', () => {
  it('links each top-level section to its own index', () => {
    const index = generateDocsIndex('html', [], SITE_URL, 250_000, [guidesSection]);

    expect(index).toContain(
      'The whole set in one file (about 250k tokens): https://videojs.org/docs/framework/html/llms-full.txt'
    );
    expect(index).toContain(
      '> Install the [Video.js skill](https://github.com/videojs/skills) to help AI coding agents find version-matched pages from this index.'
    );
    expect(index).toContain(
      '> The `video.js` package on npm is still Video.js 8. Video.js 10 ships as `@videojs/html`; to move existing Video.js 8 code, read https://videojs.org/docs/framework/html/guides/migrate-from-video-js-8.md\n'
    );
    expect(index).toContain(
      '> Vidstack Player is in security-only maintenance. To move existing `vidstack` code, read https://videojs.org/docs/framework/html/guides/migrate-from-vidstack.md\n'
    );
    expect(index).toContain(
      '## Guides\n\n' +
        'Installation, migration, concepts, playback guides, customization, and tooling for Video.js.\n\n' +
        'Section index: [guides/llms.txt](https://videojs.org/docs/framework/html/guides/llms.txt). This section in one file (about 90k tokens): https://videojs.org/docs/framework/html/guides/llms-full.txt\n\n'
    );
  });
});

describe('buildSectionFiles', () => {
  it("describes a section with the framework's own summary", () => {
    const api = (framework: 'html' | 'react') =>
      buildSectionFiles(framework, [], SITE_URL).find((file) => file.directory === 'reference/api')?.index ?? '';

    expect(api('react')).toContain('menus, gestures');
    expect(api('html')).not.toContain('menus, gestures');
  });

  it('writes an index and a complete file into the directory a section shares', () => {
    const slug = firstSidebarSlug(sidebar);
    const files = buildSectionFiles('html', [htmlPage(slug, '# Page\n\nBody', 'Desc.')], SITE_URL);

    expect(files.map((file) => file.directory)).toEqual(
      expect.arrayContaining(['guides', 'reference/components', 'reference/api'])
    );

    const guides = files.find((file) => file.directory === 'guides');
    if (!guides) throw new Error('no guides section');

    expect(guides.indexUrl).toBe(`${SITE_URL}/docs/framework/html/guides/llms.txt`);
    expect(guides.index).toMatch(/^# Video\.js v10 — HTML Guides\n\n> Installation, migration/);
    expect(guides.index).toContain(`This section in one file (about 1k tokens): ${guides.fullUrl}\n\n`);
    expect(guides.index).toContain(`- [Page](${SITE_URL}/docs/framework/html/${slug}.md): Desc.`);
    expect(guides.index).toMatch(
      /[^\n]\n\n---\n\nHTML documentation: https:\/\/videojs\.org\/docs\/framework\/html\/llms\.txt\nAll documentation: https:\/\/videojs\.org\/llms\.txt\n$/
    );
    expect(guides.full).toMatch(
      /^# Video\.js v10 — HTML Guides \(complete\)\n\n> Every HTML guides page in one file \(about 1k tokens\)\. Index with descriptions: /
    );
    expect(guides.full).toContain(`<!-- Source: ${SITE_URL}/docs/framework/html/${slug} -->\n\n# Page\n\nBody\n`);
  });
});

describe('llmsIndexPaths', () => {
  it('lists the root, blog, changelog, framework, and section files the build writes', () => {
    const paths = llmsIndexPaths();

    expect(paths).toEqual(expect.arrayContaining(['/llms.txt', '/blog/llms.txt', '/changelog/llms.txt']));

    for (const framework of ['html', 'react']) {
      const directories = buildSectionFiles(framework, [], SITE_URL).map((file) => file.directory);

      for (const directory of ['', ...directories.map((name) => `/${name}`)]) {
        expect(paths).toContain(`/docs/framework/${framework}${directory}/llms.txt`);
        expect(paths).toContain(`/docs/framework/${framework}${directory}/llms-full.txt`);
      }
    }
  });
});

describe('generateChronologicalIndex', () => {
  it('orders same-day entries by version, newest first, and shows each date', () => {
    const pages = ['beta.9', 'beta.10', 'beta.11'].map((tag) => ({
      pathname: `/changelog/10.0.0-${tag}`,
      title: `v10.0.0-${tag}`,
      description: 'Notes.',
      sort: '2026-04-14T00:00:00.000Z',
    }));

    const index = generateChronologicalIndex('Changelog', pages, SITE_URL);

    expect(index).toContain(
      [
        '- [v10.0.0-beta.11](https://videojs.org/changelog/10.0.0-beta.11.md): Notes. (2026-04-14)',
        '- [v10.0.0-beta.10](https://videojs.org/changelog/10.0.0-beta.10.md): Notes. (2026-04-14)',
        '- [v10.0.0-beta.9](https://videojs.org/changelog/10.0.0-beta.9.md): Notes. (2026-04-14)',
      ].join('\n')
    );
  });

  it('prints an optional note under the title and one blank line before the footer', () => {
    const index = generateChronologicalIndex(
      'Blog',
      [{ pathname: '/blog/a', title: 'A', description: 'Post.', sort: '2026-01-01T00:00:00.000Z' }],
      SITE_URL,
      'Older posts.'
    );

    expect(index).toBe(
      '# Video.js v10 — Blog\n\n> Older posts.\n\n- [A](https://videojs.org/blog/a.md): Post. (2026-01-01)\n\n---\n\nAll documentation: https://videojs.org/llms.txt\n'
    );
  });
});

describe('generateDocsCorpus', () => {
  it('points same-page anchors back at the heading id on their page and quotes the corpus size', () => {
    const slug = firstSidebarSlug(sidebar);
    const pathname = `/docs/framework/html/${slug}`;
    const markdown =
      '# Page\n\nSee [below](#details) and [aside](#aside).\n\n```md\n[kept](#details)\n```\n\n## Details';
    const { content: full } = generateDocsCorpus(
      'html',
      [{ pathname, title: 'Page', framework: 'html', markdown, headingIds: new Map([['details', 'root-details']]) }],
      SITE_URL
    );

    expect(full).toContain(
      `See [below](${SITE_URL}${pathname}#root-details) and [aside](${SITE_URL}${pathname}#aside).`
    );
    expect(full).toContain('```md\n[kept](#details)\n```');
    expect(full).toMatch(
      /^# Video\.js v10 — HTML Documentation \(complete\)\n\n> Every HTML docs page in one file \(about \d+k tokens\)\./
    );
    expect(full).toContain(`<!-- Source: ${SITE_URL}${pathname} -->`);
  });

  it("renders the framework's installation plan and keeps only its source branches", () => {
    const markdown = [
      '# Shadcn Installation Guide',
      '<!-- installation-plan:start -->',
      'Default steps',
      '<!-- installation-plan:end -->',
      '<!-- installation:framework react -->',
      'React only',
      '<!-- /installation:framework react -->',
      '<!-- installation:framework html -->',
      'HTML only',
      '<!-- /installation:framework html -->',
      'After',
    ].join('\n\n');
    const { content } = generateDocsCorpus(
      'html',
      [
        {
          pathname: '/docs/guides/installation/shadcn',
          title: 'Shadcn Installation Guide',
          frameworks: ['react', 'html'],
          markdown,
        },
      ],
      SITE_URL
    );

    expect(content).toContain('- `framework`: `html`');
    expect(content).toContain('HTML only');
    expect(content).not.toContain('React only');
    expect(content).not.toContain('installation:framework');
  });

  it('uses the canonical framework for dedicated installation guides', () => {
    const markdown = [
      '# Vue Installation Guide',
      '<!-- installation-plan:start -->',
      'Default steps',
      '<!-- installation-plan:end -->',
    ].join('\n\n');
    const { content } = generateDocsCorpus(
      'html',
      [
        {
          pathname: '/docs/guides/installation/vue',
          title: 'Vue Installation Guide',
          frameworks: ['html'],
          markdown,
        },
      ],
      SITE_URL
    );

    expect(content).toContain('- `framework`: `vue`');
    expect(content).not.toContain('Invalid installation options');
  });

  it('adds the section label to titles two pages share', () => {
    const slugs = firstSlugOfTwoSections();
    const { content: full } = generateDocsCorpus(
      'html',
      slugs.map((slug) => htmlPage(slug, '# Same\n\nBody')),
      SITE_URL
    );
    const headings = full.match(/^# Same.*$/gm) ?? [];

    expect(headings).toHaveLength(2);
    expect(headings[0]).toMatch(/^# Same \(.+\)$/);
    expect(headings[0]).not.toBe(headings[1]);
  });
});
