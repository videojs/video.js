import clsx from 'clsx';
import { useRef, useState } from 'react';

import DialInner from '@/assets/icons/dial-inner.svg?react';
import DialOuter from '@/assets/icons/dial-outer.svg?react';
import GetStartedLink from '@/components/NavBar/GetStartedLink';
import type { LinkDestination } from '@/components/typography/linkDestination';

type Link = { href: string; label: string; angle: number; destination?: LinkDestination };

export interface DialNavProps {
  left: [Link, Link];
  right: [Link, Link];
}

const TRANSITION_MS = 450;

export default function DialNav({ left, right }: DialNavProps) {
  const [activeAngle, setActiveAngle] = useState<number | null>(null);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, link: Link) {
    e.preventDefault();
    const resolvedHref = e.currentTarget.href;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setActiveAngle(link.angle);
    setActiveHref(link.href);
    timeoutRef.current = setTimeout(() => {
      window.location.href = resolvedHref;
    }, TRANSITION_MS);
  }

  function dotStyle(href: string): React.CSSProperties {
    const active = activeHref === href;

    return {
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
      backgroundColor: active ? 'var(--color-accent)' : '',
    };
  }

  const DialTag = left[0].href === '/docs' ? GetStartedLink : 'a';

  return (
    <div className="flex items-center gap-0">
      {/* Left links */}
      <div className="flex flex-col gap-2">
        {left.map((link) => {
          const Tag = link.href === '/docs' ? GetStartedLink : 'a';

          return (
            <Tag
              key={link.href}
              href={link.href}
              onClick={(e) => handleClick(e, link)}
              data-ph-capture-attribute-destination={link.destination}
              className={clsx(
                'flex rounded-md corner-squircle min-w-44 items-center gap-2 px-6 py-6 text-h5 font-display-compact font-bold uppercase text-faded-black dark:text-manila-light',
                'justify-end pr-15 -mr-12 bg-manila-50 dark:bg-black'
              )}
            >
              {link.label}
              <span
                className="border-faded-black dark:border-manila-light h-2.5 w-2.5 rounded-full border"
                style={dotStyle(link.href)}
              />
            </Tag>
          );
        })}
      </div>

      <DialTag
        href={left[0].href}
        onClick={(e) => handleClick(e, left[0])}
        data-ph-capture-attribute-destination={left[0].destination}
        aria-hidden="true"
        tabIndex={-1}
        className="text-faded-black dark:text-manila-light relative z-10 h-20 w-20 shrink-0 [--fill:var(--color-manila-light)] md:h-32 md:w-32 dark:[--fill:var(--color-faded-black)]"
      >
        <DialOuter
          className="outline-manila-dark dark:outline-soot rounded-full outline-8"
          width={'100%'}
          height={'auto'}
        />
        <DialInner
          style={{
            transformBox: 'view-box',
            transformOrigin: '50% 50%',
            transition: `transform ${TRANSITION_MS}ms var(--ease-in-out)`,
            transform: activeAngle !== null ? `rotate(${activeAngle}deg)` : undefined,
          }}
          className="absolute inset-0"
          width={'100%'}
          height={'auto'}
        />
      </DialTag>

      <div className="flex flex-col gap-2">
        {right.map((link) => {
          const Tag = link.href === '/docs' ? GetStartedLink : 'a';

          return (
            <Tag
              key={link.href}
              href={link.href}
              onClick={(e) => handleClick(e, link)}
              data-ph-capture-attribute-destination={link.destination}
              className={clsx(
                'flex rounded-md corner-squircle min-w-44 items-center gap-2 px-6 py-6 text-h5 font-display-compact font-bold uppercase text-faded-black dark:text-manila-light',
                'pl-15 -ml-12 bg-manila-50 dark:bg-black'
              )}
            >
              <span
                className="border-faded-black dark:border-manila-light h-2.5 w-2.5 rounded-full border"
                style={dotStyle(link.href)}
              />
              {link.label}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
