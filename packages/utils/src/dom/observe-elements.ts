import { noop } from '../function/noop';
import { getDevicePixelRatio, watchDevicePixelRatio } from './device-pixel-ratio';
import type { ElementSize } from './layout';

/** @internal */
export type ObservedElements = Element | Iterable<Element>;

/**
 * Observe one or more elements for size changes and return a cleanup function.
 *
 * @internal
 */
export function observeResize(elements: ObservedElements, callback: ResizeObserverCallback): () => void {
  if (typeof ResizeObserver === 'undefined') return noop;

  const observer = new ResizeObserver(callback);
  const targets = Symbol.iterator in Object(elements) ? (elements as Iterable<Element>) : [elements as Element];

  for (const element of targets) observer.observe(element);

  return () => observer.disconnect();
}

/** @internal */
export interface ObserveElementsOptions {
  /** Resolve the current set of elements to resize-observe. */
  getElements: () => Iterable<Element>;
  /** Called when an observed element resizes or the configured root mutates. */
  onChange: () => void;
  /** Optional root whose mutations can change the observed element set. */
  root?: Node | undefined;
  /** Mutation options used to refresh the observed element set. */
  mutations?: MutationObserverInit | false | undefined;
}

/**
 * Observe a dynamically resolved element set. When the optional root mutates, the set is resolved again before
 * `onChange` is called.
 *
 * @internal
 */
export function observeElements({ getElements, onChange, root, mutations }: ObserveElementsOptions): () => void {
  let stopObservingResize = noop;

  const observeCurrentElements = () => {
    stopObservingResize();
    stopObservingResize = observeResize(getElements(), onChange);
  };

  observeCurrentElements();

  let mutationObserver: MutationObserver | null = null;

  if (root && mutations !== false && typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      observeCurrentElements();
      onChange();
    });
    mutationObserver.observe(root, mutations ?? { childList: true });
  }

  return () => {
    mutationObserver?.disconnect();
    stopObservingResize();
  };
}

function toElementSize(entry: ResizeObserverEntry): ElementSize {
  const box = entry.contentBoxSize[0];

  return { width: box?.inlineSize ?? 0, height: box?.blockSize ?? 0 };
}

/**
 * Call `onResize` with `element`'s content box whenever it changes, starting with the observer's initial delivery.
 * Returns a cleanup function.
 *
 * @internal
 */
export function observeElementSize(element: Element, onResize: (size: ElementSize) => void): () => void {
  return observeResize(element, (entries) => {
    const entry = entries[entries.length - 1];

    if (entry) onResize(toElementSize(entry));
  });
}

/** @internal */
export interface RenderedSize extends ElementSize {
  /** `devicePixelRatio` at measurement time — CSS pixels × `scale` per axis. */
  scale: number;
}

/**
 * Call `onResize` with `element`'s content box and the current `devicePixelRatio` whenever either changes. Returns a
 * cleanup function to stop both watchers.
 *
 * @internal
 */
export function observeRenderedSize(element: Element, onResize: (size: RenderedSize) => void): () => void {
  let size: ElementSize | undefined;

  const emit = () => {
    if (size) onResize({ ...size, scale: getDevicePixelRatio() });
  };

  const stopObservingSize = observeElementSize(element, (next) => {
    size = next;
    emit();
  });
  const stopWatchingDevicePixelRatio = watchDevicePixelRatio(emit);

  return () => {
    stopObservingSize();
    stopWatchingDevicePixelRatio();
  };
}
