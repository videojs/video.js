/** A native media element, or a custom element such as `<mux-video>` that speaks its API. */
export type MediaLike = HTMLMediaElement;

function isMediaLike(element: Element): element is MediaLike {
  return 'currentTime' in element && 'paused' in element && 'play' in element && typeof element.play === 'function';
}

/** The page's media component, wherever the skin put it; skin parts are skipped because they never play anything. */
export function findMediaElement(scope: ParentNode = document): MediaLike | undefined {
  for (const element of scope.querySelectorAll('*')) {
    if (element.localName.startsWith('media-')) continue;

    if (isMediaLike(element)) return element;
  }

  return undefined;
}

/**
 * The media component by tag, for markup that has not been adopted into the document yet: a native element, or a custom
 * `*-video` / `*-audio` element the skin's own `media-*` parts never are.
 */
export function findMediaTag(scope: ParentNode): Element | undefined {
  for (const element of scope.querySelectorAll('*')) {
    const { localName } = element;
    if (localName.startsWith('media-')) continue;

    if (localName === 'video' || localName === 'audio' || /-(?:video|audio)$/.test(localName)) return element;
  }

  return undefined;
}
