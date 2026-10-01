import { styles } from 'vjsc/styles';

const menuItem = [
  'relative flex cursor-pointer select-none items-center gap-1.5 rounded-media-menu-item px-2 py-1.5 text-start whitespace-nowrap',
  'focus-ring-media',
  'media-highlighted:highlight-media',
  'focus-visible:outline-media-ring focus-visible:outline-offset-2',
  'text-shadow-media',
  'transition-[background-color,color] duration-media-fast ease-in-out',
  'media-anchored:duration-media-instant media-anchored:media-highlighted:duration-media-slow',
] as const;

const menuItemOption = [
  'justify-between tabular-nums text-inherit',
  'data-[availability=unavailable]:hidden data-[availability=unsupported]:hidden',
  'aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
] as const;

const menuItemHighlight = [
  'media-anchored:data-highlighted:[anchor-name:--media-menu-item-highlight-anchor]',
  'media-anchored:media-highlighted:bg-transparent',
] as const;

const menuHighlight = [
  '[anchor-scope:--media-menu-item-highlight-anchor]',
  'media-anchored:before:anchor-media-highlight',
  'media-transitioning:before:hidden',
  'media-transitioning:[&_*]:before:hidden',
  'media-anchored:has-data-[highlighted=]:before:duration-0',
] as const;

const menuGroup = ['flex [max-height:inherit] flex-col gap-0.5', ...menuHighlight] as const;

const menuIcon = ['shrink-0 drop-shadow-media-icon text-media-muted-foreground'] as const;

const menuChevron = [...menuIcon, 'size-media-icon-sm'] as const;

export default styles({
  file: 'menus.css',
  prefix: 'media-menu',
  rules: {
    popup: {
      utilities: [
        'm-0 min-w-44 max-w-(--media-menu-available-width) overflow-hidden! rounded-media-popup border-0 p-1 [--media-popup-side-offset:var(--media-popover-side-offset)]',
        'max-h-[min(var(--media-menu-available-height,--spacing(56)),--spacing(56))] overscroll-none',
        'h-(--media-menu-height) w-(--media-menu-width)',
        'transition-media-popup media-transitioning:transition-media-popup',
      ],
    },
    resizablePopup: {
      utilities: 'transition-media-menu-resize',
    },
    content: {
      utilities: [
        ...menuHighlight,
        'absolute max-h-[inherit] overflow-auto overscroll-none outline-hidden',
        'not-data-submenu:flex not-data-submenu:flex-col not-data-submenu:gap-0.5',
        'transition-[translate,filter] duration-media-menu ease-out',
        'not-data-submenu:inset-x-1 not-data-submenu:top-1',
        'not-data-submenu:data-child-open:-translate-x-full',
        'not-data-submenu:data-child-open:rtl:translate-x-full',
        'not-data-submenu:data-child-open:blur-media-hidden',
        'not-data-submenu:data-child-open:before:hidden',
        'data-submenu:inset-x-0 data-submenu:top-0 data-submenu:z-10 data-submenu:max-h-[inherit] data-submenu:p-1',
        'data-submenu:media-transitioning:pointer-events-none data-submenu:media-transitioning:overflow-hidden',
        'data-submenu:media-transitioning:translate-x-full data-submenu:media-transitioning:rtl:-translate-x-full',
        'data-submenu:media-transitioning:blur-media-hidden',
      ],
    },
    radioGroup: {
      utilities: menuGroup,
    },
    radioItem: {
      utilities: ['group/menu-radio-item', ...menuItem, ...menuItemOption, ...menuItemHighlight],
    },
    triggerItem: {
      utilities: ['group/menu-trigger-item', ...menuItem, ...menuItemOption, ...menuItemHighlight],
    },
    backItem: {
      utilities: ['group/menu-back-item', ...menuItem, 'mb-0.5 w-full'],
    },
    separator: {
      utilities: 'my-1 block border-b border-media-border media-high-contrast:border-media-foreground/25',
      variants: { default: 'shadow-media-separator' },
    },
    hint: {
      utilities: 'ms-auto inline-flex min-w-0 items-center gap-1 ps-2',
    },
    hintLabel: {
      // Faded on its own so the chevron beside it keeps its color.
      utilities: 'max-w-24 truncate opacity-65',
    },
    tier: {
      utilities: 'ps-0.5 pt-px text-media-xs font-semibold leading-none opacity-70',
    },
    badge: {
      utilities: 'rounded-media-control bg-media-accent px-1.5 text-media-xs font-semibold',
    },
    itemIndicator: {
      utilities: 'ms-auto -me-1 shrink-0 opacity-0 group-aria-checked/menu-radio-item:opacity-100',
    },
    triggerItemIcon: {
      utilities: [...menuIcon, 'size-media-icon', 'group-media-highlighted/menu-trigger-item:text-inherit'],
    },
    radioItemIcon: {
      utilities: [...menuIcon, 'size-media-icon', 'group-media-highlighted/menu-radio-item:text-inherit'],
    },
    forwardChevron: {
      utilities: [...menuChevron, 'rtl:scale-[-1_1]', 'group-media-highlighted/menu-trigger-item:text-inherit'],
    },
    backChevron: {
      utilities: [
        ...menuChevron,
        'rotate-180 rtl:rotate-0 rtl:scale-[1_1]',
        'group-media-highlighted/menu-back-item:text-inherit',
      ],
    },
    settingsTrigger: {
      className: 'media-settings-menu-trigger',
      utilities: 'group/settings',
    },
    settingsTriggerIcon: {
      className: 'media-settings-menu-trigger-icon',
      utilities: [
        'transition-transform duration-media-base ease-in-out motion-reduce:transition-none',
        'group-aria-expanded/settings:rotate-90',
      ],
    },
    triggerLabel: {
      className: 'media-settings-menu-trigger-label',
      utilities: 'sr-only',
    },
  },
});
