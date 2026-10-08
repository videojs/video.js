import type { HastContent } from 'satteri';
import { defineHastPlugin } from 'satteri';

type HastProperties = Record<string, unknown>;

interface HastLike {
  type: string;
  tagName?: string;
  name?: string;
  properties?: HastProperties;
  attributes?: unknown[];
  value?: unknown;
  data?: unknown;
  children?: HastLike[];
}

const COPIED_FIELDS = ['tagName', 'name', 'attributes', 'value', 'data'] as const;

function jsxAttribute(name: string, value: unknown) {
  return { type: 'mdxJsxAttribute', name, value: String(value) };
}

function isElement(node: HastLike, tagName: string): boolean {
  return node.type === 'element' && node.tagName === tagName;
}

/** Copies a node into a plain object, swapping each GFM backref link for a `<FootnoteBackref>` component. */
function rewriteDefinitions(node: HastLike): HastLike {
  if (isElement(node, 'a') && node.properties && 'dataFootnoteBackref' in node.properties) {
    return {
      type: 'mdxJsxTextElement',
      name: 'FootnoteBackref',
      attributes: [jsxAttribute('href', node.properties.href), jsxAttribute('label', node.properties.ariaLabel)],
      children: (node.children ?? []).map(rewriteDefinitions),
    };
  }

  const copy: HastLike = { type: node.type };

  // Copy only hast fields; visited nodes also carry the visitor's internal bookkeeping.
  for (const key of COPIED_FIELDS) {
    if (node[key] !== undefined) Object.assign(copy, { [key]: node[key] });
  }

  if (node.properties) copy.properties = { ...node.properties };

  if (node.children) copy.children = node.children.map(rewriteDefinitions);

  return copy;
}

/**
 * Renders GFM footnotes through site components instead of the processor's default markup.
 *
 * Each `<sup><a data-footnote-ref>` becomes `<FootnoteRef>`, the generated `<section data-footnotes>` becomes
 * `<Footnotes>` (which owns the section heading, so the screen-reader-only `<h2>` is dropped and never reaches the `h2`
 * heading override), and each backref becomes `<FootnoteBackref>`. Plain Markdown cannot render JSX, so only MDX
 * documents are rewritten.
 */
export function satteriFootnotes() {
  return defineHastPlugin({
    name: 'astro-footnotes',
    element: {
      filter: ['sup', 'section'],
      visit: (node, ctx) => {
        if (ctx.sourceFormat !== 'mdx') return;

        if (node.tagName === 'sup') {
          const [link] = node.children;
          if (node.children.length !== 1 || link?.type !== 'element' || !('dataFootnoteRef' in link.properties)) return;

          ctx.replaceNode(node, {
            type: 'mdxJsxTextElement',
            name: 'FootnoteRef',
            attributes: [jsxAttribute('href', link.properties.href), jsxAttribute('id', link.properties.id)],
            children: link.children.map((child) => rewriteDefinitions(child as HastLike)),
          } as HastContent);
          return;
        }

        if (!('dataFootnotes' in node.properties)) return;

        const children = (node.children as HastLike[])
          .filter((child) => !isElement(child, 'h2'))
          .map(rewriteDefinitions);

        ctx.replaceNode(node, {
          type: 'mdxJsxFlowElement',
          name: 'Footnotes',
          attributes: [],
          children,
        } as HastContent);
      },
    },
  });
}
