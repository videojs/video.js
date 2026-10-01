import { kebabCase } from '../string/casing';

/** @internal */
export interface InlineStyleSnapshotEntry {
  property: string;
  value: string;
  priority: string;
}

/** @internal */
export type InlineStyleSnapshot = readonly InlineStyleSnapshotEntry[];

function normalizeStyleProperty(property: string): string {
  return property.startsWith('--') ? property : kebabCase(property);
}

/** @internal */
export function getAnchorNames(element: HTMLElement): string[] {
  const value = element.style.getPropertyValue('anchor-name').trim();
  if (!value || value === 'none') return [];

  return value
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

/** @internal */
export function addAnchorName(element: HTMLElement, name: string): () => void {
  const anchor = `--${name}`;
  const anchors = getAnchorNames(element);
  const added = !anchors.includes(anchor);

  if (added) {
    element.style.setProperty('anchor-name', [...anchors, anchor].join(', '));
  }

  return () => {
    if (!added) return;

    const next = getAnchorNames(element).filter((name) => name !== anchor);

    if (next.length) {
      element.style.setProperty('anchor-name', next.join(', '));
    } else {
      element.style.removeProperty('anchor-name');
    }
  };
}

/** @internal */
export function applyStyles(element: HTMLElement, styles: Record<string, string | undefined>): void {
  for (const [prop, value] of Object.entries(styles)) {
    if (typeof value === 'string') {
      element.style.setProperty(normalizeStyleProperty(prop), value);
    }
  }
}

/**
 * Capture authored inline values and priorities for the selected properties.
 *
 * @internal
 */
export function snapshotInlineStyles(element: HTMLElement, properties: Iterable<string>): InlineStyleSnapshot {
  return [...properties].map((property) => {
    const normalizedProperty = normalizeStyleProperty(property);

    return {
      property: normalizedProperty,
      value: element.style.getPropertyValue(normalizedProperty),
      priority: element.style.getPropertyPriority(normalizedProperty),
    };
  });
}

/**
 * Restore a snapshot created by `snapshotInlineStyles`.
 *
 * @internal
 */
export function restoreInlineStyles(element: HTMLElement, snapshot: InlineStyleSnapshot): void {
  for (const { property, value, priority } of snapshot) {
    if (value) {
      element.style.setProperty(property, value, priority);
    } else {
      element.style.removeProperty(property);
    }
  }
}

/**
 * Apply inline styles for a synchronous callback and restore authored styles afterward.
 *
 * @internal
 */
export function withInlineStyles<Result>(
  element: HTMLElement,
  styles: Readonly<Record<string, string | undefined>>,
  callback: () => Result
): Result {
  const snapshot = snapshotInlineStyles(element, Object.keys(styles));

  try {
    applyStyles(element, styles);
    return callback();
  } finally {
    restoreInlineStyles(element, snapshot);
  }
}

/** @internal */
export interface ReadCSSLengthOptions {
  source?: 'inline' | 'computed' | 'inline-or-computed' | undefined;
}

/**
 * Read and resolve a CSS property as a pixel length.
 *
 * @internal
 */
export function readCSSLength(
  element: Element,
  property: string,
  { source = 'inline-or-computed' }: ReadCSSLengthOptions = {}
): number | null {
  const normalizedProperty = normalizeStyleProperty(property);
  let value =
    source !== 'computed' && element instanceof HTMLElement ? element.style.getPropertyValue(normalizedProperty) : '';

  if (!value && source !== 'inline') value = getComputedStyle(element).getPropertyValue(normalizedProperty);

  return value.trim() ? resolveCSSLength(element, value) : null;
}

/** @internal */
export function resolveCSSLength(el: Element, value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const parsed = Number.parseFloat(trimmed);
  if (!Number.isNaN(parsed) && (/^-?\d*\.?\d+$/.test(trimmed) || trimmed.endsWith('px'))) return parsed;

  const doc = el.ownerDocument;
  const root = doc?.documentElement;

  if (!Number.isNaN(parsed) && trimmed.endsWith('rem')) {
    const rootFontSize = root ? Number.parseFloat(getComputedStyle(root).fontSize) || 16 : 16;

    return parsed * rootFontSize;
  }

  if (!Number.isNaN(parsed) && trimmed.endsWith('em')) {
    const fontSize = el instanceof HTMLElement ? Number.parseFloat(getComputedStyle(el).fontSize) || 16 : 16;

    return parsed * fontSize;
  }

  if (!doc) return Number.isNaN(parsed) ? 0 : parsed;

  const measurementEl = doc.createElement('div');

  measurementEl.style.position = 'absolute';
  measurementEl.style.visibility = 'hidden';
  measurementEl.style.pointerEvents = 'none';
  measurementEl.style.inlineSize = trimmed;

  if (!measurementEl.style.inlineSize) return 0;

  measurementEl.style.blockSize = '0';
  measurementEl.style.padding = '0';
  measurementEl.style.border = '0';
  measurementEl.style.inset = '0';

  const computed = getComputedStyle(el);

  measurementEl.style.fontSize = computed.fontSize;

  for (let i = 0; i < computed.length; i++) {
    const name = computed.item(i);

    if (name.startsWith('--')) {
      measurementEl.style.setProperty(name, computed.getPropertyValue(name));
    }
  }

  const parent = doc.body ?? doc.documentElement;
  if (!parent) return Number.isNaN(parsed) ? 0 : parsed;

  parent.appendChild(measurementEl);

  if (getComputedStyle(measurementEl).inlineSize === 'auto') {
    measurementEl.remove();
    return 0;
  }

  const pixels = measurementEl.getBoundingClientRect().width;

  measurementEl.remove();

  if (Number.isFinite(pixels)) return pixels;

  return Number.isNaN(parsed) ? 0 : parsed;
}
