import { Marked, type MarkedExtension, type Tokens } from 'marked';

import { getLinkDestination } from '@/components/typography/linkDestination';
import { shared } from '@/components/typography/styles';
import type { SupportedFramework } from '@/types/docs';
import { withMuxAttribution } from '@/utils/mux/attribution';
import { twMerge } from '@/utils/twMerge';

import { resolveDocsHref } from './routing';
import { findGuideBySlug } from './sidebar';

const classes = {
  p: 'mt-3 first:mt-0',
  ul: twMerge(shared.ul, 'mt-3'),
  ol: twMerge(shared.ol, 'mt-3'),
  li: shared.li,
  code: shared.code,
  strong: shared.strong,
  em: shared.em,
  a: shared.a,
} as const;

/**
 * A framework-agnostic link to a docs page, the form JSDoc uses because it can't know which framework renders it:
 * `https://videojs.org/docs/guides/drm` or `/docs/guides/drm`, with an optional `#anchor`.
 */
const AGNOSTIC_DOCS_LINK = /^(?:https:\/\/videojs\.org)?\/docs\/((?:guides|reference)\/[\w/-]+?)\/?(#[\w-]+)?$/;

let linkFramework: SupportedFramework | null = null;

/**
 * Point an agnostic docs link at the page being rendered's framework. Without one, the link keeps its agnostic path and
 * carries `data-docs-slug`, which `ResolveDocsLinks` upgrades in the browser. Throws on a slug no page has, so a broken
 * JSDoc link fails the build like a broken `<DocsLink>` does.
 */
function resolveAgnosticDocsLink(href: string): { href: string; slug?: string } {
  const match = href.match(AGNOSTIC_DOCS_LINK);
  if (!match) return { href };

  const [, slug, hash = ''] = match;
  if (!findGuideBySlug(slug!)) throw new Error(`No guide found with slug "${slug}" (linked as ${href})`);

  if (linkFramework) return { href: resolveDocsHref({ slug: slug!, framework: linkFramework }) + hash };

  return { href: `/docs/${slug}${hash}`, slug };
}

function escapeHtmlCarets(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const renderer: MarkedExtension['renderer'] = {
  // --- Supported elements ---

  paragraph({ tokens }) {
    return `<p class="${classes.p}">${this.parser.parseInline(tokens)}</p>`;
  },

  list(token: Tokens.List) {
    const tag = token.ordered ? 'ol' : 'ul';
    const cls = token.ordered ? classes.ol : classes.ul;
    const body = token.items.map((item) => this.listitem(item)).join('\n');

    return `<${tag} class="${cls}">${body}</${tag}>`;
  },

  listitem(item: Tokens.ListItem) {
    let body = this.parser.parse(item.tokens);

    if (!item.loose) {
      body = body.replace(/^<p class="[^"]*">/, '').replace(/<\/p>$/, '');
    }

    return `<li class="${classes.li}">${body}</li>`;
  },

  code({ text }) {
    return `<code class="${classes.code}">${escapeHtmlCarets(text)}</code>`;
  },

  codespan({ text }) {
    return `<code class="${classes.code}">${escapeHtmlCarets(text)}</code>`;
  },

  strong({ tokens }) {
    return `<strong class="${classes.strong}">${this.parser.parseInline(tokens)}</strong>`;
  },

  em({ tokens }) {
    return `<em class="${classes.em}">${this.parser.parseInline(tokens)}</em>`;
  },

  link({ href, tokens }) {
    const docs = resolveAgnosticDocsLink(href);
    const destination = getLinkDestination(docs.href);
    const destinationAttribute = destination ? ` data-ph-capture-attribute-destination="${destination}"` : '';
    const slugAttribute = docs.slug ? ` data-docs-slug="${docs.slug}"` : '';
    // Inline Markdown renders reference and guide text, never blog posts.
    const target = destination === 'mux' ? withMuxAttribution(docs.href, 'docs-content') : docs.href;

    return `<a href="${target}" class="${classes.a}"${destinationAttribute}${slugAttribute}>${this.parser.parseInline(tokens)}</a>`;
  },

  // --- Unsupported elements — downgrade or suppress ---

  heading({ tokens }) {
    return `<p class="${classes.p}">${this.parser.parseInline(tokens)}</p>`;
  },

  blockquote({ tokens }) {
    return this.parser.parse(tokens);
  },

  hr() {
    return '';
  },

  image({ href, text }) {
    return text || href;
  },

  table() {
    return '';
  },

  tablerow() {
    return '';
  },

  tablecell() {
    return '';
  },
};

const marked = new Marked({ renderer });

const highlightedMarked = new Marked({
  renderer: {
    ...renderer,
    codespan({ text }) {
      return `<code class="${classes.code}" data-code-inline>${highlightCodespan(text)}</code>`;
    },
  },
});

let highlightCodespan: (code: string) => string = escapeHtmlCarets;

/**
 * Register a syntax highlighter for inline code spans.
 *
 * The highlighter is opt-in because this module also runs where Shiki is not loaded, such as unit tests. Pass the
 * returned HTML for a snippet; `renderInlineMarkdown` wraps it in the shared inline-code chip.
 */
export function setInlineCodeHighlighter(highlight: (code: string) => string): void {
  highlightCodespan = highlight;
}

/**
 * Unwrap a single `<p>` wrapper so simple descriptions sit inline.
 *
 * If the output is a lone `<p class="…">…</p>` with no other block-level elements, strip the wrapper and return only
 * the inner content.
 */
function unwrapSingleParagraph(html: string): string {
  const trimmed = html.trim();
  const match = trimmed.match(/^<p class="[^"]*">([\s\S]*)<\/p>$/);
  if (match && !trimmed.includes('<p', 1)) return match[1]!;

  return trimmed;
}

export function renderInlineMarkdown(
  markdown: string,
  { highlight = false, framework = null }: { highlight?: boolean; framework?: SupportedFramework | null } = {}
): string {
  // Parsing is synchronous, so the link renderer reads this framework for this call only.
  linkFramework = framework;

  try {
    const raw = (highlight ? highlightedMarked : marked).parse(markdown);
    if (typeof raw !== 'string') return markdown;

    return unwrapSingleParagraph(raw);
  } finally {
    linkFramework = null;
  }
}
