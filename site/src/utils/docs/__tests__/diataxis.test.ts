import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { getDocTypeFromId, isSection } from '../../../types/docs';
import { getAllGuideSlugs } from '../sidebar';
import type { DocPage } from './diataxis';
import { findDiataxisIssues, findTaskHeadings } from './diataxis';

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

describe('docs content', () => {
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
