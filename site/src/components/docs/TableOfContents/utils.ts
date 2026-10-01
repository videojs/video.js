import type { MarkdownHeading } from 'astro';
import { navigate } from 'astro:transitions/client';
import debounce from 'just-debounce-it';
import throttle from 'just-throttle';
import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

import { API_REFERENCE_SUBSECTION_TITLES } from '@/utils/componentReferenceModel';

export interface RailGeometry {
  stripeHeight: number;
  gap: number;
}

const DEFAULT_ACTIVE_HEADING_OFFSET = 125;

/** Resolve the viewport line where a heading becomes active from the document padding and target margin. */
export function calculateActiveHeadingOffset(scrollPaddingTop: string, scrollMarginTop: string): number {
  const scrollPadding = Number.parseFloat(scrollPaddingTop);
  const scrollMargin = Number.parseFloat(scrollMarginTop);
  const hasScrollPadding = !Number.isNaN(scrollPadding);
  const hasScrollMargin = !Number.isNaN(scrollMargin);
  if (!hasScrollPadding && !hasScrollMargin) return DEFAULT_ACTIVE_HEADING_OFFSET;

  return (hasScrollPadding ? scrollPadding : 0) + (hasScrollMargin ? scrollMargin : 0);
}

/** Keep the full heading map visible by reducing gaps first, then stripe height. */
export function calculateRailGeometry(headingCount: number, availableHeight: number): RailGeometry {
  const stripeHeight = 1;
  const gap = 4;

  if (headingCount <= 1) {
    return { stripeHeight, gap };
  }

  const desiredHeight = headingCount * stripeHeight + (headingCount - 1) * gap;
  if (desiredHeight <= availableHeight) return { stripeHeight, gap };

  const compressedGap = (availableHeight - headingCount * stripeHeight) / (headingCount - 1);
  if (compressedGap >= 0) return { stripeHeight, gap: compressedGap };

  return {
    stripeHeight: Math.max(0, availableHeight / headingCount),
    gap: 0,
  };
}

/** Find the first scrollable ancestor of an element */
export function getScrollParent(element: HTMLElement): HTMLElement {
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const overflow = style.overflow;

    if (/auto|scroll/.test(overflow + overflowY)) {
      if (current.scrollHeight > current.clientHeight) {
        return current;
      }
    }

    current = current.parentElement;
  }

  return document.body;
}

/** Check if an element is outside the visible bounds of its scroll container */
export function isElementOffscreen(element: HTMLElement, container: HTMLElement): boolean {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const isAboveView = elementRect.top < containerRect.top;
  const isBelowView = elementRect.bottom > containerRect.bottom;

  return isAboveView || isBelowView;
}

/** Include headings for docs TOC, including API-reference subsection H4s only. */
export function filterHeadingsForToc(headings: MarkdownHeading[]): MarkdownHeading[] {
  const apiReferenceSubsectionTitles = new Set(API_REFERENCE_SUBSECTION_TITLES);
  const isTocHeadingDepth = (depth: number): boolean => depth === 2 || depth === 3;
  const isApiReferenceSubsectionHeading = (heading: MarkdownHeading): boolean => {
    // SAFETY: the conditional-heading plugin optionally adds tocKind to Astro's MarkdownHeading shape.
    const tocKind = (heading as MarkdownHeading & { tocKind?: string }).tocKind;

    return tocKind === 'api-reference-subsection' && apiReferenceSubsectionTitles.has(heading.text);
  };

  return headings.filter((heading) => {
    if (isTocHeadingDepth(heading.depth)) {
      return true;
    }

    if (heading.depth === 4) {
      return isApiReferenceSubsectionHeading(heading);
    }

    return false;
  });
}

/** Keep client-rendered conditional headings in the TOC only while their target exists on the page. */
export function filterRenderedHeadings(headings: MarkdownHeading[]): MarkdownHeading[] {
  return headings.filter((heading) => {
    const element = document.getElementById(heading.slug);

    return (
      element !== null &&
      !element.hasAttribute('data-conditional-heading-placeholder') &&
      element.getClientRects().length > 0
    );
  });
}

/** Follow headings mounted, removed, or hidden by the active installation selection. */
export function useRenderedHeadings(headings: MarkdownHeading[]): MarkdownHeading[] {
  const [renderedHeadings, setRenderedHeadings] = useState(headings);

  useEffect(() => {
    const update = () => setRenderedHeadings(filterRenderedHeadings(headings));

    update();

    const content = document.querySelector('[data-llms-content]') ?? document.body;
    const contentObserver = new MutationObserver(update);
    const selectionObserver = new MutationObserver(update);

    contentObserver.observe(content, { childList: true, subtree: true });
    selectionObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        'data-installation-project',
        'data-installation-template',
        'data-registry-framework',
        'data-registry-styling',
      ],
    });

    return () => {
      contentObserver.disconnect();
      selectionObserver.disconnect();
    };
  }, [headings]);

  return renderedHeadings;
}

/** Navigate to a heading through Astro so its history index and scroll state stay intact. */
export function navigateToHeading(slug: string): void {
  const element = document.getElementById(slug);

  if (element) void navigate(`#${slug}`);
}

interface UseAutoScrollOptions {
  activeId: string;
  containerRef: RefObject<HTMLElement | null>;
}

/** Auto-scrolls the active link into view when it becomes active and is offscreen */
export function useAutoScroll({ activeId, containerRef }: UseAutoScrollOptions) {
  useEffect(() => {
    if (!activeId || !containerRef.current) return;

    const activeLink = containerRef.current.querySelector<HTMLAnchorElement>(`a[href="#${activeId}"]`);
    if (!activeLink) return;

    const scrollParent = getScrollParent(containerRef.current);
    if (!scrollParent) return;

    if (isElementOffscreen(activeLink, scrollParent)) {
      activeLink.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeId, containerRef]);
}

/** Tracks which heading is currently active based on scroll position */
export function useActiveHeading(headings: MarkdownHeading[]): string {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const idElement = document.querySelector('main [id]');
      const scrollPaddingTop = getComputedStyle(document.documentElement).scrollPaddingTop;
      const scrollMarginTop = idElement ? getComputedStyle(idElement).scrollMarginTop : '';
      const activeLine = calculateActiveHeadingOffset(scrollPaddingTop, scrollMarginTop) + 1;

      // Find the last heading that's above the scroll position
      let currentActiveId = '';

      for (const heading of headings) {
        const element = document.getElementById(heading.slug);

        if (element) {
          const elementTop = element.getBoundingClientRect().top;

          if (elementTop <= activeLine) {
            currentActiveId = heading.slug;
          } else {
            break;
          }
        }
      }

      setActiveId(currentActiveId);
    };

    // Throttle to limit how often it runs during scrolling
    const throttledHandleScroll = throttle(handleScroll, 100);
    // Debounce to ensure it runs after scrolling stops
    const debouncedHandleScroll = debounce(throttledHandleScroll, 50);

    // Set initial active heading
    handleScroll();

    // Add scroll listeners
    window.addEventListener('scroll', throttledHandleScroll);
    window.addEventListener('scroll', debouncedHandleScroll);

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [headings]);

  return activeId;
}
