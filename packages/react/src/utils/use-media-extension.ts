'use client';

import { addMediaExtension, HTMLMediaAdapter, type HTMLMediaTargetLike, type MediaExtension } from '@videojs/media/dom';
import { useEffect, useState } from 'react';

import { useMedia } from '../player/context';
import { useDestroy } from './use-destroy';

/**
 * Create a media extension and register it with the media provided by the surrounding player context.
 *
 * Instantiates the extension class once, registers it when a media adapter is available, follows the media when it
 * changes, and destroys the extension on unmount. Media that is not a media adapter (e.g. a plain `<video>` element)
 * cannot carry media extensions and is ignored.
 *
 * @param ExtensionClass - Media extension class to instantiate and register.
 */
export function useMediaExtension<Component extends MediaExtension & { destroy(): void }>(
  ExtensionClass: new () => Component
): Component {
  const media = useMedia();
  const [component] = useState(() => new ExtensionClass());

  useDestroy(component);

  useEffect(() => {
    if (!(media instanceof HTMLMediaAdapter)) return;

    return addMediaExtension(media as HTMLMediaAdapter<HTMLMediaTargetLike, any>, component);
  }, [media, component]);

  return component;
}
