import { parseHTML } from 'linkedom';

/**
 * Markup with no meaning in a feed reader: nothing runs there, no stylesheet applies, and anything hidden from
 * assistive technology is decoration (icons, heading anchors).
 */
const DROPPED_SELECTOR = 'script, style, link, noscript, template, [aria-hidden="true"]';

/** Wrappers Astro puts around slotted content. The content stays. */
const UNWRAPPED_SELECTOR = 'astro-slot, astro-static-slot';

/**
 * Parents that make an island part of the prose, like a link in the middle of a sentence. Its server-rendered markup
 * reads fine without hydrating. Anywhere else an island is a standalone widget, such as a player demo, that only works
 * on the page.
 */
const PHRASING_PARENTS = new Set([
  'p',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'td',
  'th',
  'dt',
  'dd',
  'figcaption',
  'a',
  'em',
  'strong',
  'span',
]);

/** Elements that carry content even when they have no text. */
const MEDIA_SELECTOR = 'img, picture, video, audio, iframe, svg';

/** Attributes that hold a single URL. */
const URL_ATTRIBUTES = ['href', 'src', 'poster', 'cite'];

/** Hooks for the site's stylesheet and scripts. A feed has neither, so they are dead weight. */
const PRESENTATION_ATTRIBUTE = /^(?:class|style|data-.+)$/;

const FALLBACK_MARKER = 'data-feed-fallback';

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

function unwrap(element: Element): void {
  while (element.firstChild) element.parentNode?.insertBefore(element.firstChild, element);

  element.remove();
}

function replaceWidget(island: Element, entryUrl: URL): void {
  // Adjacent widgets (a player and its controls) share one pointer back to the page. Islands are visited last to first,
  // so a neighbour's pointer is the next sibling.
  if (island.nextElementSibling?.hasAttribute(FALLBACK_MARKER)) {
    island.remove();
    return;
  }

  const document = island.ownerDocument;
  const paragraph = document.createElement('p');
  const emphasis = document.createElement('em');
  const link = document.createElement('a');

  paragraph.setAttribute(FALLBACK_MARKER, '');
  link.setAttribute('href', entryUrl.href);
  link.textContent = 'View the interactive example on the web.';
  emphasis.append(link);
  paragraph.append(emphasis);
  island.replaceWith(paragraph);
}

/** Astro leaves render markers (`<!--astro:end-->`) behind. */
function removeComments(root: Element): void {
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const child of [...element.childNodes]) {
      if (child.nodeType === child.COMMENT_NODE) child.remove();
    }
  }
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

  for (const node of root.querySelectorAll(DROPPED_SELECTOR)) node.remove();

  for (const node of root.querySelectorAll(UNWRAPPED_SELECTOR)) unwrap(node);

  // Innermost first, so a nested island is settled before its parent decides.
  for (const island of [...root.querySelectorAll('astro-island')].reverse()) {
    if (PHRASING_PARENTS.has(island.parentElement?.localName ?? '')) unwrap(island);
    else replaceWidget(island, entryUrl);
  }

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

  // Layout wrappers left with nothing in them once their decoration is gone.
  for (const wrapper of [...root.querySelectorAll('div')].reverse()) {
    if (isEmpty(wrapper)) wrapper.remove();
  }

  removeComments(root);

  return root.innerHTML.trim();
}
