interface Page {
  readonly path: string;
  readonly preset: 'video' | 'audio';
}

export const PAGES: readonly Page[] = [
  { path: '/pages/html-video-mp4.html', preset: 'video' },
  { path: '/pages/react-video-mp4.html', preset: 'video' },
  { path: '/pages/html-video-minimal-mp4.html', preset: 'video' },
  { path: '/pages/react-video-minimal-mp4.html', preset: 'video' },
  { path: '/pages/html-audio-mp4.html', preset: 'audio' },
  { path: '/pages/react-audio-mp4.html', preset: 'audio' },
];

/** Values read from the page. Each is a computed style, so an invalid or missing fallback shows as its initial value. */
interface Probe {
  readonly styled: boolean;
  readonly scrim: string | null;
  readonly primaryForeground: string;
  readonly frameBorder: string;
  readonly bufferRight: string | null;
  /** Closed popovers that still render, which happens when nothing hides them without the Popover API. */
  visibleClosedPopovers: number;
  /** The controls surface's backdrop filter; Safari before 18 applies only the `-webkit-` form. */
  readonly surfaceBlur: string | null;
}

/** Find the first match in the document or any open shadow root below it. */
export function deepQuery(root: Document | ShadowRoot | Element, selector: string): Element | null {
  const found = root.querySelector(selector);
  if (found) return found;

  for (const element of root.querySelectorAll('*')) {
    const nested = element.shadowRoot ? deepQuery(element.shadowRoot, selector) : null;
    if (nested) return nested;
  }

  return null;
}

/** Runs in the page, so it takes `deepQuery` as an argument instead of closing over it. */
export function readProbe(query: typeof deepQuery): Probe | null {
  const skin = query(document, '.media-skin');
  if (!skin) return null;

  const backdrop = query(document, '.video-controls-backdrop');
  const buffer = query(document, '.media-slider-buffer');
  const surfaces: Element[] = [];
  const blurRoots: (Document | ShadowRoot)[] = [document];

  // The default skin blurs the whole bar and the minimal skin its control groups, so accept any controls surface.
  for (let index = 0; index < blurRoots.length; index++) {
    for (const element of blurRoots[index]!.querySelectorAll('*')) {
      if (element.shadowRoot) blurRoots.push(element.shadowRoot);

      if (/\bvideo-controls/.test(String(element.className))) surfaces.push(element);
    }
  }

  const blur = surfaces
    .map((element) =>
      ['backdrop-filter', '-webkit-backdrop-filter']
        .map((property) => getComputedStyle(element).getPropertyValue(property))
        .filter((value) => value && value !== 'none')
        .join(' ')
    )
    .find(Boolean);
  const probe = document.createElement('span');

  probe.style.color = 'red';
  probe.style.border = '1px solid var(--media-frame-border)';
  skin.append(probe);

  const colorProbe = document.createElement('span');

  colorProbe.style.color = 'var(--media-primary-foreground)';
  skin.append(colorProbe);

  const result: Probe = {
    styled: getComputedStyle(skin).boxSizing === 'border-box',
    scrim: backdrop ? getComputedStyle(backdrop).backgroundImage : null,
    primaryForeground: getComputedStyle(colorProbe).color,
    frameBorder: getComputedStyle(probe).borderTopColor,
    bufferRight: buffer ? getComputedStyle(buffer).right : null,
    visibleClosedPopovers: 0,
    surfaceBlur: surfaces.length > 0 ? (blur ?? 'none') : null,
  };
  const roots: (Document | ShadowRoot)[] = [document];

  for (let index = 0; index < roots.length; index++) {
    for (const element of roots[index]!.querySelectorAll('*')) {
      if (element.shadowRoot) roots.push(element.shadowRoot);

      const closed = element.hasAttribute('popover') && !element.hasAttribute('data-open');
      const rect = element.getBoundingClientRect();

      if (closed && getComputedStyle(element).display !== 'none' && rect.width > 0 && rect.height > 0) {
        result.visibleClosedPopovers++;
      }
    }
  }

  probe.remove();
  colorProbe.remove();

  return result;
}
