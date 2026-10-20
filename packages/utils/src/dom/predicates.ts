/** @internal */
export function isDocument(value: unknown): value is Document {
  return value instanceof Node && value.nodeType === 9;
}

/** @internal */
export function isShadowRoot(value: unknown): value is ShadowRoot {
  return value instanceof Node && value.nodeType === 11 && 'host' in value;
}

/** @internal */
export function isHTMLVideoElement(value: unknown): value is HTMLVideoElement {
  return value instanceof HTMLVideoElement;
}

/** @internal */
export function isHTMLAudioElement(value: unknown): value is HTMLAudioElement {
  return value instanceof HTMLAudioElement;
}

/** @internal */
export function isHTMLMediaElement(value: unknown): value is HTMLMediaElement {
  return value instanceof HTMLMediaElement;
}

/** @internal */
export function isHTMLImageElement(value: unknown): value is HTMLImageElement {
  return value instanceof HTMLImageElement;
}

/**
 * Whether `value` is a custom element whose class isn't defined yet. Until then it has none of its own properties or
 * methods.
 *
 * @internal
 */
export function isUndefinedCustomElement(value: unknown): value is Element {
  if (!globalThis.customElements || !(value instanceof Element)) return false;

  const name = value.localName;

  return name.includes('-') && !customElements.get(name);
}
