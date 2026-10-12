import { styles } from 'vjsc/styles';

export default styles({
  file: 'menus.css',
  prefix: 'media-menu',
  rules: {
    popup: {
      utilities: [
        'z-20 m-0 min-w-44 max-w-(--media-menu-available-width) overflow-hidden! rounded-none bg-media-popover p-0 text-media-popover-foreground',
        'shadow-none [--media-popup-side-offset:var(--media-popover-side-offset)] [--media-popover-side-offset:calc(var(--media-spacing)*9)]',
        'max-h-[min(var(--media-menu-available-height,--spacing(56)),--spacing(56))] overscroll-none',
        'h-(--media-menu-height) w-(--media-menu-width)',
        'media-high-contrast:outline forced-colors:outline',
      ],
    },
    content: {
      utilities: [
        'absolute max-h-full overflow-auto overscroll-none outline-hidden',
        '[clip-path:inset(0)]',
        'flex flex-col gap-2! p-2 not-data-submenu:inset-x-0 not-data-submenu:top-0',
        'not-data-submenu:data-child-open:transform-[translateX(-100%)]',
        'not-data-submenu:data-child-open:rtl:transform-[translateX(100%)]',
        'not-data-submenu:data-child-open:[clip-path:inset(0_0_0_100%)] not-data-submenu:data-child-open:rtl:[clip-path:inset(0_100%_0_0)]',
        'data-submenu:inset-x-0 data-submenu:top-0 data-submenu:z-10',
      ],
    },
    item: {
      utilities: [
        'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-none min-h-8 w-full shrink-0 bg-media-background bg-clip-padding px-2 py-0 text-start',
        'data-[availability=unavailable]:hidden data-[availability=unsupported]:hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-current',
        'data-highlighted:bg-(--media-button-highlight) media-high-contrast:data-highlighted:highlight-media forced-colors:data-highlighted:highlight-media',
      ],
    },
    backItem: {
      utilities: [
        'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-none min-h-8 w-full shrink-0 bg-media-background bg-clip-padding px-2 py-0 text-start',
        'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-current',
        'data-highlighted:bg-(--media-button-highlight) media-high-contrast:data-highlighted:highlight-media forced-colors:data-highlighted:highlight-media',
      ],
    },
    separator: {
      utilities: 'hidden',
    },
    hint: {
      utilities: 'ms-auto inline-flex min-w-0 items-center gap-1 ps-2 opacity-70',
    },
    hintLabel: {
      utilities: 'max-w-24 truncate',
    },
    tier: {
      utilities: 'ps-0.5 pt-px text-media-sm leading-none opacity-70',
    },
    badge: {
      utilities: 'rounded-none bg-media-muted px-1.5 text-media-sm',
    },
    radioGroup: {
      utilities: 'flex flex-col gap-2',
    },
    radioItem: {
      utilities: [
        'group/menu-radio flex cursor-pointer items-center justify-between gap-3 rounded-none min-h-8 w-full shrink-0 bg-media-background bg-clip-padding px-2 py-0',
        'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-current',
        'data-highlighted:bg-(--media-button-highlight) media-high-contrast:data-highlighted:highlight-media forced-colors:data-highlighted:highlight-media',
      ],
    },
    indicator: {
      utilities: 'ms-auto -me-1 shrink-0 opacity-0 group-aria-checked/menu-radio:opacity-100',
    },
    triggerIcon: {
      utilities: 'size-4.5 shrink-0 opacity-70',
    },
    radioIcon: {
      utilities: 'size-4.5 shrink-0 opacity-70',
    },
    forwardChevron: {
      utilities: 'size-4 shrink-0 opacity-70 rtl:transform-[scaleX(-1)]',
    },
    backChevron: {
      utilities: 'size-4 shrink-0 transform-[rotate(180deg)] rtl:transform-none opacity-70',
    },
    ratePopup: {
      utilities: 'min-w-0!',
    },
  },
});
