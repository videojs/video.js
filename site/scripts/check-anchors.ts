/** Verify fragment links in the built site resolve to an element id on the target page. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const siteDirectory = resolve(scriptPath, '..', '..');

export interface BrokenAnchor {
  /** Dist-relative path of the page containing the link. */
  page: string;
  /** The raw href as written in the built HTML. */
  href: string;
  /** Why the link cannot resolve. */
  reason: 'missing-anchor' | 'missing-page';
}

const ID_PATTERN = /\bid=(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
const HREF_PATTERN = /<a\s[^>]*?\bhref=(?:"([^"]*)"|'([^']*)')/gis;
const EXTERNAL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function walkHtml(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) return walkHtml(path);

      return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
    })
    .sort();
}

export function collectIds(html: string): Set<string> {
  const ids = new Set<string>();

  for (const match of html.matchAll(ID_PATTERN)) {
    ids.add(match[1] ?? match[2] ?? match[3] ?? '');
  }

  return ids;
}

function collectFragmentHrefs(html: string): string[] {
  const hrefs: string[] = [];

  for (const match of html.matchAll(HREF_PATTERN)) {
    const href = match[1] ?? match[2] ?? '';

    if (href.includes('#') && !EXTERNAL_PATTERN.test(href)) hrefs.push(href);
  }

  return hrefs;
}

/** Resolve a link path to the dist-relative HTML file that serves it, or undefined. */
function resolveTargetPage(distDirectory: string, pagePath: string): string | undefined {
  const normalized = posix.normalize(pagePath).replace(/^\/+/, '').replace(/\/+$/, '');
  const candidates =
    normalized === '' ? ['index.html'] : [normalized, `${normalized}/index.html`, `${normalized}.html`];

  for (const candidate of candidates) {
    if (!candidate.endsWith('.html')) continue;

    const absolute = join(distDirectory, candidate);
    if (existsSync(absolute) && statSync(absolute).isFile()) return candidate;
  }

  return undefined;
}

/**
 * Resolve a framework-agnostic docs path such as `/docs/guides/casting` to the framework pages its on-demand route can
 * redirect to. The redirect keeps the fragment, so the anchor has to exist on every one of them.
 */
function resolveAgnosticDocsPages(distDirectory: string, pagePath: string): string[] {
  const match = /^\/docs\/(?!framework\/)(.+)$/.exec(pagePath);
  const frameworkDirectory = join(distDirectory, 'docs', 'framework');
  if (!match || !existsSync(frameworkDirectory)) return [];

  return readdirSync(frameworkDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolveTargetPage(distDirectory, `/docs/framework/${entry.name}/${match[1]}`))
    .filter((page): page is string => page !== undefined);
}

export function checkAnchors(distDirectory: string): BrokenAnchor[] {
  const root = resolve(distDirectory);
  const pages = walkHtml(root).map((path) =>
    posix.join(
      ...resolve(path)
        .slice(root.length + 1)
        .split(/[\\/]/)
    )
  );
  const idsByPage = new Map(pages.map((page) => [page, collectIds(readFileSync(join(distDirectory, page), 'utf-8'))]));

  const broken: BrokenAnchor[] = [];

  for (const page of pages) {
    const html = readFileSync(join(distDirectory, page), 'utf-8');

    // Relative hrefs resolve against the served URL, not the dist layout:
    // `a/b/index.html` is served at `/a/b` (`trailingSlash: 'never'`), so `../`
    // climbs from `/a`, one level above the index.html's own directory.
    const urlPath = page.replace(/\/?index\.html$/, '').replace(/\.html$/, '');
    const urlDirectory = posix.dirname(urlPath);

    for (const href of collectFragmentHrefs(html)) {
      const hashIndex = href.indexOf('#');
      const rawPath = href.slice(0, hashIndex).split('?')[0] ?? '';
      const fragment = decodeURIComponent(href.slice(hashIndex + 1));
      if (fragment === '' || fragment.startsWith(':~:')) continue;

      let targetPages: string[];

      if (rawPath === '') {
        targetPages = [page];
      } else if (rawPath.startsWith('/')) {
        const absolutePath = decodeURIComponent(rawPath);
        const targetPage = resolveTargetPage(distDirectory, absolutePath);

        targetPages = targetPage ? [targetPage] : resolveAgnosticDocsPages(distDirectory, absolutePath);
      } else {
        const targetPage = resolveTargetPage(
          distDirectory,
          posix.join(urlDirectory === '.' ? '' : urlDirectory, decodeURIComponent(rawPath))
        );

        targetPages = targetPage ? [targetPage] : [];
      }

      if (targetPages.length === 0) {
        broken.push({ page, href, reason: 'missing-page' });
        continue;
      }

      if (targetPages.some((targetPage) => !idsByPage.get(targetPage)?.has(fragment))) {
        broken.push({ page, href, reason: 'missing-anchor' });
      }
    }
  }

  return broken;
}

function main(): void {
  const distDirectory = resolve(siteDirectory, process.argv[2] ?? 'dist');

  if (!existsSync(distDirectory)) {
    console.error(`✗ ${distDirectory} not found — run \`pnpm build:site\` first.`);
    process.exit(1);
  }

  const broken = checkAnchors(distDirectory);

  if (broken.length === 0) {
    console.log('✓ All fragment links resolve to an element id.');
    return;
  }

  for (const { page, href, reason } of broken) {
    const label = reason === 'missing-page' ? 'target page not found' : 'missing anchor';

    console.error(`✗ ${page}: ${href} (${label})`);
  }

  console.error(`\n✗ ${broken.length} broken fragment link${broken.length === 1 ? '' : 's'}.`);
  process.exit(1);
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath);

if (isEntrypoint) main();
