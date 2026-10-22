import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  nativeHlsSupport,
  supportsAnimationFrame,
  supportsConstructableStyleSheets,
  supportsIdleCallback,
} from '../supports';

const SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const IOS_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1';
const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';

describe('supports', () => {
  describe('supportsAnimationFrame', () => {
    it('returns true in browser environment', () => {
      expect(supportsAnimationFrame()).toBe(true);
    });
  });

  describe('supportsIdleCallback', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('detects whether the native request function is available', () => {
      vi.stubGlobal('requestIdleCallback', vi.fn());
      expect(supportsIdleCallback()).toBe(true);

      vi.stubGlobal('requestIdleCallback', undefined);
      expect(supportsIdleCallback()).toBe(false);
    });
  });

  describe('nativeHlsSupport', () => {
    function stub({ userAgent, canPlay = true, mse = true }: { userAgent: string; canPlay?: boolean; mse?: boolean }) {
      vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue(canPlay ? 'maybe' : '');
      vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
      vi.stubGlobal('MediaSource', mse ? class {} : undefined);
      vi.stubGlobal('ManagedMediaSource', undefined);
      vi.stubGlobal('WebKitMediaSource', undefined);
    }

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('prefers native HLS on Safari, including the iOS browsers built on it', () => {
      stub({ userAgent: SAFARI });
      expect(nativeHlsSupport()).toBe('preferred');

      stub({ userAgent: IOS_CHROME });
      expect(nativeHlsSupport()).toBe('preferred');
    });

    it('only supports native HLS where Chromium also reports it', () => {
      stub({ userAgent: CHROME });
      expect(nativeHlsSupport()).toBe('supported');

      stub({ userAgent: ANDROID_CHROME });
      expect(nativeHlsSupport()).toBe('supported');
    });

    it('prefers native HLS wherever there is no MSE to fall back on', () => {
      stub({ userAgent: CHROME, mse: false });

      expect(nativeHlsSupport()).toBe('preferred');
    });

    it('reports no native HLS where the browser cannot play it', () => {
      stub({ userAgent: SAFARI, canPlay: false });

      expect(nativeHlsSupport()).toBe('unsupported');
    });
  });

  describe('supportsConstructableStyleSheets', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns true when CSSStyleSheet can be constructed', () => {
      expect(supportsConstructableStyleSheets()).toBe(true);
    });

    it('returns false when CSSStyleSheet is missing', () => {
      vi.stubGlobal('CSSStyleSheet', undefined);

      expect(supportsConstructableStyleSheets()).toBe(false);
    });

    it('returns false when constructing CSSStyleSheet throws', () => {
      vi.stubGlobal(
        'CSSStyleSheet',
        class {
          constructor() {
            throw new TypeError('Illegal constructor');
          }
        }
      );

      expect(supportsConstructableStyleSheets()).toBe(false);
    });
  });
});
