import type { HlsConfig } from 'hls.js';

/** The media element's `crossOrigin`, read at request time — hls.js is built before the element is attached. */
export type CrossOriginSource = () => string | null | undefined;

/** Whether the element's CORS-settings attribute asks for cookies on its resource fetches. */
export function isCredentialed(crossOrigin: string | null | undefined): boolean {
  return crossOrigin?.toLowerCase() === 'use-credentials';
}

/**
 * Layer the media element's `crossorigin` onto hls.js's loader hooks so `use-credentials` sends cookies with every
 * manifest, playlist, and segment request, the way the browser does under native playback.
 *
 * Both hooks are covered because hls.js picks one loader per configuration: `xhrSetup` for the default `XhrLoader`
 * (`withCredentials`), `fetchSetup` for `FetchLoader` (`credentials: 'include'`). A hook the config already names runs
 * after ours, on the same request, so a consumer's own setup keeps working and can still override the mode. Anything
 * but `use-credentials` — `anonymous`, an empty value, no attribute — leaves hls.js's default (`same-origin`).
 *
 * The attribute is read per request rather than at construction: the engine exists before the element is attached, and
 * an author can change the attribute afterwards.
 */
export function withRequestCredentials(
  config: Partial<HlsConfig>,
  crossOrigin: CrossOriginSource
): Pick<HlsConfig, 'xhrSetup' | 'fetchSetup'> {
  const { xhrSetup, fetchSetup } = config;

  return {
    async xhrSetup(xhr, url) {
      if (isCredentialed(crossOrigin())) xhr.withCredentials = true;

      await xhrSetup?.(xhr, url);
    },
    fetchSetup(context, initParams) {
      if (isCredentialed(crossOrigin())) initParams.credentials = 'include';

      return fetchSetup ? fetchSetup(context, initParams) : new Request(context.url, initParams);
    },
  };
}
