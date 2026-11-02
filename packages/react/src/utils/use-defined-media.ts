'use client';

import type { Media } from '@videojs/media/dom';
import { isUndefinedCustomElement } from '@videojs/utils/dom';
import { useEffect } from 'react';

import { useForceRender } from './use-force-render';

/**
 * Returns `media` once the store can attach to it, or `null` while it's a custom element whose class isn't defined yet.
 * Features check what the media supports once, at attach, so attaching before the upgrade would leave them off.
 */
export function useDefinedMedia(media: Media | null): Media | null {
  const forceRender = useForceRender();
  const pending = isUndefinedCustomElement(media);

  useEffect(() => {
    if (!isUndefinedCustomElement(media)) return;

    let active = true;

    customElements.whenDefined(media.localName).then(() => {
      if (active) forceRender();
    });

    return () => {
      active = false;
    };
  }, [media, forceRender]);

  return pending ? null : media;
}
