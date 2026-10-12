'use client';

import type { ReactNode } from 'react';

const MEDIA_HELP_URL = 'https://videojs.org/help';

export interface MediaFallbackProps {
  /**
   * Fallback content rendered inside the native `<video>` or `<audio>`, after `children`. Browsers show it only when
   * they can't play media at all, so viewers never see it.
   *
   * Defaults to a "Video player not working?" (or "Audio player not working?") link to `https://videojs.org/help`,
   * which server-rendered pages carry in their HTML. Pass `null` to render no fallback content, or your own content to
   * replace it.
   */
  fallback?: ReactNode;
}

/** Default `fallback` for Medias that render a `<video>`. */
export const videoFallback = <a href={MEDIA_HELP_URL}>Video player not working?</a>;

/** Default `fallback` for Medias that render an `<audio>`. */
export const audioFallback = <a href={MEDIA_HELP_URL}>Audio player not working?</a>;
