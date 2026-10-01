import { describe, expect, it, vi } from 'vite-plus/test';

import type { Guide, Sidebar } from '../../../types/docs';
import {
  buildAgnosticDocsUrl,
  getFrameworkFromDocsPath,
  getFrameworkFromDocsUrl,
  isDocsGuideActive,
  resolveDocsHref,
  resolveDocsLinkUrl,
  resolveFrameworkChange,
  resolveIndexRedirect,
} from '../routing';

// Mock the validation functions from @/types/docs to use mock framework/style configuration
// Note: This mock is hoisted, so we define MOCK_FRAMEWORK_STYLES inside the factory
vi.mock('@/types/docs', async () => {
  const actual = await vi.importActual('@/types/docs');

  // Mock framework/style configuration for tests
  // This allows tests to remain stable when the actual FRAMEWORK_STYLES changes
  const MOCK_FRAMEWORK_STYLES = {
    html: ['css', 'tailwind'],
    react: ['css', 'tailwind'],
  } as const;

  type MockFramework = keyof typeof MOCK_FRAMEWORK_STYLES;

  return {
    ...actual,
    // Mock FRAMEWORK_STYLES to match our test config
    FRAMEWORK_STYLES: MOCK_FRAMEWORK_STYLES,

    // Mock DEFAULT_FRAMEWORK
    DEFAULT_FRAMEWORK: 'react' as const,

    // Mock isValidFramework to check against mock frameworks
    isValidFramework: (value: string | undefined | null): value is MockFramework => {
      if (!value) return false;

      return value === 'html' || value === 'react';
    },
  };
});

// Re-export the mock types for use in tests
// Prefixed with _ to indicate it's only used for type derivation
const _MOCK_FRAMEWORK_STYLES = {
  html: ['css', 'tailwind'],
  react: ['css', 'tailwind'],
} as const;

type MockFramework = keyof typeof _MOCK_FRAMEWORK_STYLES;

describe('routing utilities', () => {
  // Test fixtures - comprehensive mock sidebar for testing
  const guideForEveryone: Guide = {
    slug: 'concepts/everyone',
    // No restrictions - visible to all
  };

  const guideReactOnly: Guide = {
    slug: 'concepts/react-only',
    frameworks: ['react'] satisfies MockFramework[],
  };

  const guideHtmlOnly: Guide = {
    slug: 'guides/html-only',
    frameworks: ['html'] satisfies MockFramework[],
  };

  // Guide with no own restrictions, but lives inside a react-only section
  const guideInReactSection: Guide = {
    slug: 'components/react-hook',
  };

  // Guide with no own restrictions, but lives inside an html-only section
  const guideInHtmlSection: Guide = {
    slug: 'components/html-controller',
  };

  const mockSidebar: Sidebar = [
    {
      sidebarLabel: 'Getting started',
      contents: [guideForEveryone],
    },
    {
      sidebarLabel: 'Concepts',
      contents: [guideReactOnly],
    },
    {
      sidebarLabel: 'Hooks',
      frameworks: ['react'] satisfies MockFramework[],
      contents: [guideInReactSection],
    },
    {
      sidebarLabel: 'Controllers',
      frameworks: ['html'] satisfies MockFramework[],
      contents: [guideInHtmlSection],
    },
    guideHtmlOnly,
  ];

  describe('getFrameworkFromDocsPath', () => {
    it('returns the framework from an explicit docs route', () => {
      expect(getFrameworkFromDocsPath('/docs/framework/react/guides/installation')).toBe('react');
      expect(getFrameworkFromDocsPath('/docs/framework/html')).toBe('html');
    });

    it('returns the framework from canonical installation routes', () => {
      expect(getFrameworkFromDocsPath('/docs/guides/installation/react')).toBe('react');
      expect(getFrameworkFromDocsPath('/docs/guides/installation/html')).toBe('html');
      expect(getFrameworkFromDocsPath('/docs/guides/installation/vue')).toBe('html');
      expect(getFrameworkFromDocsPath('/docs/guides/installation/svelte')).toBe('html');
      expect(getFrameworkFromDocsPath('/docs/guides/installation/cdn')).toBe('html');
      expect(getFrameworkFromDocsPath('/docs/guides/installation/shadcn')).toBeNull();
    });

    it('ignores framework-agnostic and invalid routes', () => {
      expect(getFrameworkFromDocsPath('/docs/guides/installation')).toBeNull();
      expect(getFrameworkFromDocsPath('/docs/framework/vue/guides/installation')).toBeNull();
      expect(getFrameworkFromDocsPath('/blog/framework/react')).toBeNull();
    });
  });

  describe('getFrameworkFromDocsUrl', () => {
    it('returns the framework selected on the Shadcn route', () => {
      expect(
        getFrameworkFromDocsUrl(new URL('https://videojs.org/docs/guides/installation/shadcn?framework=html'))
      ).toBe('html');
      expect(
        getFrameworkFromDocsUrl(new URL('https://videojs.org/docs/guides/installation/shadcn?framework=react'))
      ).toBe('react');
    });

    it('does not invent a Shadcn framework when the query is missing or invalid', () => {
      expect(getFrameworkFromDocsUrl(new URL('https://videojs.org/docs/guides/installation/shadcn'))).toBeNull();
      expect(
        getFrameworkFromDocsUrl(new URL('https://videojs.org/docs/guides/installation/shadcn?framework=vue'))
      ).toBeNull();
    });
  });

  describe('resolveIndexRedirect', () => {
    describe('with framework param', () => {
      it('should use validated params.framework', () => {
        const result = resolveIndexRedirect(
          {
            preferences: { framework: null },
            params: { framework: 'react' },
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/concepts/everyone');
      });

      it('should throw error for invalid framework param', () => {
        expect(() => {
          resolveIndexRedirect({
            preferences: { framework: null },
            params: { framework: 'invalid' },
          });
        }).toThrow('Invalid framework param: invalid');
      });
    });

    describe('with no params', () => {
      it('should use framework preference when valid', () => {
        const result = resolveIndexRedirect(
          {
            preferences: { framework: 'html' },
            params: {},
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/html/concepts/everyone');
      });

      it('should use default framework when no preferences', () => {
        const result = resolveIndexRedirect({
          preferences: { framework: null },
          params: {},
        });

        expect(result.url).toBe('/docs/guides/installation/react');
      });

      it('should use default framework when framework preference invalid', () => {
        const result = resolveIndexRedirect({
          preferences: { framework: 'invalid' },
          params: {},
        });

        expect(result.url).toBe('/docs/guides/installation/react');
      });
    });

    describe('slug selection', () => {
      it('should always select a valid slug for the framework', () => {
        const result = resolveIndexRedirect(
          {
            preferences: { framework: 'html' },
            params: {},
          },
          [guideReactOnly, guideHtmlOnly]
        );

        expect(result.url).toBe('/docs/framework/html/guides/html-only');

        const realSidebarResult = resolveIndexRedirect({
          preferences: { framework: 'react' },
          params: {},
        });

        expect(realSidebarResult.url).toBe('/docs/guides/installation/react');
      });
    });
  });

  describe('resolveFrameworkChange', () => {
    describe('slug retention', () => {
      it('should keep slug and use replace when slug visible in new framework', () => {
        const result = resolveFrameworkChange(
          {
            currentFramework: 'html',
            currentSlug: 'concepts/everyone', // visible to all
            newFramework: 'react',
          },
          mockSidebar
        );

        expect(result.shouldReplace).toBe(true);
        expect(result.url).toBe('/docs/framework/react/concepts/everyone');
      });

      it('should change slug and not use replace when slug not visible in new framework', () => {
        const result = resolveFrameworkChange(
          {
            currentFramework: 'html',
            currentSlug: 'guides/html-only',
            newFramework: 'react',
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/concepts/everyone');
        expect(result.shouldReplace).toBe(false);
      });

      it('should change slug when guide inherits framework restriction from section', () => {
        const result = resolveFrameworkChange(
          {
            currentFramework: 'html',
            currentSlug: 'components/html-controller', // in html-only section
            newFramework: 'react',
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/concepts/everyone');
        expect(result.shouldReplace).toBe(false);
      });
    });

    describe('validation', () => {
      it('should throw error for invalid new framework', () => {
        expect(() => {
          resolveFrameworkChange({
            currentFramework: 'react',
            currentSlug: 'concepts/everyone',
            // @ts-expect-error Testing invalid input
            newFramework: 'invalid',
          });
        }).toThrow('Invalid framework: invalid');
      });
    });

    describe('url building', () => {
      it('should build correct URL', () => {
        const result = resolveFrameworkChange(
          {
            currentFramework: 'html',
            currentSlug: 'concepts/everyone',
            newFramework: 'react',
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/concepts/everyone');
      });
    });
  });

  describe('resolveDocsLinkUrl', () => {
    describe('priority 1: keep framework', () => {
      it('should keep framework when slug visible in current context', () => {
        const result = resolveDocsLinkUrl(
          {
            targetSlug: 'concepts/everyone',
            contextFramework: 'react',
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/concepts/everyone');
      });

      it('should use priority 1 for guide with matching framework restriction', () => {
        const result = resolveDocsLinkUrl(
          {
            targetSlug: 'concepts/react-only',
            contextFramework: 'react',
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/concepts/react-only');
      });
    });

    describe('priority 2: change framework', () => {
      it("should change to guide's first valid framework", () => {
        const result = resolveDocsLinkUrl(
          {
            targetSlug: 'concepts/react-only',
            contextFramework: 'html', // react-only not visible in html
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/concepts/react-only');
      });

      it('should fall back when guide inherits framework restriction from section', () => {
        const result = resolveDocsLinkUrl(
          {
            targetSlug: 'components/react-hook', // in react-only section, no own restriction
            contextFramework: 'html',
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/components/react-hook');
      });
    });

    describe('slug pinning', () => {
      it('should always use the target slug', () => {
        const result = resolveDocsLinkUrl(
          {
            targetSlug: 'concepts/everyone',
            contextFramework: 'html',
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/html/concepts/everyone');
      });
    });

    describe('validation', () => {
      it('should throw error for non-existent slug', () => {
        expect(() => {
          resolveDocsLinkUrl(
            {
              targetSlug: 'non-existent',
              contextFramework: 'react',
            },
            mockSidebar
          );
        }).toThrow('No guide found with slug "non-existent"');
      });

      it('should throw error for invalid context framework', () => {
        expect(() => {
          resolveDocsLinkUrl(
            {
              targetSlug: 'concepts/everyone',
              // @ts-expect-error Testing invalid input
              contextFramework: 'invalid',
            },
            mockSidebar
          );
        }).toThrow('Invalid context framework: invalid');
      });
    });

    describe('url building', () => {
      it('should build correct URL', () => {
        const result = resolveDocsLinkUrl(
          {
            targetSlug: 'concepts/everyone',
            contextFramework: 'react',
          },
          mockSidebar
        );

        expect(result.url).toBe('/docs/framework/react/concepts/everyone');
      });
    });
  });

  describe('canonical installation routes', () => {
    it('builds the preference-aware installation landing page', () => {
      expect(buildAgnosticDocsUrl()).toBe('/docs');
      expect(buildAgnosticDocsUrl(null)).toBe('/docs');
      expect(buildAgnosticDocsUrl('guides/installation')).toBe('/docs/guides/installation');
    });

    it('keeps installation active across every installation route', () => {
      expect(isDocsGuideActive('react', 'guides/installation', '/docs/guides/installation/react')).toBe(true);
      expect(isDocsGuideActive('react', 'guides/installation', '/docs/guides/installation/shadcn')).toBe(true);
      expect(isDocsGuideActive('html', 'guides/installation', '/docs/guides/installation/cdn')).toBe(true);
      expect(isDocsGuideActive('html', 'guides/installation', '/docs/guides/installation/vue')).toBe(true);
    });

    it('still requires an exact URL for other guides', () => {
      expect(isDocsGuideActive('html', 'guides/architecture', '/docs/framework/html/guides/architecture')).toBe(true);
      expect(isDocsGuideActive('html', 'guides/architecture', '/docs/guides/installation/html')).toBe(false);
    });

    it('resolves the canonical framework and method URLs', () => {
      expect(resolveDocsHref({ slug: null, framework: null })).toBe('/docs');
      expect(resolveDocsHref({ slug: 'guides/installation', framework: null })).toBe('/docs/guides/installation');
      expect(resolveDocsHref({ slug: null, framework: 'html' })).toBe('/docs/guides/installation/html');
      expect(resolveDocsHref({ slug: 'guides/installation', framework: 'react' })).toBe(
        '/docs/guides/installation/react'
      );
      expect(resolveDocsHref({ slug: 'guides/installation-shadcn', framework: 'react' })).toBe(
        '/docs/guides/installation/shadcn?framework=react'
      );
      expect(resolveDocsHref({ slug: 'guides/installation-shadcn', framework: 'html' })).toBe(
        '/docs/guides/installation/shadcn?framework=html'
      );
      expect(resolveDocsHref({ slug: 'guides/installation-cdn', framework: 'html' })).toBe(
        '/docs/guides/installation/cdn'
      );
      expect(resolveDocsHref({ slug: 'guides/cdn', framework: 'html' })).toBe('/docs/framework/html/guides/cdn');
    });

    it('rejects unknown guide slugs', () => {
      expect(() => resolveDocsHref({ slug: 'guides/does-not-exist', framework: 'html' })).toThrow(/No guide found/);
    });
  });
});
