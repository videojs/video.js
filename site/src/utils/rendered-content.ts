/**
 * Normalizers for rendered page markup that will be read away from the page: Markdown twins for agents and feed items
 * for readers. Neither runs the site's scripts or stylesheet, so markup that only works with them is rewritten into
 * plain structure.
 *
 * Components opt markup in or out for both readers alike: `data-llms-ignore` drops page-only chrome, and
 * `data-llms-only` holds a hidden text alternative that these readers get instead.
 */

/** Rewrite rendered content in place into markup that reads correctly without the site's scripts and stylesheet. */
export function normalizeRenderedContent(root: Element): void {
  // Drop opted-out markup along with scripts and styles (which include Astro island hydration scripts).
  for (const element of root.querySelectorAll('[data-llms-ignore], script, style')) {
    element.remove();
  }

  for (const element of root.querySelectorAll('[data-llms-only]')) {
    element.removeAttribute('hidden');
  }

  resolveStreamedContent(root);
  unwrapTransparentWrappers(root);
  flattenApiTables(root);
  flattenHiddenDetailRows(root);
  flattenAsides(root);
  demoteStepTitles(root);
  joinCodeChips(root);
  flattenTabs(root);
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
  for (const wrapper of root.querySelectorAll('astro-slot, astro-static-slot, astro-island')) {
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
 * Tab groups render every panel in the HTML, so a reader would see the tab labels as stray words followed by anonymous
 * blocks. Replace each group with its panels in order, each introduced by its label. A single code frame whose label is
 * just the language (or the generic `code` fallback) keeps only the code, since the code block already carries it.
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

/** Move every child of `source` before `reference`, or append them to `target` when no reference is given. */
export function moveChildrenBefore(source: Element, reference: Element | null, target: Element | null = null): void {
  const parent = reference?.parentNode ?? target;
  if (!parent) return;

  while (source.firstChild) {
    parent.insertBefore(source.firstChild, reference);
  }
}

export function unwrap(element: Element): void {
  moveChildrenBefore(element, element);
  element.remove();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Element.classList is not implemented consistently across DOM shims, so read the attribute directly. */
export function hasClass(element: Element, className: string): boolean {
  return (element.getAttribute('class') ?? '').split(/\s+/).includes(className);
}

export function collapseWhitespace(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
