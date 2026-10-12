import clsx from 'clsx';
import { type ReactNode, useRef } from 'react';

import { OverflowToggle, useOverflowCollapse } from './OverflowCollapse';
import type { TabsVariant } from './Tabs';

/** Collapsed height for long code, and how far past it code still shows in full. */
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
  const { overflows, expanded, collapsed, expand, collapse } = useOverflowCollapse(contentRef, {
    maxHeight: COLLAPSED_MAX_HEIGHT,
    slack: COLLAPSE_SLACK,
    measurable: active,
  });
  const tone = variant === 'compact' ? 'dark' : 'surface';

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
          <OverflowToggle expanded={false} tone={tone} onClick={expand} className="pointer-events-auto" />
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
          <OverflowToggle
            expanded
            tone={tone}
            onClick={() => {
              const content = contentRef.current;

              collapse(scrollTarget ? content?.closest(scrollTarget) : content);
            }}
          />
        </div>
      )}
    </>
  );
}
