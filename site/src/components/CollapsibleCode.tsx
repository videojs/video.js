import clsx from 'clsx';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import ChevronDown from '@/assets/icons/chevron-down.svg?react';

import type { TabsVariant } from './Tabs';

/**
 * Collapsed height for long code. Content that only slightly exceeds the cap is shown in full, since a "Show more"
 * button that reveals a couple of lines is more annoying than the extra height.
 */
const COLLAPSED_MAX_HEIGHT = 512;
const COLLAPSE_SLACK = 96;

interface CollapsibleCodeProps {
  children: ReactNode;
  /** Classes for the element that holds the content and collapses. */
  className?: string;
  /** Whether the content is shown. Hidden content has no layout, so it's measured once shown. */
  active?: boolean;
  variant?: TabsVariant;
  /** Where the fade over collapsed content starts, when the content's background isn't the code frame's. */
  fadeClassName?: string;
  /** The ancestor to bring back into view when collapsing from below it. Defaults to the content itself. */
  scrollTarget?: string;
}

/**
 * Caps long code at a fixed height with "Show more" and "Show less" controls, as code frames do. Render it inside a
 * positioned element, since the fade and its button sit over the bottom edge of the content.
 */
export default function CollapsibleCode({
  children,
  className,
  active = true,
  variant = 'compact',
  fadeClassName,
  scrollTarget,
}: CollapsibleCodeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // The content's natural height decides whether the collapse affordance is needed at all.
  useEffect(() => {
    const content = contentRef.current;
    if (!active || !content) return;

    const measure = () => setOverflows(content.scrollHeight > COLLAPSED_MAX_HEIGHT + COLLAPSE_SLACK);

    measure();
    const observer = new ResizeObserver(measure);

    observer.observe(content);

    return () => {
      observer.disconnect();
    };
  }, [active]);

  const collapsed = overflows && !expanded;

  const onCollapse = () => {
    setExpanded(false);

    // Collapsing from the bottom of a long block would otherwise leave the reader below it.
    const content = contentRef.current;
    const root = scrollTarget ? content?.closest(scrollTarget) : content;

    if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: 'start' });
  };

  const buttonClassName = clsx(
    'flex items-center gap-1.5 h-7 pl-2.5 pr-3 rounded-full corner-squircle text-p3 font-medium cursor-pointer select-none',
    variant === 'compact'
      ? 'bg-warm-gray text-manila-light border border-manila-light/15 intent:border-manila-light/30'
      : 'bg-surface-raised border border-line intent:border-line-strong'
  );

  return (
    <>
      <div
        ref={contentRef}
        className={clsx(className, collapsed && 'overflow-y-hidden')}
        style={collapsed ? { maxHeight: COLLAPSED_MAX_HEIGHT } : undefined}
      >
        {children}
      </div>
      {collapsed && (
        <div
          className={clsx(
            'pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center pb-4 bg-linear-to-t to-transparent',
            fadeClassName ??
              (variant === 'compact' ? 'from-faded-black dark:from-soot' : 'from-manila-light dark:from-faded-black')
          )}
          data-copy-ignore
          data-search-ignore
          data-llms-ignore
        >
          <button
            type="button"
            className={clsx(buttonClassName, 'pointer-events-auto')}
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="size-4" />
            Show more
          </button>
        </div>
      )}
      {overflows && expanded && (
        <div
          className={clsx(
            'flex justify-center border-t py-3',
            variant === 'compact' ? 'border-manila-light/10 dark:border-line' : 'border-line'
          )}
          data-copy-ignore
          data-search-ignore
          data-llms-ignore
        >
          <button type="button" className={buttonClassName} onClick={onCollapse}>
            <ChevronDown className="size-4 rotate-180" />
            Show less
          </button>
        </div>
      )}
    </>
  );
}
