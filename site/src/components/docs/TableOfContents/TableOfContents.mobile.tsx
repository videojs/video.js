import { Popover } from '@base-ui/react/popover';
import type { MarkdownHeading } from 'astro';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { TableOfContentsDesktop } from './TableOfContents.desktop';
import type { RailGeometry } from './utils';
import { calculateRailGeometry } from './utils';

interface TableOfContentsMobileProps {
  headings: MarkdownHeading[];
  activeId: string;
  onNavigate: (slug: string) => void;
  /** Stay available at every width and sit in the page margin instead of beside the docs sidebar. */
  railOnly?: boolean;
  className?: string;
}

type RailStyle = React.CSSProperties & Record<'--gap' | '--lg-gap', string>;
type RailStripeStyle = React.CSSProperties & Record<'--w' | '--lg-w' | '--h' | '--lg-h', string>;

// Standalone rails sit in the page margin beside body copy, so the lg breakpoint gets heavier marks.
// Breakpoint sizes stay in CSS so server-rendered rails match hydrated ones.
const WIDE_RAIL_GEOMETRY: RailGeometry = { stripeHeight: 2, gap: 6 };

// Keep a standalone rail 2.5rem outside the centered max-w-3xl column, or at the viewport edge once the margin runs out.
const MARGIN_RAIL_LEFT = 'max(0px, calc(50% - 24rem - 2.5rem - 1.5rem))';

function getStripeWidths(depth: number, railOnly: boolean) {
  const width = depth === 2 ? 10 : depth === 3 ? 8 : 4;

  if (railOnly) return { width, largeWidth: depth === 2 ? 16 : depth === 3 ? 10 : 6 };

  return { width, largeWidth: depth === 2 ? 12 : width };
}

export function TableOfContentsMobile({
  headings,
  activeId,
  onNavigate,
  railOnly = false,
  className,
}: TableOfContentsMobileProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewportLayout, setViewportLayout] = useState({
    availableHeight: 400,
    railTop: null as number | null,
  });

  const railGeometry = calculateRailGeometry(headings.length, viewportLayout.availableHeight);
  const largeRailGeometry = railOnly
    ? calculateRailGeometry(headings.length, viewportLayout.availableHeight, WIDE_RAIL_GEOMETRY)
    : railGeometry;
  const railStyle: RailStyle = {
    '--gap': `${railGeometry.gap}px`,
    '--lg-gap': `${largeRailGeometry.gap}px`,
  };

  useEffect(() => {
    const updateViewportLayout = () => {
      const computedStyle = triggerRef.current ? getComputedStyle(triggerRef.current) : null;
      const bannerHeight = Number.parseFloat(computedStyle?.getPropertyValue('--banner-height') ?? '') || 0;
      const parsedNavHeight = Number.parseFloat(computedStyle?.getPropertyValue('--nav-h') ?? '');
      // --nav-h is 0px outside the docs layout. Docs leaves it as an unresolved calc(), which parses as NaN and falls back.
      const navHeight = Number.isNaN(parsedNavHeight) ? 52 : parsedNavHeight;
      const stickyHeaderHeight = bannerHeight + navHeight;
      const contentHeight = Math.max(0, window.innerHeight - stickyHeaderHeight);

      setViewportLayout({
        availableHeight: Math.max(0, contentHeight - 32),
        railTop: stickyHeaderHeight + contentHeight / 2,
      });
    };
    const bannerContainer = document.querySelector('[data-banner-container]');
    const bannerObserver =
      bannerContainer && 'ResizeObserver' in window ? new ResizeObserver(updateViewportLayout) : null;

    updateViewportLayout();

    if (bannerObserver && bannerContainer) bannerObserver.observe(bannerContainer);

    window.addEventListener('resize', updateViewportLayout);
    window.visualViewport?.addEventListener('resize', updateViewportLayout);

    return () => {
      bannerObserver?.disconnect();
      window.removeEventListener('resize', updateViewportLayout);
      window.visualViewport?.removeEventListener('resize', updateViewportLayout);
    };
  }, []);

  useEffect(() => {
    if (railOnly) return;

    const desktopMedia = window.matchMedia('(min-width: 80rem)');
    const closeAtDesktopBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    desktopMedia.addEventListener('change', closeAtDesktopBreakpoint);
    return () => desktopMedia.removeEventListener('change', closeAtDesktopBreakpoint);
  }, [railOnly]);

  useEffect(() => {
    if (!open) return;

    const closeOnDocumentScroll = () => setOpen(false);

    window.addEventListener('scroll', closeOnDocumentScroll, { passive: true });

    return () => window.removeEventListener('scroll', closeOnDocumentScroll);
  }, [open]);

  const handleNavigate = (slug: string) => {
    setOpen(false);
    onNavigate(slug);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
      <Popover.Trigger
        ref={triggerRef}
        aria-label="On this page"
        data-ph-capture-attribute-location="docs-toc"
        className={clsx(
          'fixed left-0 z-20 flex min-h-6 w-6 items-center justify-start intent:text-manila-dark dark:intent:text-manila-dark',
          !railOnly && 'md:left-70 lg:left-75',
          open ? 'text-manila-dark dark:text-manila-dark' : 'text-manila-75 dark:text-warm-gray',
          className
        )}
        style={{
          left: railOnly ? MARGIN_RAIL_LEFT : undefined,
          top: viewportLayout.railTop ?? 'calc(50dvh + (var(--banner-height) + var(--nav-h)) / 2)',
          transform: 'translateY(-50%)',
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden="true"
          className="flex flex-col items-start gap-(--gap) pl-1 lg:gap-(--lg-gap)"
          style={railStyle}
        >
          {headings.map((heading) => {
            const isActive = activeId === heading.slug;
            const { width, largeWidth } = getStripeWidths(heading.depth, railOnly);
            const stripeStyle: RailStripeStyle = {
              '--w': `${width}px`,
              '--lg-w': `${largeWidth}px`,
              '--h': `${railGeometry.stripeHeight}px`,
              '--lg-h': `${largeRailGeometry.stripeHeight}px`,
            };

            return (
              <span
                key={heading.slug}
                className={clsx(
                  'block h-(--h) w-(--w) lg:h-(--lg-h) lg:w-(--lg-w)',
                  isActive ? 'bg-faded-black dark:bg-manila-light' : 'bg-current'
                )}
                style={stripeStyle}
              />
            );
          })}
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="right"
          align="center"
          sideOffset={-4}
          collisionPadding={16}
          positionMethod="fixed"
          className="z-20"
        >
          <Popover.Popup
            ref={popupRef}
            initialFocus={() =>
              popupRef.current?.querySelector<HTMLAnchorElement>('a[aria-current="location"]') ??
              popupRef.current?.querySelector<HTMLAnchorElement>('a[href]') ??
              popupRef.current
            }
            className={clsx(
              'origin-left overflow-y-auto rounded-lg corner-squircle border border-manila-dark bg-manila-light pl-6 text-p3 shadow-xl transition duration-150 ease-out',
              'starting-style:-translate-x-1 starting-style:scale-98 starting-style:opacity-0',
              'ending-style:-translate-x-1 ending-style:scale-98 ending-style:opacity-0 ending-style:duration-100 ending-style:ease-in',
              'motion-reduce:transition-none motion-reduce:starting-style:translate-x-0 motion-reduce:starting-style:scale-100 motion-reduce:ending-style:translate-x-0 motion-reduce:ending-style:scale-100',
              'dark:bg-soot'
            )}
            style={{
              width: 'min(20rem, calc(100vw - 3rem))',
              maxHeight: viewportLayout.availableHeight,
            }}
          >
            <TableOfContentsDesktop headings={headings} activeId={activeId} onNavigate={handleNavigate} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
