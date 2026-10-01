import { styles } from 'vjsc/styles';

/** Surface chrome for control groups while they float as separate bars below the lg breakpoint. */
const compactSurface = [
  'media-max-lg:bg-media-popover media-max-lg:text-media-popover-foreground',
  'media-max-lg:surface-media media-max-lg:after:surface-media-inset',
] as const;

/** Hide a floating control group with its parent controls below the lg breakpoint. */
const compactHidden = [
  'media-max-lg:group-[:not([data-visible])]/controls:pointer-events-none',
  'media-max-lg:group-[:not([data-visible])]/controls:opacity-0',
  'media-max-lg:group-[:not([data-visible])]/controls:scale-media-hidden',
  'media-max-lg:pointer-fine:group-[:not([data-visible])]/controls:blur-media-hidden',
  'transition-[filter,opacity,scale,translate] duration-media-controls-enter ease-out',
  'media-max-lg:group-[:not([data-visible])]/controls:duration-media-controls',
] as const;

export default styles({
  file: 'video/controls.css',
  prefix: 'video-controls',
  rules: {
    captionsButton: {
      utilities: 'media-max-xs:hidden',
    },
    root: {
      utilities: [],
    },
    content: {
      utilities: [
        'group/controls text-media-controls-foreground text-shadow-media',
        'duration-media-controls-enter ease-out',
      ],
      variants: {
        default: [
          'contents p-1 transition-[filter,opacity,scale,translate]',
          'media-lg:absolute media-lg:inset-x-2 media-lg:bottom-2 media-lg:z-30',
          'media-lg:flex media-lg:items-center media-lg:rtl:flex-row-reverse media-lg:rounded-media-controls',
          'media-lg:bg-media-popover media-lg:text-media-popover-foreground',
          'media-lg:surface-media media-lg:after:surface-media-inset',
          'media-2xl:inset-x-3 media-2xl:bottom-3',
          'media-lg:not-data-visible:pointer-events-none media-lg:not-data-visible:opacity-0',
          'media-lg:not-data-visible:scale-media-hidden media-lg:not-data-visible:translate-y-media-hidden-offset',
          'media-lg:pointer-fine:not-data-visible:blur-media-hidden',
          'media-lg:not-data-visible:duration-media-controls',
        ],
        neutral: [
          'absolute inset-x-0.5 bottom-0.5 z-30 flex items-center rtl:flex-row-reverse gap-x-2 rounded-media-controls bg-transparent p-1 media-high-contrast:bg-media-background',
          'transition-[filter,opacity,translate]',
          'not-data-visible:pointer-events-none not-data-visible:opacity-0',
          'not-data-visible:duration-media-controls',
          'not-data-visible:translate-y-media-hidden-offset pointer-fine:not-data-visible:blur-media-hidden',
          'media-2xl:inset-x-2 media-2xl:bottom-2',
          'media-2xl:[--media-popover-side-offset:--spacing(3)]',
          'media-2xl:[--media-tooltip-side-offset:var(--media-popover-side-offset)]',
        ],
      },
    },
    backdrop: {
      utilities: [
        'pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-(image:--media-controls-gradient)',
        'transition-opacity duration-media-controls ease-out not-data-visible:opacity-0',
      ],
    },
    primary: {
      utilities: [
        'absolute inset-x-2 bottom-2 z-30 flex origin-bottom items-center rtl:flex-row-reverse rounded-media-controls p-0.5',
        ...compactSurface,
        'media-lg:contents',
        ...compactHidden,
        'media-max-lg:group-[:not([data-visible])]/controls:translate-y-media-hidden-offset',
      ],
    },
    secondary: {
      utilities: [
        'absolute top-2 right-2 z-30 flex origin-top items-center rtl:flex-row-reverse gap-px rounded-media-controls p-0.5',
        ...compactSurface,
        'media-lg:static media-lg:p-0',
        ...compactHidden,
        'media-max-lg:group-[:not([data-visible])]/controls:-translate-y-media-hidden-offset',
      ],
    },
    spacer: {
      utilities: 'flex-1',
    },
  },
});
