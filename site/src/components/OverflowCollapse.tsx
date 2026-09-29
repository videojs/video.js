import clsx from 'clsx';
import { useEffect, useState, type RefObject } from 'react';

import ChevronDown from '@/assets/icons/chevron-down.svg?react';
import { twMerge } from '@/utils/twMerge';

interface OverflowCollapseOptions {
  /** The collapsed height, in pixels. */
  maxHeight: number;
  /**
   * How far content may exceed the collapsed height and still show in full, since a "Show more" button that reveals a
   * couple of lines is more annoying than the extra height.
   */
  slack: number;
  /** Whether the element has layout to measure. A hidden panel has none, so it measures once shown. */
  measurable?: boolean;
  /**
   * Content that can change while the element is collapsed. A collapsed element keeps its height as its content grows
   * or shrinks, so the resize observer alone would miss the change.
   */
  content?: unknown;
}

export interface OverflowCollapse {
  /** Whether the content is tall enough to collapse. */
  overflows: boolean;
  expanded: boolean;
  collapsed: boolean;
  expand: () => void;
  /** Collapse, scrolling `anchor` back into view when the reader is below its top. */
  collapse: (anchor?: Element | null) => void;
}

/** Collapse tall content to a preview, as code frames do, with state for its "Show more" and "Show less" controls. */
export function useOverflowCollapse(
  ref: RefObject<HTMLElement | null>,
  { maxHeight, slack, measurable = true, content }: OverflowCollapseOptions
): OverflowCollapse {
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!measurable || !element) return;

    const measure = () => setOverflows(element.scrollHeight > maxHeight + slack);

    measure();
    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, maxHeight, slack, measurable, content]);

  return {
    overflows,
    expanded,
    collapsed: overflows && !expanded,
    expand: () => setExpanded(true),
    collapse: (anchor) => {
      setExpanded(false);

      // Collapsing from the bottom of long content would otherwise leave the reader below it.
      if (anchor && anchor.getBoundingClientRect().top < 0) anchor.scrollIntoView({ block: 'start' });
    },
  };
}

const TONE_CLASSES = {
  /** On a dark frame, such as a compact code block or the AI Quickstart prompt. */
  dark: 'bg-warm-gray text-manila-light border-manila-light/15 intent:border-manila-light/30',
  surface: 'bg-surface-raised border-line intent:border-line-strong',
} as const;

interface OverflowToggleProps {
  expanded: boolean;
  tone: keyof typeof TONE_CLASSES;
  onClick: () => void;
  className?: string;
}

/** The "Show more" or "Show less" control for collapsed content. */
export function OverflowToggle({ expanded, tone, onClick, className }: OverflowToggleProps) {
  return (
    <button
      type="button"
      className={twMerge(
        clsx(
          'corner-squircle text-p3 flex h-7 cursor-pointer items-center gap-1.5 rounded-full border pr-3 pl-2.5 font-medium select-none',
          TONE_CLASSES[tone]
        ),
        className
      )}
      onClick={onClick}
    >
      <ChevronDown className={clsx('size-4', expanded && 'rotate-180')} aria-hidden="true" />
      {expanded ? 'Show less' : 'Show more'}
    </button>
  );
}
