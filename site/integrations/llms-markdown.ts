import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createInstallationDiscovery,
  INSTALLATION_FRAMEWORKS,
  INSTALLATION_METHODS,
  installationCompatibility,
  installationMethodsForFramework,
  installationOptionDefinitionsFor,
  QUERY_OPTION_SYNTAX,
  renderInstallationCompatibilityMarkdown,
} from '@videojs/installation';
import type { AstroIntegration } from 'astro';
import GithubSlugger from 'github-slugger';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';

import { FIRST_V10_BLOG_MONTH, SITE_DESCRIPTION } from '../src/consts';
import { sidebar } from '../src/docs.config';
import type { Section, Sidebar, SupportedFramework } from '../src/types/docs';
import { FRAMEWORK_LABELS, isLink, isSection, isValidFramework } from '../src/types/docs';
import { INSTALLATION_PACKAGE_VERSION, renderInstallationMarkdownSelection } from '../src/utils/installation/markdown';
import {
  getInstallationRoutePath,
  getInstallationRouteSegment,
  INSTALLATION_ROUTES,
  INSTALLATION_ROUTE_SEGMENTS,
  installationMarkdownGuides,
} from '../src/utils/installation/routes';
import { staticMarkdownHeaderRules } from '../src/utils/markdown-handler';
import { outsideCodeFences } from '../src/utils/markdown-text';
import { filterSidebarForLlms, llmsSections, sidebarSlugs } from './llms-sections';

export interface PageEntry {
  pathname: string;
  title: string;
  description?: string;
  sort?: string;
  framework?: string;
  frameworks?: string[];
  markdown?: string;
  headingIds?: Map<string, string>;
}

export default function llmsMarkdown(): AstroIntegration {
  let siteUrl = '';
  const turndown = createTurndown();

  return {
    name: 'llms-markdown',
    hooks: {
      'astro:config:done': ({ config }) => {
        siteUrl = config.site?.replace(/\/$/, '') ?? '';
      },
      // Production writes `<page>.md` twins at build time. The dev server has no build step, so convert the rendered
      // page on request instead; this keeps "Copy page" and "View as Markdown" working locally.
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host}`);
          const pathname = requestUrl.pathname;
          if (!pathname.endsWith('.md')) return next();

          if (pathname === '/docs/guides/installation.md') {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.end(generateInstallationIndex(siteUrl));
            return;
          }

          const pagePath = pathname.slice(0, -'.md'.length) || '/';

          try {
            const response = await fetch(`http://${req.headers.host}${pagePath}`, { headers: { accept: 'text/html' } });
            if (!response.ok) return next();

            const page = convertPage(await response.text(), turndown, siteUrl);
            if (!page) return next();

            const installation = renderInstallationMarkdownSelection(page.markdown, pagePath, requestUrl.searchParams);

            if (installation && installation.status !== 200) {
              res.statusCode = installation.status;
              res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
              res.end(installation.body);
              return;
            }

            const markdown = installation?.body ?? page.markdown;

            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.end(markdown + generatePageFooter(pagePath.slice(1), page.framework, page.frameworks, siteUrl));
          } catch (error) {
            next(error);
          }
        });
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        const siteDir = fileURLToPath(dir);
        // Track pages for their llms.txt indexes
        const docsPages: PageEntry[] = [];
        const blogPages: PageEntry[] = [];
        const changelogPages: PageEntry[] = [];
        const otherPages: PageEntry[] = [];
        const twinPaths: string[] = [];

        logger.info('Generating LLM-optimized markdown files...');

        // Standalone error pages emit e.g. 404.html, not 404/index.html
        const SKIP_PAGES = new Set(['404', '500']);

        async function processPage(pathname: string): Promise<void> {
          if (SKIP_PAGES.has(pathname.replace(/\/$/, ''))) return;

          try {
            // Construct path to HTML file
            const htmlPath = join(siteDir, pathname, 'index.html');
            const html = await readFile(htmlPath, 'utf-8');

            const page = convertPage(html, turndown, siteUrl);
            if (!page) return;

            let { markdown } = page;
            const { title, description, sort, framework, frameworks } = page;
            const installation = renderInstallationMarkdownSelection(
              markdown,
              pathname,
              new URLSearchParams(),
              INSTALLATION_PACKAGE_VERSION,
              { preserveFrameworkBranches: true }
            );

            if (installation && installation.status !== 200) {
              throw new Error(`${pathname} could not render installation Markdown: ${installation.body.trim()}`);
            }

            markdown = installation?.body ?? markdown;

            // Write markdown file as sibling to the directory
            // docs/framework/html/guides/slug -> docs/framework/html/guides/slug.md
            const mdPath = join(siteDir, `${pathname}.md`);
            const footer = generatePageFooter(pathname, framework, frameworks, siteUrl);

            await mkdir(dirname(mdPath), { recursive: true });
            await writeFile(mdPath, markdown + footer, 'utf-8');
            twinPaths.push(`/${pathname}.md`);

            // Track for llms.txt index (with leading slash for URLs)
            if (pathname.startsWith('docs/')) {
              docsPages.push({ ...page, pathname: `/${pathname}` });
            } else if (pathname.startsWith('blog/')) {
              blogPages.push({ pathname: `/${pathname}`, title, description, sort });
            } else if (pathname.startsWith('changelog/')) {
              changelogPages.push({ pathname: `/${pathname}`, title, description, sort });
            } else {
              otherPages.push({ pathname: `/${pathname}`, title, description, sort });
            }
          } catch (error) {
            logger.error(`Failed to process ${pathname}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Process pages with a concurrency cap. Work is mostly CPU-bound
        // (linkedom parse + Turndown) so parallelism only buys overlap with
        // the readFile/writeFile I/O; 8 is enough to keep that overlap busy
        // without flooding the event loop.
        const CONCURRENCY = 8;
        const queue = pages.map((page) => page.pathname);
        const workers = Array.from({ length: CONCURRENCY }, async () => {
          while (queue.length > 0) {
            const pathname = queue.shift();
            if (pathname === undefined) return;

            await processPage(pathname);
          }
        });

        await Promise.all(workers);

        const installationIndexPath = join(siteDir, 'docs', 'guides', 'installation.md');

        await mkdir(dirname(installationIndexPath), { recursive: true });
        await writeFile(installationIndexPath, generateInstallationIndex(siteUrl), 'utf-8');
        twinPaths.push('/docs/guides/installation.md');

        // Append rather than overwrite, so `_headers` rules from `public/` survive.
        await appendFile(join(siteDir, '_headers'), `\n${staticMarkdownHeaderRules(twinPaths.sort())}\n`, 'utf-8');

        // Group docs by framework
        const docsByFramework = new Map<string, PageEntry[]>();

        for (const doc of docsPages) {
          const frameworks = doc.frameworks ?? [doc.framework ?? 'unknown'];

          for (const fw of frameworks) {
            if (!docsByFramework.has(fw)) docsByFramework.set(fw, []);

            docsByFramework.get(fw)!.push(doc);
          }
        }

        // Write per-framework docs sub-indexes
        const frameworks: string[] = [];
        const fullTokens = new Map<string, number>();
        const sectionsByFramework = new Map<string, SectionFile[]>();

        for (const [fw, fwPages] of docsByFramework) {
          frameworks.push(fw);

          // One file with every page, for tools that ingest a corpus rather than follow an index. Its size is quoted
          // wherever it is linked so a reader can tell whether it fits their context window.
          const corpus = generateDocsCorpus(fw, fwPages, siteUrl);
          const fullPath = join(siteDir, 'docs', 'framework', fw, 'llms-full.txt');

          fullTokens.set(fw, corpus.tokens);
          await mkdir(dirname(fullPath), { recursive: true });
          await writeFile(fullPath, corpus.content, 'utf-8');

          // The whole framework outgrows a context window, so each sidebar tab also gets an index and a complete file.
          const sections = buildSectionFiles(fw, fwPages, siteUrl);

          sectionsByFramework.set(fw, sections);

          for (const section of sections) {
            const sectionDir = join(siteDir, 'docs', 'framework', fw, section.directory);

            await mkdir(sectionDir, { recursive: true });
            await writeFile(join(sectionDir, 'llms.txt'), section.index, 'utf-8');
            await writeFile(join(sectionDir, 'llms-full.txt'), section.full, 'utf-8');
          }

          const subIndexPath = join(siteDir, 'docs', 'framework', fw, 'llms.txt');

          await writeFile(subIndexPath, generateDocsIndex(fw, fwPages, siteUrl, fullTokens.get(fw), sections), 'utf-8');
        }

        // Write blog sub-index
        if (blogPages.length > 0) {
          const blogIndex = generateBlogIndex(blogPages, siteUrl);
          const blogIndexPath = join(siteDir, 'blog', 'llms.txt');

          await mkdir(dirname(blogIndexPath), { recursive: true });
          await writeFile(blogIndexPath, blogIndex, 'utf-8');
        }

        // Write changelog sub-index
        if (changelogPages.length > 0) {
          const changelogIndex = generateChangelogIndex(changelogPages, siteUrl);
          const changelogIndexPath = join(siteDir, 'changelog', 'llms.txt');

          await mkdir(dirname(changelogIndexPath), { recursive: true });
          await writeFile(changelogIndexPath, changelogIndex, 'utf-8');
        }

        // Write root llms.txt index
        const rootIndex = generateRootIndex({
          frameworks,
          fullTokens,
          sections: sectionsByFramework,
          hasBlog: blogPages.length > 0,
          hasChangelog: changelogPages.length > 0,
          otherPages,
          siteUrl,
        });
        const rootIndexPath = join(siteDir, 'llms.txt');

        await writeFile(rootIndexPath, rootIndex, 'utf-8');

        const sectionCount = [...sectionsByFramework.values()].reduce((count, list) => count + list.length, 0);
        const subIndexCount =
          frameworks.length + sectionCount + (blogPages.length > 0 ? 1 : 0) + (changelogPages.length > 0 ? 1 : 0);

        logger.info(
          `Generated ${docsPages.length + blogPages.length + changelogPages.length + otherPages.length} markdown files, llms.txt root index, and ${subIndexCount} sub-indexes`
        );
      },
    },
  };
}

export function generateInstallationIndex(siteUrl = 'https://videojs.org'): string {
  const origin = siteUrl || 'https://videojs.org';
  const discovery = createInstallationDiscovery(INSTALLATION_PACKAGE_VERSION);
  const options = installationOptionDefinitionsFor(
    { methods: INSTALLATION_METHODS, frameworks: INSTALLATION_FRAMEWORKS },
    QUERY_OPTION_SYNTAX
  );
  const optionLines = options
    .filter(({ query }) => query && !['method', 'framework'].includes(query))
    .map((option) => {
      const values = option.values ? ` Values: ${option.values.map((value) => `\`${value}\``).join(', ')}.` : '';
      const applies = option.appliesWhen ? ` Applies when ${option.appliesWhen}.` : '';
      const defaultValue = option.query === 'package-manager' ? 'pnpm' : option.default;

      return `- \`${option.query}\`: ${option.description}${values} Default: ${defaultValue}.${applies}`;
    })
    .join('\n');
  const shadcnFrameworks = INSTALLATION_FRAMEWORKS.filter((framework) =>
    installationMethodsForFramework(framework).includes('shadcn')
  ).map((framework) => `\`${framework}\``);
  const guides = installationMarkdownGuides()
    .map(
      ({ title, guides }) =>
        `## ${title}\n\n${guides.map(({ label, path }) => `- [${label}](${origin}${path})`).join('\n')}`
    )
    .join('\n\n');

  return `# Video.js installation guides

Choose the guide for the framework and installation path you intend to use. Each page includes a complete default installation. Add the listed query parameters to its \`.md\` URL for another validated combination.

## AI Quickstart

Install the [Video.js skill](https://github.com/videojs/skills), then ask the Video.js CLI for version-matched installation choices for every framework. The command only prints instructions and never modifies a project.

\`\`\`sh
${discovery.command}
\`\`\`

${guides}

## Query parameters

The page route selects Packaged, Shadcn, or CDN and fixes the framework except on the Shadcn page. Query parameters select the remaining options:

- \`framework\`: On the Shadcn page, choose ${shadcnFrameworks.join(' or ')}. Default: \`react\`.
${optionLines}

## Compatibility

${renderInstallationCompatibilityMarkdown(installationCompatibility, QUERY_OPTION_SYNTAX)}
`;
}

export function createTurndown(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '-',
    hr: '---',
  });

  // Turndown leaves `<` alone, so prose such as "the <audio> tag" would become an HTML tag and vanish when rendered.
  const escapeText = turndown.escape.bind(turndown);

  turndown.escape = (text: string) => escapeText(text).replace(/<(?=[A-Za-z/])/g, '\\<');

  // Turndown prefixes blank lines inside a quote with `> ` (trailing space); emit a bare `>` instead.
  turndown.addRule('blockquote', {
    filter: 'blockquote',
    replacement: (content) => {
      const body = content
        .replace(/^\n+|\n+$/g, '')
        .replace(/^/gm, '> ')
        .replace(/^> $/gm, '>');

      return `\n\n${body}\n\n`;
    },
  });

  // Definition lists become bold-term list items. A table cell has no line structure, so there the entries run on,
  // separated by semicolons; each bold term marks where an entry starts, so the plain separator stays unambiguous.
  turndown.addRule('definition-term', {
    filter: 'dt',
    replacement: (content, node) => {
      const term = `**${collapseWhitespace(content)}:** `;

      return node.closest('td, th') ? `; ${term}` : `\n- ${term}`;
    },
  });

  turndown.addRule('definition-detail', {
    filter: 'dd',
    replacement: (content) => collapseWhitespace(content),
  });

  turndown.addRule('definition-list', {
    filter: 'dl',
    replacement: (content) => `\n\n${content.replace(/^\n+|\n+$/g, '')}\n\n`,
  });

  // Turndown pads every list marker to four columns (`*   item`). Match the marker width instead so nested content
  // lines up under the text and hand-written list items (`- item`) read the same as converted ones.
  turndown.addRule('list-item', {
    filter: 'li',
    replacement: (content, node, options) => {
      const parent = node.parentElement;
      let prefix = `${options.bulletListMarker} `;

      if (parent?.nodeName === 'OL') {
        const start = Number(parent.getAttribute('start') ?? 1);
        const index = Array.prototype.indexOf.call(parent.children, node);

        prefix = `${start + index}. `;
      }

      // Indent continuation lines only; a blank line inside the item stays empty rather than carrying spaces.
      const body = content
        .replace(/^\n+/, '')
        .replace(/\n+$/, '\n')
        .replace(/\n(?=[^\n])/g, `\n${' '.repeat(prefix.length)}`);

      return prefix + body + (node.nextSibling && !/\n$/.test(body) ? '\n' : '');
    },
  });

  const hasAttribute = (node: Node, attribute: string): boolean => {
    if (node.nodeType !== 1) return false;

    // SAFETY: nodeType 1 is an Element in the DOM model used by Turndown.
    return (node as Element).getAttribute(attribute) !== null;
  };

  // Ensure [data-llms-only] content passes through despite hidden attribute
  turndown.addRule('llms-only', {
    filter: (node) => hasAttribute(node, 'data-llms-only'),
    replacement: (content) => content,
  });

  // Preserve both source-framework branches in the static Markdown template. Request rendering and package bundling
  // select one branch after applying the installation plan.
  turndown.addRule('installation-framework', {
    filter: (node) => hasAttribute(node, 'data-shadcn-framework'),
    replacement: (content, node) => {
      const framework = node.getAttribute('data-shadcn-framework');
      if (!framework) return content;

      return `\n\n<!-- installation:framework ${framework} -->\n${content.trim()}\n<!-- /installation:framework ${framework} -->\n\n`;
    },
  });

  // Keep a stable boundary around the generated installation steps. The edge function replaces only this block when
  // a Markdown request supplies installation query parameters.
  turndown.addRule('installation-plan', {
    filter: (node) => hasAttribute(node, 'data-installation-plan'),
    replacement: (content) =>
      `\n\n<!-- installation-plan:start -->\n\n${content.trim()}\n\n<!-- installation-plan:end -->\n\n`,
  });

  // Shiki renders `<pre data-language>`; keep the language on the fence so agents know what they are reading.
  turndown.addRule('highlighted-code', {
    filter: (node) => node.nodeName === 'PRE' && node.hasAttribute('data-language'),
    replacement: (_content, pre) => {
      const code = (pre.textContent ?? '').replace(/\n$/, '');

      // A fence must be longer than any backtick run inside the code, or a nested ``` would close it early.
      const longestRun = Math.max(2, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
      const fence = '`'.repeat(longestRun + 1);

      return `\n\n${fence}${pre.getAttribute('data-language')}\n${code}\n${fence}\n\n`;
    },
  });

  // Flatten docs link cards, whose block markup nests inside the <a>, into list items.
  // Emitting a single leading/trailing newline keeps a run of adjacent cards as one tight list.
  turndown.addRule('docs-link-card', {
    filter: (node) => hasClass(node, 'docs-link-card'),
    replacement: (_content, node) => {
      const link = node.querySelector('a[href]');
      if (!link) return '';

      // Card body is either <span>title</span> or <div><div>title</div><div>description</div></div>,
      // followed by a chevron icon.
      const body = Array.from(link.children).find((child) => child.tagName.toLowerCase() !== 'svg');
      const blocks = body ? Array.from(body.children) : [];
      const hasDescription = blocks.length > 1;

      const title = inlineMarkdown((hasDescription ? blocks[0] : body) ?? null, escapeText);
      if (!title) return '';

      const description = hasDescription ? inlineMarkdown(blocks[1] ?? null, escapeText) : '';
      const href = link.getAttribute('href') ?? '';

      return description ? `\n- [${title}](${href}): ${description}\n` : `\n- [${title}](${href})\n`;
    },
  });

  // Turndown has no table support of its own and would emit every cell as a paragraph. Emit GFM pipe tables instead:
  // the first row is the header (the site always renders one), cells collapse to a single line, and pipes are escaped
  // because union types such as `A | B` are common in reference tables.
  turndown.addRule('table-cell', {
    filter: ['th', 'td'],
    replacement: (content, node) => {
      // A cell must stay on one line, so a list inside it keeps bullet and numbered items apart with GFM's `<br>` line
      // breaks. Semicolons would read as part of an item that contains one, such as "non-modal; background content
      // remains interactive".
      const inline = content
        .replace(/^\s*;\s*/, '')
        .replace(/\n+\s*(?=(?:-|\d+\.)\s)/g, '<br>')
        .replace(/^<br>/, '');
      const text = collapseWhitespace(inline).replace(/\|/g, '\\|');
      const span = Math.max(1, Number(node.getAttribute('colspan')) || 1);

      return `| ${text ? `${text} ` : ''}${'| '.repeat(span - 1)}`;
    },
  });

  turndown.addRule('table-row', {
    filter: 'tr',
    replacement: (content, row) => {
      const line = `\n${content}|`;

      if (!isHeaderRow(row)) return line;

      return `${line}\n|${' --- |'.repeat(columnCount(row))}`;
    },
  });

  turndown.addRule('table-section', {
    filter: ['thead', 'tbody', 'tfoot'],
    replacement: (content) => content,
  });

  turndown.addRule('table-caption', {
    filter: 'caption',
    replacement: (content) => `\n\n*${collapseWhitespace(content)}*\n\n`,
  });

  turndown.addRule('table', {
    filter: 'table',
    replacement: (content) => `\n\n${content.replace(/^\n+|\n+$/g, '').replace(/\n{3,}/g, '\n\n')}\n\n`,
  });

  // An embed has no text, so it would vanish without a trace. Keep its address so a reader can follow it.
  turndown.addRule('iframe', {
    filter: 'iframe',
    replacement: (_content, frame) => {
      const src = frame.getAttribute('src');
      if (!src) return '';

      const title = collapseWhitespace(frame.getAttribute('title')) || 'Embedded content';

      return `\n\n[${title}](${src})\n\n`;
    },
  });

  return turndown;
}

/** The header row of a pipe table is the first row of the table; the site never renders header-less tables. */
function isHeaderRow(row: Element): boolean {
  return row.closest('table')?.querySelector('tr') === row;
}

function columnCount(row: Element): number {
  return Array.from(row.children).reduce(
    (count, cell) => count + Math.max(1, Number(cell.getAttribute('colspan')) || 1),
    0
  );
}

export interface ConvertedPage {
  markdown: string;
  title: string;
  description?: string;
  sort?: string;
  framework?: string;
  frameworks?: string[];
  /** HTML id of each heading, keyed by the slug its same-page links use in the Markdown. */
  headingIds: Map<string, string>;
}

/** Convert a rendered page's `[data-llms-content]` regions to Markdown, or `null` when the page has none. */
export function convertPage(html: string, turndown: TurndownService, siteUrl: string): ConvertedPage | null {
  // linkedom is a lightweight DOM-compatible parser — no CSS engine,
  // no script execution, just enough DOM to run querySelector/cloneNode.
  const { document } = parseHTML(html);

  // Check if page has llms content
  const contentElements = document.querySelectorAll('[data-llms-content]');
  if (contentElements.length === 0) return null;

  // For each content element, strip non-content elements before conversion
  const contentParts: string[] = [];
  const slugger = new GithubSlugger();
  const headingIds = new Map<string, string>();

  contentElements.forEach((contentEl) => {
    // SAFETY: a deep clone of an element is an element.
    const clone = contentEl.cloneNode(true) as Element;

    // Drop opted-out markup along with scripts and styles (which include Astro island hydration scripts).
    for (const element of clone.querySelectorAll('[data-llms-ignore], script, style')) {
      element.remove();
    }

    resolveStreamedContent(clone);
    unwrapTransparentWrappers(clone);
    flattenApiTables(clone);
    flattenHiddenDetailRows(clone);
    flattenAsides(clone);
    demoteStepTitles(clone);
    joinCodeChips(clone);
    flattenTabs(clone);
    rewriteInPageAnchors(clone, slugger, headingIds);
    absolutizeUrls(clone, siteUrl);

    contentParts.push(clone.innerHTML);
  });

  // Combine all content parts
  const combinedHtml = contentParts.join('\n\n');
  // Turndown escapes every `_` and any `-` that opens a text node; neither can start emphasis or a list mid-word.
  const markdown = outsideCodeFences(turndown.turndown(combinedHtml), (text) =>
    text.replace(/(?<=\w)\\_(?=\w)/g, '_').replace(/(?<=\S)\\-/g, '-')
  );

  // Extract title and description for llms.txt index
  const titleElement = document.querySelector('h1');
  const title = titleElement?.textContent?.trim() || 'Untitled';

  const descriptionAttr = contentElements[0]?.getAttribute('data-llms-description');
  const description = descriptionAttr || undefined;

  const sortAttr = contentElements[0]?.getAttribute('data-llms-sort');
  const sort = sortAttr || undefined;

  const frameworkAttr = contentElements[0]?.getAttribute('data-framework');
  const framework = frameworkAttr || undefined;
  const frameworksAttr = contentElements[0]?.getAttribute('data-frameworks');
  const frameworks = frameworksAttr ? frameworksAttr.split(',').filter(Boolean) : undefined;

  return { markdown, title, description, sort, framework, frameworks, headingIds };
}

/**
 * React streams a Suspense boundary as `<template id="…B:n">` at the fallback position plus a `<div hidden id="…S:n">`
 * payload later in the document, swapped in by a client script. Perform that swap here so the payload lands where the
 * reader expects it instead of trailing the section it belongs to.
 */
function resolveStreamedContent(root: Element): void {
  for (const placeholder of root.querySelectorAll('template[id]')) {
    const match = /^(.*)B:(\d+)$/.exec(placeholder.getAttribute('id') ?? '');
    if (!match) continue;

    const payload = root.querySelector(`[hidden][id="${match[1]}S:${match[2]}"]`);
    if (!payload) continue;

    moveChildrenBefore(payload, placeholder);
    payload.remove();
    placeholder.remove();
  }
}

/**
 * Elements Turndown does not know (`astro-slot`, `astro-island`) count as inline, so a block inside them inherits
 * inline whitespace handling: leading spaces of a `<pre>` migrate onto the fence line. `display: contents` wrappers
 * have no box on the page, but inside a heading they eject its text into a separate paragraph. Both are transparent to
 * a reader and are unwrapped; leftover `<template>` elements hold nothing rendered.
 */
function unwrapTransparentWrappers(root: Element): void {
  for (const wrapper of root.querySelectorAll('astro-slot, astro-island')) {
    unwrap(wrapper);
  }

  for (const wrapper of root.querySelectorAll('div.contents')) {
    // A wrapper that also carries data attributes is a marker for another rule (e.g. `data-installation-plan`).
    if (wrapper.attributes.length === 1) unwrap(wrapper);
  }

  for (const template of root.querySelectorAll('template')) {
    template.remove();
  }
}

/**
 * API reference tables render each entry as a `<tbody>` holding a summary row and a hidden detail row with the
 * description and the full type. A pipe table has no second row per entry, so fold the detail back into the summary
 * row: the full type replaces the truncated one and the description becomes a trailing column. Required markers and
 * attribute aliases move out of the identifier's code span so the name stays exact.
 */
function flattenApiTables(root: Element): void {
  const document = root.ownerDocument;

  for (const table of root.querySelectorAll('table[data-apiref-table]')) {
    const headerRow = table.querySelector('thead tr');
    const hasDescriptions = table.querySelector('[data-apiref-description]') !== null;

    if (hasDescriptions && headerRow) {
      const heading = document.createElement('th');

      heading.textContent = 'Description';
      headerRow.appendChild(heading);
    }

    for (const entry of table.querySelectorAll('tbody')) {
      const summary = entry.querySelector('tr');
      const detail = entry.querySelector('[data-apiref-detail-row]');

      if (!summary) continue;

      const fullType = collapseWhitespace(detail?.querySelector('[data-apiref-type]')?.textContent);
      const typeCell = summary.querySelector('[data-apiref-cell="type"]');

      if (fullType && typeCell) {
        const code = document.createElement('code');

        code.textContent = fullType;
        typeCell.textContent = '';
        typeCell.appendChild(code);
      }

      if (hasDescriptions) {
        const cell = document.createElement('td');
        const description = detail?.querySelector('[data-apiref-description]');

        if (description) moveChildrenBefore(description, null, cell);

        summary.appendChild(cell);
      }

      detail?.remove();
    }

    for (const marker of table.querySelectorAll('[data-apiref-required]')) {
      const code = marker.closest('code');

      marker.remove();
      code?.parentNode?.insertBefore(document.createTextNode(' (required)'), code.nextSibling);
    }

    for (const alias of table.querySelectorAll('[data-apiref-attribute]')) {
      const inline = document.createElement('span');

      inline.appendChild(document.createTextNode(' ('));
      moveChildrenBefore(alias, null, inline);
      inline.appendChild(document.createTextNode(')'));
      alias.replaceWith(inline);
    }
  }
}

/**
 * Disclosure tables (presets, skins) hide each entry's detail in a following `<tr hidden>` whose single cell spans the
 * row, toggled from the last cell of the summary row. Move the detail into that toggle cell so the "Details" column
 * holds the content it names.
 */
function flattenHiddenDetailRows(root: Element): void {
  for (const detail of root.querySelectorAll('tr[hidden]')) {
    const summary = detail.previousElementSibling;
    const cells = detail.querySelectorAll('td');
    if (!summary || summary.nodeName !== 'TR' || cells.length !== 1) continue;

    const target = Array.from(summary.children)
      .filter((cell) => cell.nodeName === 'TD')
      .at(-1);
    if (!target) continue;

    target.textContent = '';
    moveChildrenBefore(cells[0]!, null, target);
    detail.remove();
  }
}

/** A heading inside a numbered step reads as `1. ### Title` in Markdown; a bold line keeps the list intact. */
function demoteStepTitles(root: Element): void {
  const document = root.ownerDocument;

  for (const title of root.querySelectorAll('[data-step-title]')) {
    const paragraph = document.createElement('p');
    const strong = document.createElement('strong');

    strong.textContent = collapseWhitespace(title.textContent);
    paragraph.appendChild(strong);
    title.replaceWith(paragraph);
  }
}

/**
 * Markdown headings carry no ids, so a same-page link to `#root-css-custom-properties` has nothing to land on. Point it
 * at the slug a GFM renderer derives from the heading text instead, numbering repeats the way GitHub does. Each
 * heading's HTML id is recorded by slug in `headingIds` so a link that later leaves the page can target the HTML page.
 */
function rewriteInPageAnchors(root: Element, slugger: GithubSlugger, headingIds: Map<string, string>): void {
  const slugById = new Map<string, string>();

  for (const heading of root.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const slug = slugger.slug(collapseWhitespace(heading.textContent));
    const id = heading.getAttribute('id');
    if (!id) continue;

    slugById.set(id, slug);
    headingIds.set(slug, id);
  }

  for (const link of root.querySelectorAll('a[href^="#"]')) {
    const slug = slugById.get((link.getAttribute('href') ?? '').slice(1));

    if (slug) link.setAttribute('href', `#${slug}`);
  }
}

/** Inline Markdown for an element's text and code spans, for places Turndown only sees as text. */
function inlineMarkdown(element: Element | null, escape: (text: string) => string): string {
  if (!element) return '';

  const parts = Array.from(element.childNodes).map((child) => {
    if (child.nodeType === 3) return escape(child.textContent ?? '');

    if (child.nodeName === 'CODE') return `\`${child.textContent ?? ''}\``;

    // SAFETY: text nodes returned above; any other child without element children contributes no text.
    return inlineMarkdown(child as Element, escape);
  });

  return collapseWhitespace(parts.join(''));
}

/**
 * Callouts convey their type through an icon and a colour band, neither of which survives conversion. Rewrite each as a
 * blockquote whose first line names the type and title so a reader still knows a caution from a tip.
 */
function flattenAsides(root: Element): void {
  const document = root.ownerDocument;

  for (const aside of root.querySelectorAll('aside[data-aside]')) {
    const label = capitalize(aside.getAttribute('data-aside') ?? '');
    const title = collapseWhitespace(aside.querySelector('[data-aside-title]')?.textContent);
    const heading = !title || title === label ? label : `${label}: ${title}`;
    const body = aside.querySelector('[data-aside-body]') ?? aside;

    const quote = document.createElement('blockquote');
    const lead = document.createElement('p');
    const strong = document.createElement('strong');

    strong.textContent = heading;
    lead.appendChild(strong);
    quote.appendChild(lead);
    moveChildrenBefore(body, null, quote);
    aside.replaceWith(quote);
  }
}

/** The separators between code chips are CSS pseudo-elements, so restore them as text. */
function joinCodeChips(root: Element): void {
  const document = root.ownerDocument;

  for (const chip of root.querySelectorAll('.code-list__item')) {
    const next = chip.nextElementSibling;
    const isLast = !next || !hasClass(next, 'code-list__item');

    chip.appendChild(document.createTextNode(isLast ? '.' : ', '));
  }
}

/** Shiki keeps the fence alias an author typed, while frame labels may spell the language differently. */
const LANGUAGE_ALIASES = new Map([
  ['js', 'javascript'],
  ['ts', 'typescript'],
  ['sh', 'bash'],
  ['shell', 'bash'],
  ['zsh', 'bash'],
  ['yml', 'yaml'],
  ['md', 'markdown'],
  ['txt', 'plaintext'],
  ['text', 'plaintext'],
]);

function normalizeLanguage(value: string | null | undefined): string {
  const key = collapseWhitespace(value).toLowerCase();

  return LANGUAGE_ALIASES.get(key) ?? key;
}

/**
 * Tab groups render every panel in the HTML, so a Markdown reader would see the tab labels as stray words followed by
 * anonymous blocks. Replace each group with its panels in order, each introduced by its label. A single code frame
 * whose label is just the language (or the generic `code` fallback) keeps only the fence, since the fence already
 * carries it.
 */
function flattenTabs(root: Element): void {
  for (const group of Array.from(root.querySelectorAll('[data-tabs-root]')).reverse()) {
    const labels = new Map<string, string>();

    for (const tab of group.querySelectorAll('[role="tab"]')) {
      labels.set(tab.getAttribute('data-value') ?? '', collapseWhitespace(tab.textContent));
    }

    const panels = Array.from(group.querySelectorAll('[role="tabpanel"]'));
    const parts: string[] = [];

    for (const panel of panels) {
      const label = labels.get(panel.getAttribute('data-value') ?? '') ?? '';
      const language = panel.querySelector('pre[data-language]')?.getAttribute('data-language');
      const isGeneric = label.toLowerCase() === 'code';
      const repeatsLanguage = panels.length === 1 && normalizeLanguage(label) === normalizeLanguage(language);
      const showLabel = label && !isGeneric && !repeatsLanguage;

      if (showLabel) parts.push(`<p><strong>${escapeHtml(label)}</strong></p>`);

      parts.push(panel.innerHTML);
    }

    const replacement = group.ownerDocument.createElement('div');

    replacement.innerHTML = parts.join('\n');
    group.replaceWith(replacement);
  }
}

/** Root-relative links are meaningless once the Markdown leaves the site, so pin them to the canonical origin. */
function absolutizeUrls(root: Element, siteUrl: string): void {
  if (!siteUrl) return;

  for (const link of root.querySelectorAll('a[href^="/"]')) {
    link.setAttribute('href', `${siteUrl}${link.getAttribute('href')}`);
  }

  for (const image of root.querySelectorAll('img[src^="/"]')) {
    image.setAttribute('src', `${siteUrl}${image.getAttribute('src')}`);
  }
}

/** Move every child of `source` before `reference`, or append them to `target` when no reference is given. */
function moveChildrenBefore(source: Element, reference: Element | null, target: Element | null = null): void {
  const parent = reference?.parentNode ?? target;
  if (!parent) return;

  while (source.firstChild) {
    parent.insertBefore(source.firstChild, reference);
  }
}

function unwrap(element: Element): void {
  moveChildrenBefore(element, element);
  element.remove();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Element.classList is not implemented consistently across DOM shims, so read the attribute directly. */
function hasClass(element: Element, className: string): boolean {
  return (element.getAttribute('class') ?? '').split(/\s+/).includes(className);
}

function collapseWhitespace(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function frameworkLabel(framework: string): string {
  return isValidFramework(framework) ? FRAMEWORK_LABELS[framework] : capitalize(framework);
}

/** Rough token count for a size hint; four characters per token is close enough for English prose and code. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function formatTokens(tokens: number): string {
  return `about ${Math.max(1, Math.round(tokens / 1000))}k tokens`;
}

/** Breadcrumb footer linking a per-page .md back to its parent index and root llms.txt. */
export function generatePageFooter(
  pathname: string,
  framework: string | undefined,
  frameworks: string[] | undefined,
  siteUrl: string
): string {
  const lines = ['\n\n---\n'];

  if (pathname.startsWith('docs/')) {
    for (const candidate of frameworks ?? (framework ? [framework] : [])) {
      lines.push(`${frameworkLabel(candidate)} documentation: ${siteUrl}/docs/framework/${candidate}/llms.txt`);
    }
  } else if (pathname.startsWith('blog/')) {
    lines.push(`All blog posts: ${siteUrl}/blog/llms.txt`);
  } else if (pathname.startsWith('changelog/')) {
    lines.push(`Full changelog: ${siteUrl}/changelog/llms.txt`);
  }

  lines.push(`All documentation: ${siteUrl}/llms.txt`);
  return `${lines.join('\n')}\n`;
}

/**
 * One index list item linking a page's Markdown twin. Titles and descriptions are page text, so a tag name such as
 * `<audio>` is escaped the way the page body escapes it, and brackets cannot close the link text early.
 */
function indexEntry(page: PageEntry, siteUrl: string, suffix = ''): string {
  const title = escapeIndexText(page.title).replace(/[[\]]/g, '\\$&');
  const link = `- [${title}](${siteUrl}${page.pathname}.md)`;

  return page.description ? `${link}: ${escapeIndexText(page.description)}${suffix}\n` : `${link}${suffix}\n`;
}

function escapeIndexText(text: string): string {
  return text.replace(/<(?=[A-Za-z/])/g, '\\<');
}

/** Breadcrumb footer linking an index back to root llms.txt, separated from the list by one blank line. */
function appendIndexFooter(content: string, siteUrl: string, lines: string[] = []): string {
  const footer = [...lines, `All documentation: ${siteUrl}/llms.txt`].join('\n');

  return `${content.replace(/\n+$/, '')}\n\n---\n\n${footer}\n`;
}

export interface RootIndexOptions {
  frameworks: string[];
  /** Estimated size of each framework's `llms-full.txt`, keyed by framework. */
  fullTokens?: Map<string, number>;
  /** Section-level files per framework, listed after the framework-level complete files. */
  sections?: Map<string, SectionFile[]>;
  hasBlog: boolean;
  hasChangelog: boolean;
  otherPages: PageEntry[];
  siteUrl: string;
}

export function generateRootIndex({
  frameworks,
  fullTokens,
  sections,
  hasBlog,
  hasChangelog,
  otherPages,
  siteUrl,
}: RootIndexOptions): string {
  const sortedFrameworks = [...frameworks].sort();
  let content = `# Video.js v10\n\n`;

  content += `> ${SITE_DESCRIPTION}\n\n`;

  content += `> AI coding agents can install the [Video.js skill](https://github.com/videojs/skills) to find version-matched documentation and follow current Video.js 10 patterns.\n\n`;

  content += `> Video.js 10 ships as \`@videojs/react\` and \`@videojs/html\`. Since version 10, the \`video.js\` package on npm contains no player; install \`video.js@8\` to stay on Video.js 8.\n\n`;

  content += `> Print version-matched installation options without changing files: \`npx @videojs/cli agents init\`. Installation guide index: ${siteUrl}/docs/guides/installation.md\n\n`;

  content += `## Documentation\n\n`;

  for (const fw of sortedFrameworks) {
    const label = frameworkLabel(fw);

    content += `- [${label} documentation](${siteUrl}/docs/framework/${fw}/llms.txt): `;
    content += `Every ${label} guide and reference page, each with a one-line description.\n`;
  }

  content += `\n`;

  if (hasBlog) {
    content += `## Blog\n\n`;
    content += `- [Blog posts](${siteUrl}/blog/llms.txt): Release announcements and articles, newest first.\n\n`;
  }

  if (hasChangelog) {
    content += `## Changelog\n\n`;
    content += `- [Changelog](${siteUrl}/changelog/llms.txt): Release notes for every Video.js 10 version, newest first.\n\n`;
  }

  if (otherPages.length > 0) {
    content += `## Other\n\n`;
    const sorted = [...otherPages].sort((a, b) => a.pathname.localeCompare(b.pathname));

    for (const page of sorted) {
      content += indexEntry(page, siteUrl);
    }

    content += `\n`;
  }

  // The llms.txt convention reserves "Optional" for material a reader can skip when context is short.
  content += `## Optional\n\n`;

  for (const fw of sortedFrameworks) {
    const label = frameworkLabel(fw);
    const tokens = fullTokens?.get(fw);
    const size = tokens ? ` (${formatTokens(tokens)})` : '';

    content += `- [${label} documentation, complete](${siteUrl}/docs/framework/${fw}/llms-full.txt): `;
    content += `Every ${label} page in one file${size}, for tools that ingest a corpus rather than follow links.\n`;
  }

  for (const fw of sortedFrameworks) {
    for (const section of sections?.get(fw) ?? []) {
      content += `- [${frameworkLabel(fw)} ${section.label}, complete](${section.fullUrl}): `;
      content += `Every ${frameworkLabel(fw)} ${sectionNoun(section.label)} page in one file (${formatTokens(section.tokens)}).\n`;
    }
  }

  return content.replace(/\n+$/, '\n');
}

export function generateDocsIndex(
  framework: string,
  pages: PageEntry[],
  siteUrl: string,
  fullTokens?: number,
  sections: SectionFile[] = []
): string {
  const size = fullTokens ? ` (${formatTokens(fullTokens)})` : '';
  let content = `# Video.js v10 — ${frameworkLabel(framework)} Documentation\n\n`;

  content += `> Every page below is also available as Markdown at its \`.md\` URL. `;
  content += `The whole set in one file${size}: ${siteUrl}/docs/framework/${framework}/llms-full.txt\n\n`;

  content += `> Install the [Video.js skill](https://github.com/videojs/skills) to help AI coding agents find version-matched pages from this index.\n\n`;

  content += `> Video.js 10 ships as \`@videojs/${framework}\`. Since version 10, the \`video.js\` package on npm contains no player; install \`video.js@8\` to stay on Video.js 8. To move existing Video.js 8 code, read ${siteUrl}/docs/framework/${framework}/guides/migrate-from-video-js-8.md\n\n`;

  const vidstackPackage = framework === 'react' ? '@vidstack/react' : 'vidstack';

  content += `> Vidstack Player is in security-only maintenance. To move existing \`${vidstackPackage}\` code, read ${siteUrl}/docs/framework/${framework}/guides/migrate-from-vidstack.md\n\n`;

  content += `> Print version-matched installation options without changing files: \`npx @videojs/cli agents init\`, then pass \`--framework ${framework}\` with the other choices. Installation guide index: ${siteUrl}/docs/guides/installation.md\n\n`;

  // Get sidebar filtered for this framework (production only)
  if (!isValidFramework(framework)) return content;

  const filtered = filterSidebarForLlms(sidebar, framework);
  const sectionByLabel = new Map(sections.map((section) => [section.label, section]));

  content += renderSidebarToMarkdown(framework, filtered, pagesBySlug(framework, pages), siteUrl, 0, sectionByLabel);

  return appendIndexFooter(content, siteUrl);
}

export interface SectionFile {
  /** Sidebar label of the top-level section, such as "Guides". */
  label: string;
  /** Directory under the framework's docs that holds the section's pages, such as `reference/api`. */
  directory: string;
  indexUrl: string;
  fullUrl: string;
  /** Estimated size of the complete file. */
  tokens: number;
  index: string;
  full: string;
}

/**
 * An index and a complete file for each top-level sidebar section, written into the directory its pages share. The
 * framework-wide complete file is several times larger than a context window; a section usually fits.
 */
export function buildSectionFiles(framework: string, pages: PageEntry[], siteUrl: string): SectionFile[] {
  if (!isValidFramework(framework)) return [];

  const label = frameworkLabel(framework);
  const bySlug = pagesBySlug(framework, pages);
  const sections = llmsSections(framework);
  const sectionLabels = sectionLabelsBySlug(sections.map(({ section }) => section));

  return sections.map(({ section, slugs, directory }) => {
    const base = `${siteUrl}/docs/framework/${framework}/${directory}`;
    const indexUrl = `${base}/llms.txt`;
    const fullUrl = `${base}/llms-full.txt`;
    const title = `Video.js v10 — ${label} ${section.sidebarLabel}`;
    const body = renderCorpus(framework, slugs, bySlug, siteUrl, sectionLabels);
    const tokens = estimateTokens(body);

    let full = `# ${title} (complete)\n\n`;

    full += `> Every ${label} ${sectionNoun(section.sidebarLabel)} page in one file (${formatTokens(tokens)}). `;
    full += `Index with descriptions: ${indexUrl}\n${body}`;

    let index = `# ${title}\n\n> `;

    const description = sectionDescription(section, framework);

    if (description) index += `${description} `;

    index += `Every page below is also available as Markdown at its \`.md\` URL. `;
    index += `This section in one file (${formatTokens(tokens)}): ${fullUrl}\n\n`;
    index += renderSidebarToMarkdown(framework, section.contents, bySlug, siteUrl);
    index = appendIndexFooter(index, siteUrl, [
      `${label} documentation: ${siteUrl}/docs/framework/${framework}/llms.txt`,
    ]);

    return { label: section.sidebarLabel, directory, indexUrl, fullUrl, tokens, index, full };
  });
}

/** A section label used mid-sentence: lower-case unless it is an acronym such as "API". */
function sectionNoun(label: string): string {
  return /^[A-Z0-9]+$/.test(label) ? label : label.toLowerCase();
}

/** The nearest enclosing section label for every page slug. */
function sectionLabelsBySlug(items: Sidebar, label?: string, labels = new Map<string, string>()): Map<string, string> {
  for (const item of items) {
    if (isSection(item)) {
      sectionLabelsBySlug(item.contents, item.sidebarLabel, labels);
    } else if (!isLink(item) && label) {
      labels.set(item.slug, label);
    }
  }

  return labels;
}

/**
 * Every docs page for a framework in sidebar order, concatenated into one Markdown document, plus the size quoted in
 * its header so every index that links it states the same number.
 */
export function generateDocsCorpus(framework: string, pages: PageEntry[], siteUrl: string) {
  let body = '';

  if (isValidFramework(framework)) {
    const filtered = filterSidebarForLlms(sidebar, framework);

    body = renderCorpus(
      framework,
      sidebarSlugs(filtered),
      pagesBySlug(framework, pages),
      siteUrl,
      sectionLabelsBySlug(filtered)
    );
  }

  const tokens = estimateTokens(body);
  const size = body ? ` (${formatTokens(tokens)})` : '';
  let content = `# Video.js v10 — ${frameworkLabel(framework)} Documentation (complete)\n\n`;

  content += `> Every ${frameworkLabel(framework)} docs page in one file${size}. `;
  content += `Index with descriptions: ${siteUrl}/docs/framework/${framework}/llms.txt\n`;

  return { content: content + body, tokens };
}

/**
 * Pages in sidebar order, each introduced by a source comment. Same-page anchors collide once every page shares one
 * file, so they point back at the heading id on the page they came from, and a title two pages share gains its section
 * label so a heading-based chunker can still tell them apart.
 */
function renderCorpus(
  framework: string,
  slugs: string[],
  bySlug: Map<string, PageEntry>,
  siteUrl: string,
  sectionLabels: Map<string, string>
): string {
  const entries = slugs.flatMap((slug) => {
    const page = bySlug.get(slug);

    return page?.markdown ? [{ slug, page, markdown: page.markdown }] : [];
  });
  const titleCounts = new Map<string, number>();

  for (const { markdown } of entries) {
    const title = firstHeading(markdown);

    if (title) titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
  }

  let body = '';

  for (const { slug, page, markdown } of entries) {
    const installationParams =
      getInstallationRouteSegment(page.pathname) === 'shadcn'
        ? new URLSearchParams({ framework })
        : new URLSearchParams();
    const installation = renderInstallationMarkdownSelection(markdown, page.pathname, installationParams);

    if (installation && installation.status !== 200) {
      throw new Error(`${page.pathname} could not render installation Markdown: ${installation.body.trim()}`);
    }

    const selectedMarkdown = installation?.body ?? markdown;
    let content = outsideCodeFences(selectedMarkdown.trim(), (text) =>
      text.replace(
        /\]\(#([^)\s]*)/g,
        (_match, anchor: string) => `](${siteUrl}${page.pathname}#${page.headingIds?.get(anchor) ?? anchor}`
      )
    );
    const title = firstHeading(content);
    const label = sectionLabels.get(slug);

    if (title && label && (titleCounts.get(title) ?? 0) > 1) {
      content = content.replace(/^# .*$/m, `# ${title} (${label})`);
    }

    body += `\n---\n\n<!-- Source: ${siteUrl}${page.pathname} -->\n\n${content}\n`;
  }

  return body;
}

function firstHeading(markdown: string): string | undefined {
  return /^# (.+)$/m.exec(markdown)?.[1]?.trim();
}

function pagesBySlug(framework: string, pages: PageEntry[]): Map<string, PageEntry> {
  const prefix = `/docs/framework/${framework}/`;
  const installationSlugs = new Map<string, { slug: string; frameworks: readonly SupportedFramework[] }>(
    INSTALLATION_ROUTE_SEGMENTS.map((route) => {
      const { slug, frameworks } = INSTALLATION_ROUTES[route];

      return [getInstallationRoutePath(route), { slug, frameworks }];
    })
  );
  const pageBySlug = new Map<string, PageEntry>();

  for (const page of pages) {
    if (page.pathname.startsWith(prefix)) {
      const slug = page.pathname.slice(prefix.length).replace(/\/$/, '');

      pageBySlug.set(slug, page);
      continue;
    }

    const installation = installationSlugs.get(page.pathname.replace(/\/$/, ''));

    if (installation?.frameworks.some((candidate) => candidate === framework)) {
      pageBySlug.set(installation.slug, page);
    }
  }

  return pageBySlug;
}

function renderSidebarToMarkdown(
  framework: SupportedFramework,
  items: Sidebar,
  pageBySlug: Map<string, PageEntry>,
  siteUrl: string,
  depth: number = 0,
  sectionFiles?: Map<string, SectionFile>
): string {
  let content = '';

  for (const item of items) {
    if (isSection(item)) {
      const heading = '#'.repeat(depth + 2);

      content += `${heading} ${item.sidebarLabel}\n\n`;

      const description = sectionDescription(item, framework);

      if (description) content += `${description}\n\n`;

      const files = depth === 0 ? sectionFiles?.get(item.sidebarLabel) : undefined;

      if (files) {
        content += `Section index: [${files.directory}/llms.txt](${files.indexUrl}). `;
        content += `This section in one file (${formatTokens(files.tokens)}): ${files.fullUrl}\n\n`;
      }

      content += renderSidebarToMarkdown(framework, item.contents, pageBySlug, siteUrl, depth + 1);
    } else if (isLink(item)) {
      const href = item.href.startsWith('/') ? `${siteUrl}${item.href}` : item.href;

      content += `- [${item.sidebarLabel}](${href})\n`;
    } else {
      const page = pageBySlug.get(item.slug);
      if (!page) continue;

      content += indexEntry(page, siteUrl);
    }
  }

  if (content.length > 0 && !content.endsWith('\n\n')) {
    content += '\n';
  }

  return content;
}

function sectionDescription(section: Section, framework: SupportedFramework): string | undefined {
  const { llmsDescription } = section;

  return typeof llmsDescription === 'string' ? llmsDescription : llmsDescription?.[framework];
}

function generateBlogIndex(pages: PageEntry[], siteUrl: string): string {
  const note =
    `Posts published before ${FIRST_V10_BLOG_MONTH} describe earlier Video.js versions (1 through 8); ` +
    `their APIs do not apply to Video.js 10.`;

  return generateChronologicalIndex('Blog', pages, siteUrl, note);
}

function generateChangelogIndex(pages: PageEntry[], siteUrl: string): string {
  return generateChronologicalIndex('Changelog', pages, siteUrl);
}

/** Newest first. Entries on the same day (`sort` is a date) fall back to version-aware pathname order. */
export function generateChronologicalIndex(title: string, pages: PageEntry[], siteUrl: string, note?: string): string {
  let content = `# Video.js v10 — ${title}\n\n`;

  if (note) content += `> ${note}\n\n`;

  const sorted = [...pages].sort(
    (a, b) =>
      (b.sort ?? '').localeCompare(a.sort ?? '') || b.pathname.localeCompare(a.pathname, undefined, { numeric: true })
  );

  for (const post of sorted) {
    content += indexEntry(post, siteUrl, post.sort ? ` (${post.sort.slice(0, 10)})` : '');
  }

  return appendIndexFooter(content, siteUrl);
}
