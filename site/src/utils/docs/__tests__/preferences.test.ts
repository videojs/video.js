import type { AstroCookies } from 'astro';
import { describe, expect, it, vi } from 'vite-plus/test';

import { DEFAULT_FRAMEWORK, SUPPORTED_FRAMEWORKS } from '@/types/docs';

import {
  FRAMEWORK_COOKIE,
  getFrameworkPreferenceClient,
  getPreferencesServer,
  setFrameworkPreferenceClient,
  setStylePreferenceClient,
} from '../preferences';

describe('preferences utilities', () => {
  // Derive test values from actual configuration to stay independent of supported languages
  const firstFramework = SUPPORTED_FRAMEWORKS[0];

  describe('getPreferencesServer', () => {
    it('should return null preference when no cookies are set', () => {
      const mockCookies = {
        has: vi.fn().mockReturnValue(false),
        get: vi.fn(),
      } as unknown as AstroCookies;

      const result = getPreferencesServer(mockCookies);

      expect(result).toEqual({ framework: null });
    });

    it('should return framework preference when cookie is set', () => {
      const mockCookies = {
        has: vi.fn((name: string) => name === FRAMEWORK_COOKIE),
        get: vi.fn((name: string) => {
          if (name === FRAMEWORK_COOKIE) {
            return { value: firstFramework };
          }

          return null;
        }),
      } as unknown as AstroCookies;

      const result = getPreferencesServer(mockCookies);

      expect(result).toEqual({ framework: firstFramework });
    });

    it('should ignore invalid framework cookie', () => {
      const mockCookies = {
        has: vi.fn().mockReturnValue(true),
        get: vi.fn((name: string) => {
          if (name === FRAMEWORK_COOKIE) {
            return { value: 'invalid-framework' };
          }

          return null;
        }),
      } as unknown as AstroCookies;

      const result = getPreferencesServer(mockCookies);

      expect(result).toEqual({ framework: null });
    });

    it('should accept valid framework values', () => {
      for (const framework of SUPPORTED_FRAMEWORKS) {
        const mockCookies = {
          has: vi.fn().mockReturnValue(true),
          get: vi.fn((name: string) => {
            if (name === FRAMEWORK_COOKIE) {
              return { value: framework };
            }

            return null;
          }),
        } as unknown as AstroCookies;

        const result = getPreferencesServer(mockCookies);

        expect(result).toEqual({ framework });
      }
    });
  });

  describe('getFrameworkPreferenceClient', () => {
    it('should return DEFAULT_FRAMEWORK when no cookie is set', () => {
      Object.defineProperty(document, 'cookie', {
        get: () => '',
        configurable: true,
      });

      expect(getFrameworkPreferenceClient()).toBe(DEFAULT_FRAMEWORK);
    });

    it('should return the framework from cookie when valid', () => {
      for (const framework of SUPPORTED_FRAMEWORKS) {
        Object.defineProperty(document, 'cookie', {
          get: () => `${FRAMEWORK_COOKIE}=${framework}`,
          configurable: true,
        });

        expect(getFrameworkPreferenceClient()).toBe(framework);
      }
    });

    it('should return DEFAULT_FRAMEWORK when cookie has invalid value', () => {
      Object.defineProperty(document, 'cookie', {
        get: () => `${FRAMEWORK_COOKIE}=invalid-framework`,
        configurable: true,
      });

      expect(getFrameworkPreferenceClient()).toBe(DEFAULT_FRAMEWORK);
    });

    it('should return null when document is undefined (SSR)', () => {
      vi.stubGlobal('document', undefined);

      try {
        expect(getFrameworkPreferenceClient()).toBeNull();
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('setFrameworkPreferenceClient', () => {
    it.each(SUPPORTED_FRAMEWORKS)('should set framework cookie for %s', (framework) => {
      // Mock document.cookie
      const cookies: string[] = [];

      Object.defineProperty(document, 'cookie', {
        get: () => cookies.join('; '),
        set: (value: string) => {
          cookies.push(value);
        },
        configurable: true,
      });

      setFrameworkPreferenceClient(framework);

      expect(cookies).toHaveLength(1);
      expect(cookies[0]).toContain(`vjs_docs_framework=${framework}`);
      expect(cookies[0]).toContain('max-age=31536000');
      expect(cookies[0]).toContain('path=/');
      expect(cookies[0]).toContain('samesite=lax');
    });

    it('should throw error for invalid framework', () => {
      expect(() => {
        // @ts-expect-error Testing invalid input
        setFrameworkPreferenceClient('invalid-framework');
      }).toThrow('Invalid framework: invalid-framework');
    });

    it('should do nothing when document is undefined (SSR)', () => {
      vi.stubGlobal('document', undefined);

      try {
        expect(() => {
          setFrameworkPreferenceClient(firstFramework);
        }).not.toThrow();
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('setStylePreferenceClient', () => {
    it('should set style in localStorage', () => {
      const mockStorage: Record<string, string> = {};

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: (key: string) => mockStorage[key] ?? null,
          setItem: (key: string, value: string) => {
            mockStorage[key] = value;
          },
        },
        configurable: true,
      });

      setStylePreferenceClient(firstFramework, 'css');

      const expectedKey = `vjs_docs_style_${firstFramework}`;

      expect(mockStorage[expectedKey]).toBe('css');
    });

    it('should throw error for invalid style', () => {
      const mockStorage: Record<string, string> = {};

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: (key: string) => mockStorage[key] ?? null,
          setItem: (key: string, value: string) => {
            mockStorage[key] = value;
          },
        },
        configurable: true,
      });

      expect(() => {
        // @ts-expect-error Testing invalid input
        setStylePreferenceClient(firstFramework, 'invalid-style');
      }).toThrow(`Invalid style "invalid-style" for framework "${firstFramework}"`);
    });

    it('should do nothing when localStorage is undefined (SSR)', () => {
      // Use Object.defineProperty to make localStorage temporarily undefined
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      expect(() => {
        setStylePreferenceClient(firstFramework, 'css');
      }).not.toThrow();

      // Restore original descriptor
      if (descriptor) {
        Object.defineProperty(globalThis, 'localStorage', descriptor);
      }
    });
  });
});
