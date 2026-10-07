import { MediaError } from '@videojs/media';
import type { HTMLVideoAdapter } from '@videojs/media/dom';
import type { Constructor } from '@videojs/utils/types';

export type NativeHlsHost = HTMLVideoAdapter;

export function NativeHlsErrorsMixin<Base extends Constructor<NativeHlsHost>>(BaseClass: Base) {
  class NativeHlsErrors extends (BaseClass as Constructor<NativeHlsHost>) {
    #disconnect: AbortController | null = null;
    #error: MediaError | null = null;

    get error(): MediaError | null {
      return this.#error;
    }

    /**
     * Announce `error` as coming from this media, latching it as the current error when it is fatal. Non-fatal errors
     * are announced only — playback continues, so they must not stand in for whatever fails next.
     *
     * For siblings producing errors the media element never reports itself: DRM key exchange, notably, which fails
     * entirely outside the element.
     *
     * @internal
     */
    setError(error: MediaError): void {
      if (error.fatal) this.#error = error;

      this.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
    }

    attach(target: HTMLVideoElement): void {
      super.attach(target);
      this.#init(target);
    }

    detach(): void {
      this.#destroy();
      super.detach?.();
    }

    destroy(): void {
      this.#destroy();
      super.destroy?.();
    }

    #destroy(): void {
      this.#disconnect?.abort();
      this.#disconnect = null;
      this.#error = null;
    }

    #init(target: HTMLMediaElement): void {
      this.#destroy();
      this.#disconnect = new AbortController();

      const signal = this.#disconnect.signal;

      target.addEventListener(
        'error',
        (event) => {
          // A capture listener also sees the errors of `<track>` and `<source>`
          // children on their way down; stopping those would keep them from the
          // listeners on the child itself, such as a chapters track waiting for
          // its load to settle.
          if (event.target !== target) return;

          event.stopImmediatePropagation();

          const native = target.error;
          if (!native) return;

          const code = native.code;
          const useCanonicalMessage = code >= MediaError.MEDIA_ERR_ABORTED && code <= MediaError.MEDIA_ERR_ENCRYPTED;

          this.setError(new MediaError(useCanonicalMessage ? undefined : native.message, code, true));
        },
        { signal, capture: true }
      );

      target.addEventListener(
        'emptied',
        () => {
          this.#error = null;
        },
        { signal }
      );
    }
  }

  return NativeHlsErrors as unknown as Base &
    Constructor<{ readonly error: MediaError | null; setError(error: MediaError): void }>;
}
