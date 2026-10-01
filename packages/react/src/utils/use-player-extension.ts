'use client';

import type { PlayerExtension } from '@videojs/core/dom';
import { useEffect, useState } from 'react';

import { useExtensionRegistrar } from '../player/context';
import { useDestroy } from './use-destroy';

/**
 * Create a player extension and register it with the surrounding player.
 *
 * Instantiates the extension class once, registers it with the player on mount, and destroys it on unmount. The player
 * attaches the extension to whatever media it resolves — a plain `<video>` included — and moves it when the media
 * changes. Outside a Player the extension is created but never registered.
 *
 * @param ExtensionClass - Player extension class to instantiate and register.
 * @internal Backs the packaged extension components; not exported from `@videojs/react`.
 */
export function usePlayerExtension<Extension extends PlayerExtension & { destroy(): void }>(
  ExtensionClass: new () => Extension
): Extension {
  const registerExtension = useExtensionRegistrar();
  const [extension] = useState(() => new ExtensionClass());

  useDestroy(extension);

  useEffect(() => registerExtension?.(extension), [registerExtension, extension]);

  return extension;
}
