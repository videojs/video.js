import { PARAMS_MESSAGE } from '../shell/messages';
import { applyDocumentParams, readParams, type WorkbenchParams } from '../shell/params';
import { createUrlWriter } from '../shell/url';

const writeUrl = createUrlWriter();

/** The player's media, or a custom element such as `<mux-video>` that speaks its API. Skin parts never play anything. */
function findMedia(): HTMLMediaElement | undefined {
  for (const element of document.querySelectorAll('*')) {
    if (element.localName.startsWith('media-')) continue;

    if ('paused' in element && 'play' in element && typeof element.play === 'function')
      return element as HTMLMediaElement;
  }

  return undefined;
}

let pendingMedia: MutationObserver | undefined;

/**
 * Set the playback options on an HTML player's media, waiting for it to mount if it hasn't yet. React previews pass
 * them as props instead, since React owns those attributes there.
 */
export function applyMediaParams(value: WorkbenchParams): void {
  pendingMedia?.disconnect();

  const media = findMedia();

  if (!media) {
    pendingMedia = new MutationObserver(() => {
      if (findMedia()) applyMediaParams(value);
    });
    pendingMedia.observe(document.body, { childList: true, subtree: true });
    return;
  }

  media.muted = value.muted;
  media.loop = value.loop;
  media.preload = value.preload;

  // `autoplay` only matters before playback starts, so turning it on also starts this player.
  if (value.autoplay !== media.autoplay) {
    media.autoplay = value.autoplay;

    if (value.autoplay && media.paused) void media.play().catch(() => undefined);
  }
}

/** The settings the shell last sent, starting from the frame's own URL so the preview also works in its own tab. */
export function initialParams(): WorkbenchParams {
  const params = readParams(location.hash.slice(1));

  applyDocumentParams(params);

  return params;
}

/** Call `listener` with each settings change the shell posts. */
export function onParamsChange(listener: (params: WorkbenchParams) => void): () => void {
  const receive = (event: MessageEvent) => {
    if (event.origin !== location.origin || event.data?.type !== PARAMS_MESSAGE) return;

    const params = readParams(event.data.query);

    // Keep the frame's URL current, so a reload after a hot update shows the same preview.
    writeUrl(`#${event.data.query}`);
    applyDocumentParams(params);
    listener(params);
  };

  window.addEventListener('message', receive);

  return () => window.removeEventListener('message', receive);
}
