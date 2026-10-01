import { withInlineStyles } from './style';

/** @internal */
export interface ElementSize {
  width: number;
  height: number;
}

/** @internal */
export interface LogicalBoxEdges {
  inlineStart: number;
  inlineEnd: number;
  blockStart: number;
  blockEnd: number;
}

/** @internal */
export type ElementSizeBox = 'bounding' | 'layout';
/** @internal */
export type ElementOverflowMeasurement = 'none' | 'width' | 'height' | 'both';

/** @internal */
export interface GetElementSizeOptions {
  /** Measure the transformed bounding box or the untransformed layout box. */
  box?: ElementSizeBox | undefined;
  /** Include overflowing scroll dimensions on the selected axes. */
  overflow?: ElementOverflowMeasurement | undefined;
}

/**
 * Read an element's current rendered size.
 *
 * @internal
 */
export function getElementSize(
  element: HTMLElement,
  { box = 'bounding', overflow = 'none' }: GetElementSizeOptions = {}
): ElementSize {
  const rect = element.getBoundingClientRect();
  let width = box === 'layout' ? element.offsetWidth || rect.width : rect.width;
  let height = box === 'layout' ? element.offsetHeight || rect.height : rect.height;

  if (overflow === 'width' || overflow === 'both') width = Math.max(width, element.scrollWidth);

  if (overflow === 'height' || overflow === 'both') height = Math.max(height, element.scrollHeight);

  return { width, height };
}

/**
 * Whether a viewport point, such as a mouse event's `clientX` and `clientY`, falls inside an element's border box. The
 * right and bottom edges are outside, matching how the browser hit-tests. An element with no size contains nothing.
 *
 * @internal
 */
export function isPointInElement(element: Element, point: { clientX: number; clientY: number }): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    point.clientX >= rect.left &&
    point.clientX < rect.right &&
    point.clientY >= rect.top &&
    point.clientY < rect.bottom
  );
}

/** @internal */
export interface MeasureElementOptions extends GetElementSizeOptions {
  /** Inline styles temporarily applied while measuring. */
  styles?: Readonly<Record<string, string | undefined>> | undefined;
}

/**
 * Measure an element with optional temporary inline style overrides.
 *
 * @internal
 */
export function measureElement(element: HTMLElement, options: MeasureElementOptions = {}): ElementSize {
  const { styles, ...sizeOptions } = options;
  const measure = () => getElementSize(element, sizeOptions);

  return styles ? withInlineStyles(element, styles, measure) : measure();
}

/**
 * Read logical padding edges in pixels.
 *
 * @internal
 */
export function getElementPadding(element: Element): LogicalBoxEdges {
  const style = getComputedStyle(element);

  return {
    inlineStart: Number.parseFloat(style.paddingInlineStart) || 0,
    inlineEnd: Number.parseFloat(style.paddingInlineEnd) || 0,
    blockStart: Number.parseFloat(style.paddingBlockStart) || 0,
    blockEnd: Number.parseFloat(style.paddingBlockEnd) || 0,
  };
}

/** @internal */
export function getInlineExtent(edges: LogicalBoxEdges): number {
  return edges.inlineStart + edges.inlineEnd;
}

/** @internal */
export function getBlockExtent(edges: LogicalBoxEdges): number {
  return edges.blockStart + edges.blockEnd;
}

function getPaddingOrigin(element: Element): { x: number; y: number } {
  const style = getComputedStyle(element);

  return {
    x: Number.parseFloat(style.paddingLeft) || 0,
    y: Number.parseFloat(style.paddingTop) || 0,
  };
}

/** @internal */
export interface ChildMeasurement {
  element: HTMLElement;
  size: ElementSize;
  offsetLeft: number;
  offsetTop: number;
}

/** @internal */
export interface MeasureElementChildrenOptions {
  /** Children to measure. Defaults to direct HTMLElement children. */
  children?: Iterable<HTMLElement> | undefined;
  /** Include the container's logical padding. */
  includePadding?: boolean | undefined;
  /** Constrain the resulting width and remeasure children at that width. */
  maxWidth?: number | null | undefined;
  /** Child measurement strategy. The optional width is the constrained content width. */
  measure?: ((element: HTMLElement, width?: number) => ElementSize) | undefined;
  /** Resolve content size from measurements. Defaults to their layout bounds. */
  resolveSize?: ((measurements: readonly ChildMeasurement[]) => ElementSize) | undefined;
}

function defaultResolveChildrenSize(measurements: readonly ChildMeasurement[]): ElementSize {
  if (measurements.length === 0) return { width: 0, height: 0 };

  const width = Math.max(...measurements.map(({ offsetLeft, size }) => offsetLeft + size.width));
  const firstTop = measurements[0]!.offsetTop;
  const hasDistinctOffsets = measurements.some(({ offsetTop }) => offsetTop !== firstTop);
  const height = hasDistinctOffsets
    ? Math.max(...measurements.map(({ offsetTop, size }) => offsetTop + size.height))
    : measurements.reduce((total, { size }) => total + size.height, 0);

  return { width, height };
}

/**
 * Measure the layout occupied by a collection of child elements.
 *
 * @internal
 */
export function measureElementChildren(
  container: HTMLElement,
  {
    children,
    includePadding = false,
    maxWidth = null,
    measure = (element, width) =>
      measureElement(element, width === undefined ? undefined : { styles: { width: `${width}px` } }),
    resolveSize = defaultResolveChildrenSize,
  }: MeasureElementChildrenOptions = {}
): ElementSize {
  const elements = [
    ...(children ?? Array.from(container.children).filter((child) => child instanceof HTMLElement)),
  ].filter((element) => !element.hidden);
  const padding = includePadding
    ? getElementPadding(container)
    : { inlineStart: 0, inlineEnd: 0, blockStart: 0, blockEnd: 0 };
  const inlinePadding = getInlineExtent(padding);
  const blockPadding = getBlockExtent(padding);
  const paddingOrigin = includePadding ? getPaddingOrigin(container) : { x: 0, y: 0 };

  if (elements.length === 0) return { width: inlinePadding, height: blockPadding };

  const collect = (width?: number): ChildMeasurement[] =>
    elements.map((element) => ({
      element,
      size: measure(element, width),
      offsetLeft: element.offsetLeft - paddingOrigin.x,
      offsetTop: element.offsetTop - paddingOrigin.y,
    }));

  let measurements = collect();
  const naturalSize = resolveSize(measurements);
  const naturalWidth = naturalSize.width + inlinePadding;
  const width = maxWidth === null ? naturalWidth : Math.min(naturalWidth, Math.max(0, maxWidth));

  if (width < naturalWidth) measurements = collect(Math.max(0, width - inlinePadding));

  const size = resolveSize(measurements);

  return { width, height: size.height + blockPadding };
}
