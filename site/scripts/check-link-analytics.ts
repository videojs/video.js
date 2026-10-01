/**
 * Verify off-site links in the built site carry the analytics tags `site/AGENTS.md` asks for: a `destination`
 * autocapture attribute on every off-site link, and a `utm_content` placement on every link to Mux.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getLinkDestination } from '../src/components/typography/linkDestination.ts';

const scriptPath = fileURLToPath(import.meta.url);
const siteDirectory = resolve(scriptPath, '..', '..');

export interface UntaggedLink {
  /** Dist-relative path of the page containing the link. */
  page: string;
  /** The href as written in the built HTML, entities decoded. */
  href: string;
  /** Which tag the link is missing. */
  reason: 'missing-destination' | 'missing-utm-content';
}

const ANCHOR_PATTERN = /<a\s[^>]*>/gis;
const HREF_PATTERN = /\bhref=(?:"([^"]*)"|'([^']*)')/i;
const DESTINATION_PATTERN = /\bdata-ph-capture-attribute-destination=/i;

function walkHtml(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) return walkHtml(path);

      return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
    })
    .sort();
}

/** The analytics tags each off-site link in `html` is missing. */
export function findUntaggedLinks(html: string): Omit<UntaggedLink, 'page'>[] {
  const untagged: Omit<UntaggedLink, 'page'>[] = [];

  for (const [anchor] of html.matchAll(ANCHOR_PATTERN)) {
    const match = anchor.match(HREF_PATTERN);
    const href = (match?.[1] ?? match?.[2] ?? '').replaceAll('&amp;', '&');
    const destination = getLinkDestination(href);
    if (!destination) continue;

    if (!DESTINATION_PATTERN.test(anchor)) untagged.push({ href, reason: 'missing-destination' });

    if (destination === 'mux' && !new URL(href).searchParams.has('utm_content')) {
      untagged.push({ href, reason: 'missing-utm-content' });
    }
  }

  return untagged;
}

export function checkLinkAnalytics(distDirectory: string): UntaggedLink[] {
  const root = resolve(distDirectory);

  return walkHtml(root).flatMap((path) => {
    const page = posix.join(...relative(root, path).split(/[\\/]/));

    return findUntaggedLinks(readFileSync(path, 'utf-8')).map((link) => ({ page, ...link }));
  });
}

function main(): void {
  const distDirectory = resolve(siteDirectory, process.argv[2] ?? 'dist');

  if (!existsSync(distDirectory)) {
    console.error(`✗ ${distDirectory} not found — run \`pnpm build:site\` first.`);
    process.exit(1);
  }

  const untagged = checkLinkAnalytics(distDirectory);

  if (untagged.length === 0) {
    console.log('✓ All off-site links carry their analytics tags.');
    return;
  }

  for (const { page, href, reason } of untagged) {
    const label = reason === 'missing-destination' ? 'no destination attribute' : 'Mux link without utm_content';

    console.error(`✗ ${page}: ${href} (${label})`);
  }

  console.error(
    `\n✗ ${untagged.length} untagged link${untagged.length === 1 ? '' : 's'}. ` +
      'Content links are tagged by A.astro; tag others with getLinkDestination and withMuxAttribution.'
  );
  process.exit(1);
}

const isEntrypoint = process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath);

if (isEntrypoint) main();
