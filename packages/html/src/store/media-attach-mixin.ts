import { ContextEvent } from '@videojs/element/context';
import type { Media } from '@videojs/media/dom';
import type { CustomElement } from '@videojs/utils/dom';
import type { AnyConstructor, Constructor } from '@videojs/utils/types';

import { type MediaContext, mediaContext } from '../player/context';

/** @internal */
export type MediaAttachMixin = <Class extends AnyConstructor<HTMLElement>>(BaseClass: Class) => Class;

/**
 * Create a mixin that consumes `mediaContext` and registers the element as the media with the player.
 *
 * Uses the raw context-request protocol so it works with any `HTMLElement` subclass — no `ReactiveControllerHost`
 * required.
 *
 * @param context - The media context to consume.
 * @internal
 */
export function createMediaAttachMixin(context: MediaContext): MediaAttachMixin {
  return <Class extends AnyConstructor<HTMLElement>>(BaseClass: Class) => {
    class MediaAttachElement extends (BaseClass as unknown as Constructor<CustomElement>) {
      #releaseMedia: (() => void) | null = null;
      #unsubscribe: (() => void) | null = null;

      getMediaTarget(): Media | null {
        return this as unknown as Media;
      }

      override connectedCallback() {
        super.connectedCallback?.();

        this.dispatchEvent(
          new ContextEvent(
            context,
            this,
            (value, unsubscribe) => {
              if (unsubscribe) this.#unsubscribe = unsubscribe;

              this.#releaseMedia?.();
              this.#releaseMedia = null;

              const target = this.getMediaTarget();

              if (this.isConnected && value && target) {
                this.#releaseMedia = value.registerMedia(target);
              }
            },
            false
          )
        );
      }

      override disconnectedCallback() {
        // Detach the store while the media chain is still live so features
        // (e.g. remote-playback) can clean up against the real underlying
        // element. Destroying the media adapter first would null the layer
        // chain's target before listeners get a chance to unwind.
        this.#releaseMedia?.();
        this.#releaseMedia = null;
        this.#unsubscribe?.();
        this.#unsubscribe = null;
        super.disconnectedCallback?.();
      }
    }

    return MediaAttachElement as unknown as Class;
  };
}

/** @internal */
export const MediaAttachMixin = createMediaAttachMixin(mediaContext);
