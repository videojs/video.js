import { MediaError } from '@videojs/media';
import type { Constructor, MixinReturn } from '@videojs/utils/types';
import type { ErrorData } from 'hls.js';
import Hls from 'hls.js';

import type { HlsEngineHost } from './types';

const hlsErrorTypeToCode: Record<string, number> = {
  [Hls.ErrorTypes.NETWORK_ERROR]: MediaError.MEDIA_ERR_NETWORK,
  [Hls.ErrorTypes.MEDIA_ERROR]: MediaError.MEDIA_ERR_DECODE,
  [Hls.ErrorTypes.KEY_SYSTEM_ERROR]: MediaError.MEDIA_ERR_ENCRYPTED,
  [Hls.ErrorTypes.MUX_ERROR]: MediaError.MEDIA_ERR_DECODE,
  [Hls.ErrorTypes.OTHER_ERROR]: MediaError.MEDIA_ERR_CUSTOM,
};

export function HlsJsErrorsMixin<Base extends Constructor<HlsEngineHost>>(BaseClass: Base) {
  class HlsJsErrors extends BaseClass {
    #disconnect: AbortController | null = null;
    #error: MediaError | null = null;

    constructor(...args: any[]) {
      super(...args);

      this.engine?.on(Hls.Events.MANIFEST_LOADING, () => this.#init());
      this.engine?.on(Hls.Events.MEDIA_ATTACHING, () => this.#init());
      this.engine?.on(Hls.Events.MEDIA_DETACHED, () => this.#destroy());
      this.engine?.on(Hls.Events.DESTROYING, () => this.#destroy());
    }

    get error(): MediaError | null {
      return this.#error;
    }

    #destroy(): void {
      this.#disconnect?.abort();
      this.#disconnect = null;
    }

    #init(): void {
      this.#disconnect?.abort();
      this.#disconnect = new AbortController();

      const { engine, target } = this;
      if (!engine || !target) return;

      const onError = (_event: string, data: ErrorData) => {
        if (!data.fatal) return;

        const code = hlsErrorTypeToCode[data.type] ?? MediaError.MEDIA_ERR_CUSTOM;
        const error = new MediaError(data.error?.message, code, true, data.details);

        error.data = data;

        this.#error = error;

        const event = new ErrorEvent('error', { error, message: error.message });

        this.dispatchEvent(event);
      };

      engine.on(Hls.Events.ERROR, onError);

      this.#disconnect.signal.addEventListener(
        'abort',
        () => {
          engine.off(Hls.Events.ERROR, onError);
          this.#error = null;
        },
        { once: true }
      );
    }
  }

  return HlsJsErrors as unknown as MixinReturn<Base, { readonly error: MediaError | null }>;
}
