import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { getDocTypeFromId, isSection } from '../../../types/docs';
import { getAllGuideSlugs } from '../sidebar';
import type { DocPage } from './diataxis';
import { findDiataxisIssues, findReferenceDuplicates, findTaskHeadings } from './diataxis';

const CONTENT_ROOT = resolve(process.cwd(), 'src/content/docs');

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return walk(path);

    return entry.name.endsWith('.mdx') ? [path] : [];
  });
}

/** The docs frontmatter is flat YAML with quoted or bare single-line scalars, which is all this needs to read. */
function frontmatterTitle(frontmatter: string): string {
  const value = frontmatter.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? '';

  return value.replace(/^(['"])(.*)\1$/, '$2');
}

function readPage(path: string): DocPage {
  const id = relative(CONTENT_ROOT, path).replace(/\.mdx$/, '');
  const source = readFileSync(path, 'utf8');
  const [, frontmatter = '', body = ''] = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];

  return { id, type: getDocTypeFromId(id), title: frontmatterTitle(frontmatter), body };
}

const pages = walk(CONTENT_ROOT)
  .map(readPage)
  .sort((a, b) => a.id.localeCompare(b.id));

function page(overrides: Partial<DocPage>): DocPage {
  return { id: 'guides/example', type: 'guide', title: 'Example', body: '', ...overrides };
}

describe('findDiataxisIssues', () => {
  it('rejects a literal how-to prefix on any title', () => {
    expect(findDiataxisIssues(page({ title: 'How to autoplay' })).map((issue) => issue.rule)).toEqual([
      'title-how-to-prefix',
    ]);
    expect(findDiataxisIssues(page({ type: 'reference', title: 'How to use PlayButton' }))).toHaveLength(1);
  });

  it('keeps task walkthroughs off reference pages', () => {
    const issues = findDiataxisIssues(
      page({
        type: 'reference',
        body: ['<CustomUiNote />', '', '## Import', '', '## Troubleshooting', '', '### How It Works'].join('\n'),
      })
    );

    expect(issues.map((issue) => issue.rule)).toEqual([
      'reference-custom-ui-note',
      'reference-how-to-section',
      'reference-how-to-section',
    ]);
  });

  it('names task headings without treating them as failures', () => {
    const body = '## Feature bundles\n\n## Create a player\n\n### Using selectors\n\n## Styling and state';

    expect(findTaskHeadings(page({ body }))).toEqual(['Create a player', 'Using selectors']);
    expect(findDiataxisIssues(page({ body }))).toEqual([]);
  });

  it('lets guides explain, instruct, and troubleshoot', () => {
    const body = '<CustomUiNote />\n\n## Recommended approach\n\n## How it works\n\n## Troubleshooting';

    expect(findDiataxisIssues(page({ body }))).toEqual([]);
  });
});

describe('findReferenceDuplicates', () => {
  const reference = page({
    id: 'reference/components/example',
    type: 'reference',
    body: [
      '- **25 parameters per event**: the 8 standard parameters leave room for up to 17 custom dimensions.',
      '',
      '| Engine | Played by |',
      '|---|---|',
      '| `hlsjs` | hls.js |',
      '| `shaka` | Shaka Player |',
      '| `dashjs` | dash.js |',
      '| `browser` | The browser |',
    ].join('\n'),
  });

  it('reports a list item a guide repeats from reference', () => {
    const guide = page({
      body: '<FrameworkCase frameworks={["react"]}>\n- **25 parameters per event**: the 8 standard parameters leave room for up to 17 custom dimensions.\n</FrameworkCase>',
    });

    expect(findReferenceDuplicates([guide, reference])).toEqual([
      expect.objectContaining({ id: 'guides/example', referenceId: 'reference/components/example' }),
    ]);
  });

  it('reports a lookup table whose rows name the same entries, even when the cells differ', () => {
    const guide = page({
      body: [
        '| Engine | Played by |',
        '|---|---|',
        '| `hlsjs` | [hls.js](https://github.com/video-dev/hls.js/) |',
        '| `shaka` | [Shaka Player](https://github.com/shaka-project/shaka-player) |',
        '| `dashjs` | [dash.js](https://github.com/Dash-Industry-Forum/dash.js) |',
        '| `browser` | The browser itself |',
      ].join('\n'),
    });

    expect(findReferenceDuplicates([guide, reference])).toHaveLength(1);
  });

  it('allows code examples, short sentences, and small tables to repeat', () => {
    const shared = ['```html', '<mux-data></mux-data>', '```'].join('\n');
    const table = ['| Engine | Played by |', '|---|---|', '| `hlsjs` | hls.js |', '| `shaka` | Shaka Player |'].join(
      '\n'
    );
    const guide = page({ body: [shared, 'It renders nothing.', table].join('\n\n') });
    const ref = page({
      id: 'reference/components/x',
      type: 'reference',
      body: [shared, 'It renders nothing.', table].join('\n\n'),
    });

    expect(findReferenceDuplicates([guide, ref])).toEqual([]);
  });

  it('ignores passages shared only between guides', () => {
    const text = 'A long enough sentence that two guides happen to share, which is a separate problem from this check.';

    expect(findReferenceDuplicates([page({ body: text }), page({ id: 'guides/other', body: text })])).toEqual([]);
  });
});

describe('docs content', () => {
  it('keeps reference detail out of guides', () => {
    const duplicates = findReferenceDuplicates(pages);
    const report = duplicates
      .map((duplicate) => `${duplicate.id} repeats ${duplicate.referenceId}: ${duplicate.excerpt}`)
      .join('\n');

    expect(duplicates, `\nLink to the reference page instead of repeating it:\n${report}\n`).toEqual([]);
  });

  it('keeps every page inside the boundary of its folder', async () => {
    const issues = pages.flatMap((entry) => findDiataxisIssues(entry));
    const report = issues.map((issue) => `${issue.id} [${issue.rule}]: ${issue.message}`).join('\n');

    expect(issues, `\n${report}\n`).toEqual([]);

    const { sidebar } = await import('../../../docs.config');
    const conceptSlugs = new Set<string>();

    const visit = (items: typeof sidebar) => {
      for (const item of items) {
        if (!isSection(item)) continue;

        if (item.sidebarLabel === 'Concepts') getAllGuideSlugs(item.contents).forEach((slug) => conceptSlugs.add(slug));

        visit(item.contents);
      }
    };

    visit(sidebar);

    const warnings = pages
      .filter((entry) => conceptSlugs.has(entry.id))
      .flatMap((entry) => findTaskHeadings(entry).map((heading) => `${entry.id}: "${heading}"`));

    // Advisory only. Concept pages explain; a heading that gives an instruction usually belongs in a how-to guide.
    if (warnings.length > 0) console.warn(`Task headings on concept pages:\n  ${warnings.join('\n  ')}`);

    expect(conceptSlugs.size).toBeGreaterThan(0);
  });
});
