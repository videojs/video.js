import { Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { Fragment } from 'react';

import ArrowUpRight from '@/assets/icons/arrow-up-right.svg?react';
import Check from '@/assets/icons/check.svg?react';
import ChevronDown from '@/assets/icons/chevron-down.svg?react';
import { LEGACY_URL, PRERELEASE_URL, PRODUCTION_URL } from '@/consts';
import { twMerge } from '@/utils/twMerge';
import useIsHydrated from '@/utils/useIsHydrated';

export type DocsChannel = 'legacy' | 'current' | 'main';

export interface VersionMenuProps {
  className?: string;
  /** The documented package version, shown for the current release. */
  version: string;
  /** The docs this page belongs to; `main` on the pre-release host. */
  channel: Exclude<DocsChannel, 'legacy'>;
  /** Kept when switching between current and main, which share routes. Legacy docs have their own structure. */
  currentPath: string;
}

interface ChannelOption {
  value: DocsChannel;
  label: string;
  description: string;
  href: string;
  external?: boolean;
}

const itemClass = clsx(
  'flex cursor-pointer items-center gap-2.5 rounded-md corner-squircle px-2 py-1.5 text-p3 no-underline outline-none select-none',
  'data-[highlighted]:bg-surface dark:data-[highlighted]:bg-warm-gray'
);

/** Newest first, as most versioned docs list them. Legacy docs live on their own site, so they come last and open there. */
export function channelOptions(version: string, currentPath: string): ChannelOption[] {
  return [
    {
      value: 'main',
      label: 'main',
      description: 'Pre-release',
      href: new URL(currentPath, PRERELEASE_URL).href,
    },
    {
      value: 'current',
      label: `v${version}`,
      description: 'Latest',
      href: new URL(currentPath, PRODUCTION_URL).href,
    },
    {
      value: 'legacy',
      label: 'v8 and earlier',
      description: 'Legacy',
      href: LEGACY_URL.href,
      external: true,
    },
  ];
}

/** Version chip beside the logo that switches between the legacy, current, and pre-release docs. */
export default function VersionMenu({ className, version, channel, currentPath }: VersionMenuProps) {
  const isHydrated = useIsHydrated();
  const options = channelOptions(version, currentPath);
  const selected = options.find((option) => option.value === channel)!;

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        disabled={!isHydrated}
        aria-label={`Docs version: ${selected.label}`}
        data-ph-capture-attribute-cta="version-menu"
        className={twMerge(
          clsx(
            'inline-flex h-5 items-center gap-0.5 rounded-md corner-squircle bg-surface-raised pr-1 pl-1.5 text-p4 font-medium text-muted whitespace-nowrap ring-1 ring-line select-none',
            'intent:text-faded-black dark:intent:text-manila-light data-[popup-open]:text-faded-black dark:data-[popup-open]:text-manila-light',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold',
            isHydrated ? 'cursor-pointer' : 'cursor-wait'
          ),
          className
        )}
      >
        {selected.label}
        <ChevronDown className="size-3" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-60 outline-none">
          <Menu.Popup
            className={clsx(
              'min-w-56 origin-(--transform-origin) rounded-lg corner-squircle border border-line bg-surface-raised p-1 text-p3 shadow-lg dark:bg-soot',
              'transition duration-150 ease-out starting-style:scale-95 starting-style:opacity-0 ending-style:scale-95 ending-style:opacity-0 ending-style:duration-100',
              'motion-reduce:transition-none'
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === channel;

              return (
                <Fragment key={option.value}>
                  {option.external && <Menu.Separator className="bg-line my-1 h-px" />}
                  <Menu.Item
                    className={itemClass}
                    render={
                      <a
                        href={option.href}
                        aria-current={isSelected ? 'page' : undefined}
                        data-ph-capture-attribute-cta={`version-${option.value}`}
                        data-ph-capture-attribute-destination={option.external ? 'external' : undefined}
                      />
                    }
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {isSelected && <Check className="text-accent size-4" aria-hidden="true" />}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      {option.label}
                      {option.external && <ArrowUpRight className="text-muted size-3.5" aria-hidden="true" />}
                    </span>
                    <span className="text-muted ml-auto">{option.description}</span>
                  </Menu.Item>
                </Fragment>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
