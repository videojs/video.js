import { isFunction } from '@videojs/utils/predicate';
import { escapeHtml } from '@videojs/utils/string';

/**
 * A seekable timeline the HyperFrames runtime can drive. GSAP's `gsap.timeline()` is one; the runtime pauses it and
 * seeks it to the playhead on every frame, so it never plays on its own clock.
 *
 * @internal
 */
export interface HyperFramesTimeline {
  duration(): number;
  seek(time: number, suppressEvents?: boolean): unknown;
  pause(): unknown;
}

/**
 * Builds the timeline once the markup is in the composition document. `root` is the composition root, so selectors
 * scoped to it (`root.querySelector('.title')`) only ever reach this composition.
 *
 * @internal
 */
export type HyperFramesTimelineFactory = (root: HTMLElement) => HyperFramesTimeline;

/**
 * Mounts markup into the composition root and resolves once it is there. The React façade portals its children through
 * one; a page can use one to build the markup in script.
 *
 * @internal
 */
export type HyperFramesMount = (root: HTMLElement) => void | Promise<void>;

/**
 * Inline markup: an HTML string, a `<template>` whose content is used, or a function that mounts it.
 *
 * @internal
 */
export type HyperFramesContent = string | HTMLTemplateElement | HyperFramesMount;

/**
 * What plays: a HyperFrames composition, written inline or loaded as a document. Exactly one of `content`, `html`, and
 * `src` names it; when more than one is set, they are read in that order.
 *
 * - `content` is markup the page owns. It plays in a same-origin frame, so `timeline` can build its animation from the
 *   page's own GSAP.
 * - `html` and `src` are whole composition documents with their own scripts. They play in an opaque frame, which keeps
 *   their scripts away from the page, so they register their own timelines the way HyperFrames compositions do.
 *
 * @internal
 */
export interface HyperFramesSource {
  /**
   * Names the composition. It is what `src` and `currentSrc` report for inline content (`hyperframes:<id>`), and the
   * `data-composition-id` the composition root takes when its markup does not set one. A source with a new `id` is a
   * new source; edits to the same `id` are not, so a re-render that rebuilds the object does not restart playback.
   * Defaults to `main`.
   */
  id?: string;
  /** Inline markup for the composition. */
  content?: HyperFramesContent;
  /** Builds the composition's timeline from its root. Only read for `content`. */
  timeline?: HyperFramesTimelineFactory;
  /** A whole composition document. */
  html?: string;
  /** URL of a composition document. It is fetched, so a cross-origin one needs CORS. */
  src?: string;
  /** Composition width in pixels, when the markup does not declare `data-width`. Defaults to 1920. */
  width?: number;
  /** Composition height in pixels, when the markup does not declare `data-height`. Defaults to 1080. */
  height?: number;
}

/** @internal */
export type HyperFramesSourceKind = 'inline' | 'document';

/** @internal */
export const DEFAULT_COMPOSITION_ID = 'main';

/** @internal */
export const DEFAULT_COMPOSITION_WIDTH = 1920;

/** @internal */
export const DEFAULT_COMPOSITION_HEIGHT = 1080;

/**
 * The runtime build the adapter injects, pinned so a composition always meets the protocol the adapter speaks.
 *
 * @internal
 */
export const DEFAULT_RUNTIME_SRC =
  'https://cdn.jsdelivr.net/npm/@hyperframes/core@0.9.17/dist/hyperframe.runtime.iife.js';

/** @internal */
export function getSourceKind(source: HyperFramesSource): HyperFramesSourceKind | null {
  if (source.content) return 'inline';

  if (source.html || source.src) return 'document';

  return null;
}

/** @internal */
export function getCompositionId(source: HyperFramesSource): string {
  return source.id || DEFAULT_COMPOSITION_ID;
}

/**
 * What `src` and `currentSrc` report: the document URL, or a name for markup that has none. Store features gate on a
 * non-empty source string, so inline content needs one.
 *
 * @internal
 */
export function getSourceSrc(source: HyperFramesSource | null): string {
  if (!source) return '';

  if (source.content) return `hyperframes:${getCompositionId(source)}`;

  if (source.html) return source.src || `hyperframes:${getCompositionId(source)}`;

  return source.src ?? '';
}

/**
 * Whether two sources name the same thing to play. Everything a page rebuilds on each render (a mount function, a
 * timeline factory) is left out, so only what changes the composition counts: its `id`, its document, or the template
 * or markup string it is written in.
 *
 * @internal
 */
export function isSameSource(a: HyperFramesSource | null, b: HyperFramesSource | null): boolean {
  if (a === b) return true;

  if (!a || !b) return false;

  const kind = getSourceKind(a);
  if (kind !== getSourceKind(b) || getCompositionId(a) !== getCompositionId(b)) return false;

  if (kind === 'document') return (a.html ?? '') === (b.html ?? '') && (a.src ?? '') === (b.src ?? '');

  const contentA = a.content;
  const contentB = b.content;
  // A mount function is rebuilt on every render; the `id` alone tells one composition from the next.
  if (isFunction(contentA) && isFunction(contentB)) return true;

  return contentA === contentB && a.width === b.width && a.height === b.height;
}

/** Attribute the mount container carries, so the adapter can find it again in the document it wrote. */
const MOUNT_ATTR = 'data-videojs-hyperframes-root';

/**
 * The document an inline composition is written into. The markup goes inside a mount container sized to the
 * composition; the runtime is injected after the document loads, so it finds the markup and the timeline in place. The
 * timeline registry exists from the start, because markup scripts register on it before the runtime would make it.
 *
 * @internal
 */
export function buildInlineDocument(markup: string, baseUrl: string): string {
  return /*html*/ `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <base href="${escapeHtml(baseUrl)}" />
    <style>
      html, body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
      [${MOUNT_ATTR}] { position: relative; overflow: hidden; }
    </style>
    <script>window.__timelines = window.__timelines || {};</script>
  </head>
  <body><div ${MOUNT_ATTR}>${markup}</div></body>
</html>`;
}

/** @internal */
export function getMountContainer(doc: Document): HTMLElement | null {
  return doc.querySelector<HTMLElement>(`[${MOUNT_ATTR}]`);
}

/**
 * Settle the composition root inside the mount container: markup that declares its own `data-composition-id` keeps it,
 * and otherwise the container becomes the root. Either way the root ends up with the id and size the runtime reads.
 *
 * @internal
 */
export function resolveCompositionRoot(container: HTMLElement, source: HyperFramesSource): HTMLElement {
  const root = container.querySelector<HTMLElement>('[data-composition-id]') ?? container;

  if (!root.hasAttribute('data-composition-id')) root.setAttribute('data-composition-id', getCompositionId(source));

  if (!root.hasAttribute('data-width'))
    root.setAttribute('data-width', String(source.width ?? DEFAULT_COMPOSITION_WIDTH));

  if (!root.hasAttribute('data-height'))
    root.setAttribute('data-height', String(source.height ?? DEFAULT_COMPOSITION_HEIGHT));

  // The container lays out at the composition's size whichever element is the root, so the frame can be scaled to fit.
  container.style.width = `${root.getAttribute('data-width')}px`;
  container.style.height = `${root.getAttribute('data-height')}px`;

  return root;
}

/**
 * A composition document with the runtime first in its head, so it is installed before any of the document's own
 * scripts run, and a `<base>` so the document's relative URLs resolve against where it came from rather than against
 * the page. A document that already carries the runtime is left alone.
 *
 * @internal
 */
export function buildCompositionDocument(html: string, runtimeSrc: string, baseUrl: string): string {
  const head = /<head(?:\s[^>]*)?>/i.exec(html);
  const hasBase = /<base\s/i.test(html);
  const hasRuntime = /hyperframe\.runtime\.iife\.js|__hyperframes\s*=/.test(html);
  const injected =
    (hasBase ? '' : `<base href="${escapeHtml(baseUrl)}" />`) +
    (hasRuntime ? '' : `<script src="${escapeHtml(runtimeSrc)}"></script>`);
  if (!injected) return html;

  if (head) return html.slice(0, head.index + head[0].length) + injected + html.slice(head.index + head[0].length);

  // No head: a fragment or a head-less document. Anything before the first script still sees the runtime first.
  const htmlTag = /<html(?:\s[^>]*)?>/i.exec(html);

  if (htmlTag) {
    const end = htmlTag.index + htmlTag[0].length;

    return `${html.slice(0, end)}<head>${injected}</head>${html.slice(end)}`;
  }

  return `<!doctype html><html><head>${injected}</head><body>${html}</body></html>`;
}
