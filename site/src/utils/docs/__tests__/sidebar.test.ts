import { describe, expect, it, vi } from 'vite-plus/test';

import type { Guide, Section, Sidebar, SidebarLink } from '../../../types/docs';
import {
  filterSidebar,
  findFirstGuide,
  findGuideBySlug,
  getAllGuideSlugs,
  getSectionsForGuide,
  getValidFrameworksForGuide,
} from '../sidebar';

// Mock FRAMEWORK_STYLES from @/types/docs to use our test config
// Note: This mock is hoisted, so we define MOCK_FRAMEWORK_STYLES inside the factory
vi.mock('@/types/docs', async () => {
  const actual = await vi.importActual('@/types/docs');

  // Mock framework/style configuration for tests
  // This allows tests to remain stable when the actual FRAMEWORK_STYLES changes
  const MOCK_FRAMEWORK_STYLES = {
    html: ['css', 'tailwind'],
    react: ['css', 'tailwind'],
  } as const;

  return {
    ...actual,
    // Mock FRAMEWORK_STYLES to match our test config
    FRAMEWORK_STYLES: MOCK_FRAMEWORK_STYLES,
  };
});

// Re-export the mock types for use in tests
// Prefixed with _ to indicate it's only used for type derivation
const _MOCK_FRAMEWORK_STYLES = {
  html: ['css', 'tailwind'],
  react: ['css', 'tailwind'],
} as const;

type MockFramework = keyof typeof _MOCK_FRAMEWORK_STYLES;

describe('sidebar utilities', () => {
  // Test fixtures using mock framework values
  const mockGuide1: Guide = {
    slug: 'guide-1',
    frameworks: ['html', 'react'] satisfies MockFramework[],
  };

  const mockGuide2: Guide = {
    slug: 'guide-2',
    frameworks: ['react'] satisfies MockFramework[],
  };

  const mockGuide3: Guide = {
    slug: 'guide-3',
    // No restrictions - visible to all
  };

  const mockSection: Section = {
    sidebarLabel: 'Section 1',
    frameworks: ['html', 'react'] satisfies MockFramework[],
    contents: [mockGuide1, mockGuide2],
  };

  const mockSidebar: Sidebar = [mockSection, mockGuide3];

  describe('filterSidebar', () => {
    it('should filter guides based on framework', () => {
      const result = filterSidebar('html', mockSidebar);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        sidebarLabel: 'Section 1',
        contents: [mockGuide1], // guide-2 filtered out (react only)
      });
      expect(result[1]).toEqual(mockGuide3);
    });

    it('should include all guides for framework that supports them', () => {
      const result = filterSidebar('react', mockSidebar);

      expect(result).toHaveLength(2);
      const section = result[0] as Section;

      expect(section.contents).toHaveLength(2);
      expect(section.contents).toContainEqual(mockGuide1);
      expect(section.contents).toContainEqual(mockGuide2);
    });

    it('should remove empty sections after filtering', () => {
      const mockEmptySection: Section = {
        sidebarLabel: 'Empty Section',
        frameworks: ['html'],
        contents: [mockGuide2], // guide-2 is react-only
      };

      const sidebar: Sidebar = [mockEmptySection];
      const result = filterSidebar('html', sidebar);

      expect(result).toHaveLength(0);
    });

    it('should keep guides with no framework restrictions', () => {
      const result = filterSidebar('html', [mockGuide3]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockGuide3);
    });

    it('should recursively filter nested sections', () => {
      const nestedSection: Section = {
        sidebarLabel: 'Parent',
        contents: [
          {
            sidebarLabel: 'Child',
            contents: [mockGuide1, mockGuide2],
          },
        ],
      };

      const result = filterSidebar('html', [nestedSection]);

      expect(result).toHaveLength(1);
      const parent = result[0] as Section;

      expect(parent.contents).toHaveLength(1);
      const child = parent.contents[0] as Section;

      expect(child.contents).toHaveLength(1);
      expect(child.contents[0]).toEqual(mockGuide1);
    });
  });

  describe('findFirstGuide', () => {
    it('should find the first visible guide in a sidebar', () => {
      const result = findFirstGuide('html', mockSidebar);

      expect(result).toBe('guide-1');
    });

    it('should skip guides that do not match framework', () => {
      const sidebar: Sidebar = [mockGuide2, mockGuide1]; // guide-2 is react-only
      const result = findFirstGuide('html', sidebar);

      expect(result).toBe('guide-1');
    });

    it('should search recursively through sections', () => {
      const nestedSidebar: Sidebar = [
        {
          sidebarLabel: 'Section',
          contents: [mockGuide1],
        },
      ];
      const result = findFirstGuide('html', nestedSidebar);

      expect(result).toBe('guide-1');
    });

    it('should throw error if no guide matches', () => {
      expect(() => {
        findFirstGuide('html', [mockGuide2]); // guide-2 is react-only
      }).toThrow('No guide found for valid combination framework "html"');
    });

    it('should throw error for empty sidebar', () => {
      expect(() => {
        findFirstGuide('html', []);
      }).toThrow('No guide found for valid combination framework "html"');
    });
  });

  describe('getAllGuideSlugs', () => {
    it('should extract all guide slugs from a sidebar', () => {
      const result = getAllGuideSlugs(mockSidebar);

      expect(result).toEqual(['guide-1', 'guide-2', 'guide-3']);
    });

    it('should extract slugs from nested sections', () => {
      const nestedSidebar: Sidebar = [
        {
          sidebarLabel: 'Parent',
          contents: [
            {
              sidebarLabel: 'Child',
              contents: [mockGuide1],
            },
            mockGuide2,
          ],
        },
        mockGuide3,
      ];
      const result = getAllGuideSlugs(nestedSidebar);

      expect(result).toEqual(['guide-1', 'guide-2', 'guide-3']);
    });

    it('should return empty array for empty sidebar', () => {
      const result = getAllGuideSlugs([]);

      expect(result).toEqual([]);
    });
  });

  describe('findGuideBySlug', () => {
    it('should find a guide by its slug', () => {
      const result = findGuideBySlug('guide-1', mockSidebar);

      expect(result).toEqual(mockGuide1);
    });

    it('should find a guide nested in sections', () => {
      const result = findGuideBySlug('guide-2', mockSidebar);

      expect(result).toEqual(mockGuide2);
    });

    it('should return null if guide is not found', () => {
      const result = findGuideBySlug('non-existent', mockSidebar);

      expect(result).toBeNull();
    });

    it('should search deeply nested sections', () => {
      const nestedSidebar: Sidebar = [
        {
          sidebarLabel: 'Level 1',
          contents: [
            {
              sidebarLabel: 'Level 2',
              contents: [
                {
                  sidebarLabel: 'Level 3',
                  contents: [mockGuide1],
                },
              ],
            },
          ],
        },
      ];
      const result = findGuideBySlug('guide-1', nestedSidebar);

      expect(result).toEqual(mockGuide1);
    });
  });

  describe('getSectionsForGuide', () => {
    it('should return empty array for top-level guide', () => {
      const result = getSectionsForGuide('guide-3', mockSidebar);

      expect(result).toEqual([]);
    });

    it('should return section label for guide nested in one section', () => {
      const result = getSectionsForGuide('guide-1', mockSidebar);

      expect(result).toEqual(['Section 1']);
    });

    it('should return all ancestor section labels in order', () => {
      const nestedSidebar: Sidebar = [
        {
          sidebarLabel: 'Parent',
          contents: [
            {
              sidebarLabel: 'Child',
              contents: [mockGuide1],
            },
            mockGuide2,
          ],
        },
      ];

      const result = getSectionsForGuide('guide-1', nestedSidebar);

      expect(result).toEqual(['Parent', 'Child']);

      const result2 = getSectionsForGuide('guide-2', nestedSidebar);

      expect(result2).toEqual(['Parent']);
    });

    it('should return empty array if guide is not found', () => {
      const result = getSectionsForGuide('non-existent', mockSidebar);

      expect(result).toEqual([]);
    });

    it('should handle deeply nested guides', () => {
      const deeplyNestedSidebar: Sidebar = [
        {
          sidebarLabel: 'Level 1',
          contents: [
            {
              sidebarLabel: 'Level 2',
              contents: [
                {
                  sidebarLabel: 'Level 3',
                  contents: [mockGuide1],
                },
              ],
            },
          ],
        },
      ];

      const result = getSectionsForGuide('guide-1', deeplyNestedSidebar);

      expect(result).toEqual(['Level 1', 'Level 2', 'Level 3']);
    });

    it('should return empty array for empty sidebar', () => {
      const result = getSectionsForGuide('guide-1', []);

      expect(result).toEqual([]);
    });

    it('should work with sidebar containing mixed top-level and nested guides', () => {
      const mixedSidebar: Sidebar = [
        mockGuide3, // top level
        {
          sidebarLabel: 'Getting Started',
          contents: [
            mockGuide1,
            {
              sidebarLabel: 'Advanced',
              contents: [mockGuide2],
            },
          ],
        },
      ];

      expect(getSectionsForGuide('guide-3', mixedSidebar)).toEqual([]);
      expect(getSectionsForGuide('guide-1', mixedSidebar)).toEqual(['Getting Started']);
      expect(getSectionsForGuide('guide-2', mixedSidebar)).toEqual(['Getting Started', 'Advanced']);
    });
  });

  describe('getValidFrameworksForGuide', () => {
    it('should return all frameworks when guide has no restrictions', () => {
      const result = getValidFrameworksForGuide(mockGuide3, mockSidebar);

      expect(result).toEqual(expect.arrayContaining(['html', 'react']));
    });

    it('should return only restricted frameworks from guide itself', () => {
      const result = getValidFrameworksForGuide(mockGuide2, mockSidebar);

      expect(result).toEqual(['react']);
    });

    it('should inherit framework restrictions from parent section', () => {
      const unrestricted: Guide = { slug: 'child-guide' };
      const sidebar: Sidebar = [
        {
          sidebarLabel: 'React Only Section',
          frameworks: ['react'] satisfies MockFramework[],
          contents: [unrestricted],
        },
      ];

      const result = getValidFrameworksForGuide(unrestricted, sidebar);

      expect(result).toEqual(['react']);
    });

    it('should intersect guide and ancestor section restrictions', () => {
      const guideWithOwn: Guide = {
        slug: 'both-restricted',
        frameworks: ['html', 'react'] satisfies MockFramework[],
      };
      const sidebar: Sidebar = [
        {
          sidebarLabel: 'HTML Only Section',
          frameworks: ['html'] satisfies MockFramework[],
          contents: [guideWithOwn],
        },
      ];

      const result = getValidFrameworksForGuide(guideWithOwn, sidebar);

      expect(result).toEqual(['html']);
    });

    it('should inherit restrictions through deeply nested sections', () => {
      const deepGuide: Guide = { slug: 'deep-guide' };
      const sidebar: Sidebar = [
        {
          sidebarLabel: 'Level 1',
          frameworks: ['react'] satisfies MockFramework[],
          contents: [
            {
              sidebarLabel: 'Level 2',
              contents: [deepGuide],
            },
          ],
        },
      ];

      const result = getValidFrameworksForGuide(deepGuide, sidebar);

      expect(result).toEqual(['react']);
    });

    it('should return all frameworks when guide is not found in sidebar', () => {
      const orphan: Guide = { slug: 'not-in-sidebar' };

      const result = getValidFrameworksForGuide(orphan, mockSidebar);

      expect(result).toEqual(expect.arrayContaining(['html', 'react']));
    });
  });

  describe('opt-in frameworks', () => {
    const sidebar: Sidebar = [
      {
        sidebarLabel: 'Getting started',
        contents: [
          { slug: 'shared' },
          { slug: 'native-only', frameworks: ['react-native'] },
          { slug: 'everywhere', frameworks: ['html', 'react', 'react-native'] },
          { href: '/changelog', sidebarLabel: 'Changelog' },
        ],
      },
      { sidebarLabel: 'Web only', contents: [{ slug: 'web' }] },
    ];

    it('should only give an alpha framework the entries that list it', () => {
      const filtered = filterSidebar('react-native', sidebar, false);

      expect(filtered).toHaveLength(1);
      expect(getAllGuideSlugs(filtered)).toEqual(['native-only', 'everywhere']);
      expect((filtered[0] as Section).contents).toHaveLength(2);
    });

    it('should keep unrestricted entries on stable frameworks', () => {
      expect(getAllGuideSlugs(filterSidebar('react', sidebar, false))).toEqual(['shared', 'everywhere', 'web']);
    });
  });

  describe('findFirstGuide with real sidebar config', () => {
    it('should return a guide for every valid framework', async () => {
      // Import the real sidebar config
      const { sidebar: realSidebar } = await import('../../../docs.config');
      const { SUPPORTED_FRAMEWORKS } = await import('../../../types/docs');

      // Test each valid framework
      for (const framework of SUPPORTED_FRAMEWORKS) {
        const result = findFirstGuide(framework, realSidebar);

        expect(result, `findFirstGuide should return a guide for ${framework}`).toBeTruthy();
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('SidebarLink handling', () => {
    const mockLink: SidebarLink = {
      href: '/changelog',
      sidebarLabel: 'Changelog',
    };

    it('should pass links through filterSidebar', () => {
      const sidebar: Sidebar = [{ sidebarLabel: 'Section', contents: [mockGuide1, mockLink] }];
      const result = filterSidebar('html', sidebar);

      expect((result[0] as Section).contents).toContainEqual(mockLink);
    });

    it('should filter out devOnly links in production', () => {
      const devLink: SidebarLink = { ...mockLink, devOnly: true };
      const sidebar: Sidebar = [{ sidebarLabel: 'Section', contents: [mockGuide1, devLink] }];
      const result = filterSidebar('html', sidebar, false);

      expect((result[0] as Section).contents).toEqual([mockGuide1]);
    });

    it('should skip links in findFirstGuide', () => {
      const sidebar: Sidebar = [mockLink, mockGuide3];
      const result = findFirstGuide('html', sidebar);

      expect(result).toBe('guide-3');
    });

    it('should exclude links from getAllGuideSlugs', () => {
      const sidebar: Sidebar = [{ sidebarLabel: 'Section', contents: [mockGuide1, mockLink] }, mockGuide3];
      const result = getAllGuideSlugs(sidebar);

      expect(result).toEqual(['guide-1', 'guide-3']);
    });

    it('should ignore links in findGuideBySlug', () => {
      const sidebar: Sidebar = [mockLink, mockGuide3];
      const result = findGuideBySlug('guide-3', sidebar);

      expect(result).toEqual(mockGuide3);
    });
  });

  describe('sidebar config validation', () => {
    it('should not have duplicate slugs in sidebar config', async () => {
      // Import the real sidebar config
      const { sidebar: realSidebar } = await import('../../../docs.config');

      const allSlugs = getAllGuideSlugs(realSidebar);
      const uniqueSlugs = new Set(allSlugs);

      expect(allSlugs.length).toBe(uniqueSlugs.size);

      // Also provide helpful error message if there are duplicates
      if (allSlugs.length !== uniqueSlugs.size) {
        const duplicates = allSlugs.filter((slug, index) => allSlugs.indexOf(slug) !== index);

        throw new Error(`Found duplicate slugs in sidebar config: ${[...new Set(duplicates)].join(', ')}`);
      }
    });
  });
});
