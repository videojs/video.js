import { Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import {
  Fragment,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import Info from '@/assets/icons/info.svg?react';

import '../Range.css';
import './Comparison.css';

export interface ComparisonProps {
  items: readonly { label: string; content: ReactNode }[];
  children?: ReactNode;
  label?: string;
  className?: string;
  aspectRatio?: string;
  /** Set false when items contain no controls, so every visible item stays available to assistive technology. */
  interactive?: boolean;
}

function Layer({
  item,
  start,
  width,
  accessible,
  onActivate,
  onReveal,
}: {
  item: ComparisonProps['items'][number];
  start: number;
  width: number;
  accessible: boolean;
  onActivate: () => void;
  onReveal: () => void;
}) {
  const slice = useRef<HTMLDivElement>(null);
  const { label, content } = item;

  useLayoutEffect(() => {
    const root = slice.current;
    if (!root || accessible) return;

    // aria-hidden leaves pointer interaction available; remove hidden controls from keyboard navigation as well.
    const saved = new Map<HTMLElement, string | null>();

    const hideTabStops = () => {
      for (const element of root.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]'
      )) {
        if (!saved.has(element)) saved.set(element, element.getAttribute('tabindex'));

        if (element.tabIndex !== -1) element.setAttribute('tabindex', '-1');
      }
    };

    // Our own writes are discarded with takeRecords(), so any tabindex change recorded here is the content's new
    // intent, such as a roving tab stop moving while the slice is hidden.
    const remember = (records: MutationRecord[]) => {
      for (const { type, target } of records) {
        if (type === 'attributes' && target instanceof HTMLElement) saved.set(target, target.getAttribute('tabindex'));
      }
    };

    hideTabStops();
    const observer = new MutationObserver((records) => {
      remember(records);
      hideTabStops();
      observer.takeRecords();
    });

    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['tabindex'] });

    return () => {
      remember(observer.takeRecords());
      observer.disconnect();

      for (const [element, value] of saved) {
        if (value === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', value);
      }
    };
  }, [accessible]);

  return (
    <div
      ref={slice}
      className="comparison-slice"
      role="group"
      aria-label={label}
      inert={width === 0}
      aria-hidden={!accessible || undefined}
      style={{ left: `${start}%`, width: `${width}%` }}
      onPointerDownCapture={onActivate}
      onClickCapture={(event) => {
        // Assistive technology can activate a control without first moving DOM focus.
        if (event.detail === 0) onReveal();
      }}
      onFocusCapture={(event) => {
        // A keyboard user should never land on a control hidden by the comparison crop.
        if (
          event.target.matches(':focus-visible') &&
          event.target.matches(
            'button, a[href], input, select, textarea, [role=button], [role=slider], [role=checkbox], [role=radio], [role=combobox]'
          )
        )
          onReveal();
      }}
    >
      <div className="comparison-content" style={{ left: `${-start}cqw` }}>
        {content}
      </div>
      <span className="comparison-label" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

export default function Comparison({
  items,
  children,
  label = 'Content comparison',
  className,
  aspectRatio = '16 / 9',
  interactive = true,
}: ComparisonProps) {
  const initial = items.slice(1).map((_, index) => ((index + 1) / items.length) * 100);
  const [dividers, setDividers] = useState(initial);
  const [active, setActive] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);
  const [accessible, setAccessible] = useState(0);
  const [count, setCount] = useState(items.length);
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  // Distance from the pointer to the grabbed handle's center, so a drag doesn't snap the handle to the pointer.
  const grab = useRef(0);

  // A different number of items invalidates every divider position.
  if (count !== items.length) {
    setCount(items.length);
    setDividers(initial);
    setActive(null);
    setAccessible(0);
  }

  const edges = [0, ...dividers, 100];
  const selected =
    active ??
    (edges[accessible + 1]! > edges[accessible]!
      ? accessible
      : items.findIndex((_, index) => edges[index + 1]! > edges[index]!));

  function reveal(index: number) {
    setAnimate(true);
    setDividers(initial.map((_, divider) => (divider < index ? 0 : 100)));
    setAccessible(index);
    setActive(index);
  }

  function reset() {
    setAnimate(true);
    setDividers(initial);
    setAccessible(0);
    setActive(null);
  }

  function move(index: number, value: number) {
    setAnimate(false);
    setActive(null);
    const position = Math.max(0, Math.min(100, value));

    setDividers((previous) =>
      previous.map((divider, other) => {
        if (other < index) return Math.min(divider, position);

        if (other > index) return Math.max(divider, position);

        return position;
      })
    );
  }

  function drag(index: number, event: PointerEvent<HTMLDivElement>) {
    const bounds = stage.current?.getBoundingClientRect();
    if (!bounds) return;

    move(index, ((event.clientX - grab.current - bounds.left) / bounds.width) * 100);
  }

  function key(index: number, event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey || event.key.startsWith('Page') ? 10 : 1;
    const value = dividers[index]!;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
      case 'PageDown':
        move(index, value - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
      case 'PageUp':
        move(index, value + step);
        break;
      case 'Home':
        move(index, 0);
        break;
      case 'End':
        move(index, 100);
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <section
      ref={root}
      className={clsx('comparison', className)}
      aria-label={label}
      data-animate={animate || undefined}
    >
      <div className="comparison-toolbar" role="group" aria-label="Reveal an item">
        <button type="button" aria-pressed={active === null} onClick={reset}>
          Compare all
        </button>
        {items.map(({ label: name }, index) => (
          <button key={name} type="button" aria-pressed={active === index} onClick={() => reveal(index)}>
            {name}
          </button>
        ))}
      </div>
      <div ref={stage} className="comparison-stage" style={{ aspectRatio }}>
        {children}
        {items.map((item, index) => (
          <Layer
            key={item.label}
            item={item}
            start={edges[index]!}
            width={edges[index + 1]! - edges[index]!}
            accessible={edges[index + 1]! > edges[index]! && (!interactive || selected === index)}
            onActivate={() => setAccessible(index)}
            onReveal={() => reveal(index)}
          />
        ))}
        {dividers.map((value, index) => (
          <Fragment key={index}>
            <span className="comparison-divider-line" style={{ left: `${value}%` }} aria-hidden="true" />
            <div
              tabIndex={0}
              role="slider"
              className="comparison-divider"
              aria-label={`${items[index]!.label} and ${items[index + 1]!.label} divider`}
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-valuetext={`${Math.round(value)}% across the comparison`}
              style={{ left: `${value}%`, top: `${((index + 1) / items.length) * 100}%` }}
              onKeyDown={(event) => key(index, event)}
              onDoubleClick={(event) => {
                event.stopPropagation();
                reset();
              }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;

                event.preventDefault();
                event.currentTarget.focus();
                event.currentTarget.setPointerCapture(event.pointerId);
                const handle = event.currentTarget.getBoundingClientRect();

                grab.current = event.clientX - (handle.left + handle.width / 2);

                // Pick up an interrupted transition where the handles are currently drawn.
                if (animate) {
                  const bounds = stage.current!.getBoundingClientRect();
                  const handles = stage.current!.querySelectorAll<HTMLElement>('.comparison-divider');

                  setDividers(
                    [...handles].map((element) => {
                      const rect = element.getBoundingClientRect();

                      return ((rect.left + rect.width / 2 - bounds.left) / bounds.width) * 100;
                    })
                  );
                }
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) drag(index, event);
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
            >
              <svg
                width="20"
                height="16"
                viewBox="0 0 20 16"
                aria-hidden="true"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <path d="M7 4 3 8l4 4Z M13 4l4 4-4 4Z" />
              </svg>
            </div>
          </Fragment>
        ))}
      </div>
      <div className="comparison-footer">
        <details className="comparison-adjust">
          <summary>Adjust dividers</summary>
          <div>
            {dividers.map((value, index) => (
              <label key={index}>
                {items[index]!.label} / {items[index + 1]!.label}
                <input
                  type="range"
                  className="range-input"
                  min={0}
                  max={100}
                  value={value}
                  style={
                    // SAFETY: React's CSSProperties omits CSS custom properties; --fill is a percentage string.
                    { '--fill': `${value}%` } as CSSProperties
                  }
                  onChange={(event) => move(index, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        </details>
        <Popover.Root modal={false}>
          <Popover.Trigger
            aria-label="Comparison help"
            className="text-muted flex size-6 cursor-pointer items-center justify-center rounded-sm"
          >
            <Info className="size-4" aria-hidden="true" />
          </Popover.Trigger>
          <Popover.Portal container={root}>
            <Popover.Positioner side="top" align="end" sideOffset={8} style={{ zIndex: 70 }}>
              <Popover.Popup className="bg-surface-raised text-p3 dark:bg-soot w-80 max-w-(--available-width) rounded-lg p-4 shadow-lg ring-1 ring-black/10 dark:ring-white/10">
                <Popover.Title className="sr-only">How to compare</Popover.Title>
                <Popover.Description className="text-box-trim-both text-box-edge-cap-alphabetic">
                  Drag the dividers to compare, or select an item to view it in full. Double-click a handle to reset the
                  comparison. Keyboard focus reveals an item in full; use arrow keys or Adjust dividers to move a
                  divider.
                </Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </section>
  );
}
