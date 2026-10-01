import type { MarkdownHeading } from 'astro';
import clsx from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';

import { useAutoScroll } from './utils';

interface TableOfContentsDesktopProps {
  headings: MarkdownHeading[];
  activeId: string;
  onNavigate: (slug: string) => void;
  className?: string;
}

interface IndicatorPosition {
  top: number;
  height: number;
}

export function TableOfContentsDesktop({ headings, activeId, onNavigate, className }: TableOfContentsDesktopProps) {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<IndicatorPosition | null>(null);

  useAutoScroll({ activeId, containerRef: navRef });

  // The indicator is one element that slides to the active link, like the sidenav's, rather than a border per link.
  useLayoutEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLAnchorElement>('a[aria-current="location"]');

    if (!list || !active) {
      setIndicator(null);
      return;
    }

    const listTop = list.getBoundingClientRect().top;
    const rect = active.getBoundingClientRect();

    setIndicator({ top: rect.top - listTop, height: rect.height });
  }, [activeId, headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    onNavigate(slug);
  };

  return (
    <nav
      ref={navRef}
      aria-label="On this page"
      className={clsx('', className)}
      data-ph-capture-attribute-location="docs-toc"
    >
      <div className="py-8 pr-6">
        <h2 className="text-p3 mb-3 font-semibold select-none">On this page</h2>
        <ul ref={listRef} className="border-line relative border-l">
          {indicator && (
            <span
              aria-hidden="true"
              className="bg-accent absolute -left-px w-px transition-[transform,height] duration-300 ease-out motion-reduce:transition-none"
              style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height, top: 0 }}
            />
          )}
          {headings.map((heading) => (
            <li key={heading.slug}>
              <a
                href={`#${heading.slug}`}
                onClick={(e) => handleClick(e, heading.slug)}
                className={clsx(
                  'text-p3 block py-1.5 leading-5 transition-colors',
                  activeId === heading.slug
                    ? 'text-accent font-semibold'
                    : 'text-muted intent:text-faded-black dark:intent:text-manila-light'
                )}
                style={{ paddingLeft: `calc(var(--spacing) * 4 + ${heading.depth - 2} * var(--spacing) * 4)` }}
                aria-current={activeId === heading.slug ? 'location' : undefined}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
