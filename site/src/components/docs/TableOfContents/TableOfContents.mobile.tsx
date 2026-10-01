import { Popover } from '@base-ui/react/popover';
import type { MarkdownHeading } from 'astro';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { TableOfContentsDesktop } from './TableOfContents.desktop';
import { calculateRailGeometry } from './utils';

interface TableOfContentsMobileProps {
  headings: MarkdownHeading[];
  activeId: string;
  onNavigate: (slug: string) => void;
  className?: string;
}

type RailStripeStyle = React.CSSProperties & Record<'--w' | '--lg-w', string>;

export function TableOfContentsMobile({ headings, activeId, onNavigate, className }: TableOfContentsMobileProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewportLayout, setViewportLayout] = useState({
    availableHeight: 400,
    railTop: null as number | null,
  });

  const railGeometry = calculateRailGeometry(headings.length, viewportLayout.availableHeight);

  useEffect(() => {
    const updateViewportLayout = () => {
      const computedStyle = triggerRef.current ? getComputedStyle(triggerRef.current) : null;
      const bannerHeight = Number.parseFloat(computedStyle?.getPropertyValue('--banner-height') ?? '') || 0;
      const navHeight = Number.parseFloat(computedStyle?.getPropertyValue('--nav-h') ?? '') || 52;
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
    const desktopMedia = window.matchMedia('(min-width: 80rem)');
    const closeAtDesktopBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };

    desktopMedia.addEventListener('change', closeAtDesktopBreakpoint);
    return () => desktopMedia.removeEventListener('change', closeAtDesktopBreakpoint);
  }, []);

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
          'fixed left-0 z-20 flex min-h-6 w-6 items-center justify-start intent:text-manila-dark md:left-70 dark:intent:text-manila-dark lg:left-75',
          open ? 'text-manila-dark dark:text-manila-dark' : 'text-manila-75 dark:text-warm-gray',
          className
        )}
        style={{
          top: viewportLayout.railTop ?? 'calc(50dvh + 1.625rem)',
          transform: 'translateY(-50%)',
          cursor: 'pointer',
        }}
      >
        <span aria-hidden="true" className="flex flex-col items-start pl-1" style={{ gap: railGeometry.gap }}>
          {headings.map((heading) => {
            const isActive = activeId === heading.slug;
            const width = heading.depth === 2 ? 10 : heading.depth === 3 ? 8 : 4;
            const largeWidth = heading.depth === 2 ? 12 : width;
            const stripeStyle = {
              '--w': `${width}px`,
              '--lg-w': `${largeWidth}px`,
              height: railGeometry.stripeHeight,
            } satisfies RailStripeStyle;

            return (
              <span
                key={heading.slug}
                className={clsx(
                  'block w-(--w) lg:w-(--lg-w)',
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
