/**
 * Accessible tabs component implementing the WAI-ARIA Tabs pattern. Reference:
 * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Built without context, using some unusual patterns, to work around some restrictions with Astro islands: namely, that
 * separate islands can't share context, and that, depending on rendering context, Astro may render the component tree
 * bottom-up or top-down
 *
 * IMPORTANT: Use `client:idle` instead of `client:visible` when hydrating these components. TabsPanel elements start
 * with `hidden` attribute, which prevents them from triggering Intersection Observer visibility, causing
 * `client:visible` to never hydrate non-initial panels.
 */

import clsx from 'clsx';
import { kebabCase } from 'es-toolkit/string';
import { useEffect, useId, useRef, useState } from 'react';

import Check from '@/assets/icons/check.svg?react';
import CopyIcon from '@/assets/icons/copy.svg?react';
import { twMerge } from '@/utils/twMerge';
import useIsHydrated from '@/utils/useIsHydrated';

import CollapsibleCode from './CollapsibleCode';
import CopyButton from './CopyButton';

export type TabsVariant = 'expanded' | 'compact';

interface TabsRootProps {
  children: React.ReactNode;
  maxWidth?: boolean;
  className?: string;
  id?: string;
  variant?: TabsVariant;
}
export function TabsRoot({ children, maxWidth = true, className, id: propId, variant = 'compact' }: TabsRootProps) {
  const ref = useRef<HTMLDivElement>(null);

  // A stable id shared with the tab and panel islands through the DOM. `useId` matches between server and client, so
  // the descendants can derive their own ids without a context and without patching attributes after hydration.
  const generatedId = useId();
  const id = propId ?? generatedId;

  return (
    <div
      ref={ref}
      className={twMerge(
        clsx(
          // The panel background fills the whole frame; the header sits flush on top of it with a hairline divider.
          'overflow-hidden flex flex-col my-8 rounded-lg corner-squircle border border-faded-black/10 dark:border-line',
          variant === 'compact'
            ? 'bg-faded-black dark:bg-soot text-manila-light'
            : 'bg-manila-light dark:bg-faded-black',
          maxWidth && 'w-full max-w-3xl mx-auto',
          className
        )
      )}
      data-tabs-root
      data-tabs-id={id}
    >
      {children}
    </div>
  );
}

interface TabsListProps {
  label: string;
  children: React.ReactNode;
  variant?: TabsVariant;
  /** PostHog `cta` autocapture property for the copy button. */
  copyCta?: string;
}
export function TabsList({ label, children, variant = 'compact', copyCta = 'copy-code' }: TabsListProps) {
  return (
    <div
      className={clsx(
        'w-full flex items-center gap-1 h-10 pl-1.5 pr-1.5',
        variant === 'compact' &&
          'border-b border-manila-light/10 dark:border-line bg-manila-light/4 dark:bg-warm-gray/60',
        variant === 'expanded' && 'px-2.5'
      )}
    >
      <div
        role="tablist"
        data-orientation="horizontal"
        aria-label={label}
        className={clsx(
          'flex list-none p-0 m-0 min-w-0 overflow-x-auto scrollbar-thin',
          variant === 'compact' ? 'gap-0.5' : 'gap-5 px-2.5'
        )}
      >
        {children}
      </div>
      <CopyButton
        analytics={{ block: kebabCase(label) }}
        copyFrom={{
          container: `[data-tabs-root]`,
          target: '[role="tabpanel"]:not([hidden])',
        }}
        className={clsx(
          'ml-auto shrink-0 size-7 flex items-center justify-center cursor-pointer disabled:cursor-wait rounded-md corner-squircle',
          variant === 'compact'
            ? 'text-manila-light/60 intent:text-manila-light intent:bg-manila-light/10'
            : 'intent:bg-hover'
        )}
        copied={<Check className="text-gold size-4" />}
        cta={copyCta}
      >
        <CopyIcon className="size-4" />
      </CopyButton>
    </div>
  );
}

interface TabProps {
  value: string;
  children: React.ReactNode;
  initial?: boolean;
  onSelect?: (value: string) => void;
  variant?: TabsVariant;
}
export function Tab({ value, children, initial, onSelect, variant = 'compact' }: TabProps) {
  const isHydrated = useIsHydrated();
  const ref = useRef<HTMLButtonElement>(null);
  const [isActive, setIsActive] = useState(initial);
  const [ids, setIds] = useState<{ id: string; controls: string } | null>(null);

  // Read the root's id from the DOM after mount so React owns these attributes and hydration stays clean.
  useEffect(() => {
    const base = ref.current?.closest('[data-tabs-root]')?.getAttribute('data-tabs-id');

    if (base) setIds({ id: `tab-${base}-${value}`, controls: `panel-${base}-${value}` });
  }, [value]);

  const onClick = () => {
    onSelect?.(value);

    if (ref.current) {
      // set data-tab-active on this button to true
      ref.current.setAttribute('data-tab-active', 'true');
      // set data-tab-active on all sibling buttons to false
      const siblings = ref.current.closest('[data-tabs-root]')?.querySelectorAll('[role="tab"]') || [];

      siblings.forEach((sibling) => {
        if (sibling !== ref.current) {
          sibling.setAttribute('data-tab-active', 'false');
        }
      });
      // and each tab will handle updating its own React state with the effects below.
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Find all tab siblings within the tablist
    const tabsRoot = ref.current?.closest('[data-tabs-root]');
    const allTabs = Array.from(tabsRoot?.querySelectorAll('[role="tab"]') || []) as HTMLElement[];
    const currentIndex = allTabs.indexOf(ref.current!);
    if (currentIndex === -1) return;

    let targetIndex: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        // Move to previous tab, wrap to last if at start
        targetIndex = currentIndex - 1;

        if (targetIndex < 0) targetIndex = allTabs.length - 1;

        break;
      case 'ArrowRight':
        // Move to next tab, wrap to first if at end
        targetIndex = currentIndex + 1;

        if (targetIndex >= allTabs.length) targetIndex = 0;

        break;
      case 'Home':
        // Jump to first tab
        targetIndex = 0;
        break;
      case 'End':
        // Jump to last tab
        targetIndex = allTabs.length - 1;
        break;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      const targetTab = allTabs[targetIndex];

      // Activate the tab (reuse existing activation logic)
      targetTab.click();

      // Move focus to the tab
      targetTab.focus();
    }
  };

  // since we're communicating through the DOM, not through context,
  // we'll need to update isActive with a mutation observer
  // that observer will listen to data-tab-active
  useEffect(() => {
    // on mount, let's set the initial state of data-tab-active
    if (ref.current) {
      ref.current.setAttribute('data-tab-active', initial ? 'true' : 'false');
    }
  }, [initial]);
  useEffect(() => {
    // then, let's listen for the changes that our event handlers make
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-tab-active') {
          // Fix: mutation.target is Node, cast to Element to use getAttribute
          const target = mutation.target as Element;
          const newValue = target.getAttribute('data-tab-active') === 'true';

          setIsActive(newValue);
        }
      });
    });

    if (ref.current) {
      observer.observe(ref.current, { attributes: true });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div key={value} className="flex shrink-0">
      <button
        ref={ref}
        type="button"
        role="tab"
        id={ids?.id}
        aria-controls={ids?.controls}
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        onClick={onClick}
        onKeyDown={onKeyDown}
        data-value={value}
        className={clsx(
          'group flex items-center gap-2 text-p3 select-none',
          'no-underline',
          variant === 'expanded' && 'uppercase font-display',
          variant === 'expanded' && isActive && 'text-accent',
          variant === 'compact' && 'px-2.5 z-0 h-7 rounded-md corner-squircle',
          variant === 'compact' &&
            (isActive
              ? 'bg-manila-light/12 text-manila-light'
              : 'text-manila-light/60 intent:text-manila-light intent:bg-manila-light/6'),
          isHydrated ? 'cursor-pointer' : 'cursor-wait'
        )}
      >
        {variant === 'expanded' && (
          <span
            className={clsx(
              'w-3 h-3 rounded-full border group-hover:bg-manila-dark',
              variant === 'expanded' && 'border-faded-black dark:border-manila-light',
              isActive && 'bg-accent group-hover:bg-accent'
            )}
          />
        )}
        <span className="relative">
          {/* to prevent layout shift on state change, we have an invisible bold version of the text preserving space */}
          <span className="invisible font-semibold" aria-hidden="true" data-search-ignore data-llms-ignore>
            {children}
          </span>
          <span className={clsx('absolute top-0 left-0', isActive && 'font-semibold')}>{children}</span>
        </span>
      </button>
    </div>
  );
}

interface TabsPanelProps {
  value: string;
  children: React.ReactNode;
  initial?: boolean;
  className?: string;
  variant?: TabsVariant;
}

export function TabsPanel({ value, children, initial, className, variant = 'compact' }: TabsPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(initial);
  const [ids, setIds] = useState<{ id: string; labelledBy: string } | null>(null);

  useEffect(() => {
    const base = ref.current?.closest('[data-tabs-root]')?.getAttribute('data-tabs-id');

    if (base) setIds({ id: `panel-${base}-${value}`, labelledBy: `tab-${base}-${value}` });
  }, [value]);

  // Observe the corresponding Tab element's data-tab-active attribute
  // to sync panel visibility with tab activation
  useEffect(() => {
    const tabsRoot = ref.current?.closest('[data-tabs-root]');
    const correspondingTab = tabsRoot?.querySelector(`[role="tab"][data-value="${value}"]`);
    if (!correspondingTab) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-tab-active') {
          const target = mutation.target as Element;
          const newValue = target.getAttribute('data-tab-active') === 'true';

          setIsActive(newValue);
        }
      });
    });

    observer.observe(correspondingTab, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, [value]);

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={ids?.id}
      aria-labelledby={ids?.labelledBy}
      hidden={!isActive}
      data-value={value}
      className={twMerge(clsx('relative flex-1 min-h-0'), className)}
    >
      {/* A hidden panel has no layout, so it's measured once it's shown. */}
      <CollapsibleCode
        active={Boolean(isActive)}
        variant={variant}
        className="scrollbar-thin overflow-x-auto px-7 py-5"
        scrollTarget="[data-tabs-root]"
      >
        {children}
      </CollapsibleCode>
    </div>
  );
}
