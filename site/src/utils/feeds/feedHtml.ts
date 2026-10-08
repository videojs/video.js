import { parseHTML } from 'linkedom';

import { normalizeRenderedContent, unwrap } from '@/utils/rendered-content';

/**
 * Markup with no meaning in a feed reader: nothing runs there, no stylesheet applies, and anything hidden from
 * assistive technology is decoration (icons, heading anchors).
 */
const DROPPED_SELECTOR = 'link, noscript, [aria-hidden="true"]';

/** Elements that carry content even when they have no text. */
const MEDIA_SELECTOR = 'img, picture, video, audio, iframe, svg';

/** Elements that already start on their own line, so unwrapping a wrapper around them changes nothing visible. */
const BLOCK_SELECTOR =
  'blockquote, details, div, dl, figure, h1, h2, h3, h4, h5, h6, hr, ol, p, pre, section, table, ul';

/** Attributes that hold a single URL. */
const URL_ATTRIBUTES = ['href', 'src', 'poster', 'cite'];

/** Hooks for the site's stylesheet and scripts. A feed has neither, so they are dead weight. */
const PRESENTATION_ATTRIBUTE = /^(?:class|style|data-.+)$/;

function toAbsoluteUrl(value: string, base: URL): string {
  // Schemes other than the page's own (mailto:, data:) have nothing to resolve.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;

  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
}

function toAbsoluteSrcset(value: string, base: URL): string {
  return value
    .split(',')
    .map((candidate) => {
      const [url, ...descriptors] = candidate.trim().split(/\s+/);

      return url ? [toAbsoluteUrl(url, base), ...descriptors].join(' ') : '';
    })
    .filter(Boolean)
    .join(', ');
}

/** Astro leaves render markers (`<!--astro:end-->`) behind. */
function removeComments(root: Element): void {
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const child of [...element.childNodes]) {
      if (child.nodeType === child.COMMENT_NODE) child.remove();
    }
  }
}

function hasOwnText(element: Element): boolean {
  return [...element.childNodes].some((child) => child.nodeType === child.TEXT_NODE && child.textContent?.trim());
}

function holdsOnlyBlocks(element: Element): boolean {
  return !hasOwnText(element) && [...element.children].every((child) => child.matches(BLOCK_SELECTOR));
}

function isEmpty(element: Element): boolean {
  return !element.textContent?.trim() && !element.querySelector(MEDIA_SELECTOR);
}

/**
 * Turn rendered page markup into feed markup: plain semantic HTML that reads the same in every reader, with every URL
 * absolute because an item is read far from its page.
 *
 * @param entryUrl - The entry's own URL. Relative links resolve against it, so in-page `#fragment` links still land.
 */
export function cleanFeedHtml(html: string, entryUrl: URL): string {
  const { document } = parseHTML(`<!doctype html><html><body><div id="feed-root">${html}</div></body></html>`);
  const root = document.getElementById('feed-root');
  if (!root) return '';

  // Shared with the Markdown twins: asides, tabs, and code frames become plain structure, and islands keep only their
  // server-rendered markup.
  normalizeRenderedContent(root);

  for (const node of root.querySelectorAll(DROPPED_SELECTOR)) node.remove();

  for (const element of root.querySelectorAll('*')) {
    for (const { name } of [...element.attributes]) {
      if (PRESENTATION_ATTRIBUTE.test(name)) element.removeAttribute(name);
    }

    for (const name of URL_ATTRIBUTES) {
      const value = element.getAttribute(name);

      if (value) element.setAttribute(name, toAbsoluteUrl(value, entryUrl));
    }

    const srcset = element.getAttribute('srcset');

    if (srcset) element.setAttribute('srcset', toAbsoluteSrcset(srcset, entryUrl));
  }

  // A bare span means nothing once its styling is gone; in code it was only a token's color.
  for (const span of root.querySelectorAll('span')) {
    if (span.attributes.length === 0) unwrap(span);
  }

  // Layout wrappers mean nothing once their decoration is gone: drop the empty ones and unwrap the ones that only group
  // blocks. A wrapper around text or inline elements stays, so its content doesn't run into its neighbours'.
  for (const wrapper of [...root.querySelectorAll('div')].reverse()) {
    if (isEmpty(wrapper)) wrapper.remove();
    else if (wrapper.attributes.length === 0 && holdsOnlyBlocks(wrapper)) unwrap(wrapper);
  }

  removeComments(root);

  return root.innerHTML.trim();
}
