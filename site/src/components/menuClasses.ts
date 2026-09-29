import clsx from 'clsx';

/** The site's dropdown menus, such as the page copy menu: a floating surface that scales in from its trigger. */
export const MENU_POPUP_CLASS = clsx(
  'origin-(--transform-origin) rounded-lg corner-squircle border border-line bg-surface-raised p-1 text-p3 shadow-lg dark:bg-soot',
  'transition duration-150 ease-out starting-style:scale-95 starting-style:opacity-0 ending-style:scale-95 ending-style:opacity-0 ending-style:duration-100',
  'motion-reduce:transition-none'
);

/** One menu entry: an icon and label, highlighted under the pointer or keyboard focus. */
export const MENU_ITEM_CLASS = clsx(
  'flex cursor-pointer items-center gap-2.5 rounded-md corner-squircle px-2 py-1.5 text-p3 no-underline outline-none select-none',
  'data-[highlighted]:bg-surface dark:data-[highlighted]:bg-warm-gray'
);

export const MENU_GROUP_LABEL_CLASS = 'px-2 pt-1 pb-1.5 text-p4 text-muted select-none';

export const MENU_SEPARATOR_CLASS = 'my-1 h-px bg-line';
