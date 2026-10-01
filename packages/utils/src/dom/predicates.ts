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
