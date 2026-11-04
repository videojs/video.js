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

// Sits above the title and status indicators, level with the control bars, and steps aside for the spinner.
const center = [
  'group/center pointer-events-none absolute top-1/2 left-1/2 z-30 flex -translate-1/2 items-center rtl:flex-row-reverse gap-6',
  'transition-[filter,opacity,scale] duration-media-controls-enter ease-out',
  'not-data-visible:opacity-0 not-data-visible:scale-media-hidden not-data-visible:duration-media-controls',
  'pointer-fine:not-data-visible:blur-media-hidden',
  'group-data-visible/buffering:hidden',
] as const;

// Before playback starts, only the centre play button shows; `--media-controls-before-start: visible` keeps the controls.
// Where style queries work, the controls also fade in once playback starts.
const hiddenBeforeStart = [
  'not-data-started:[visibility:var(--media-controls-before-start,hidden)]',
  'media-before-start-fade:not-data-started:opacity-0',
] as const;

const centerButtonBase = 'pointer-events-auto group-not-data-visible/center:pointer-events-none';

// The centre play button shrinks rather than hides in small players.
const centerPlay = ['rounded-media-pill!'] as const;

export default styles({
  file: 'video/controls.css',
  prefix: 'video-controls',
  rules: {
    captionsButton: {
      utilities: [],
      variants: {
        default: 'media-max-lg:hidden',
        neutral: 'media-max-xs:hidden',
      },
    },
    root: {
      utilities: [],
    },
    content: {
      utilities: [
        'group/controls text-media-controls-foreground text-shadow-media',
        'duration-media-controls-enter ease-out',
        ...hiddenBeforeStart,
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
        'pointer-events-none absolute inset-0 z-10 rounded-[inherit]',
        'bg-(image:--media-controls-gradient) bg-bottom bg-no-repeat bg-size-[100%_var(--media-controls-bottom-gradient-height)]',
        'transition-opacity duration-media-controls ease-out not-data-visible:opacity-0',
        ...hiddenBeforeStart,
      ],
      variants: {
        // Below lg the secondary group floats at the top, so it needs a scrim of its own.
        default: [
          'media-max-lg:before:absolute media-max-lg:before:inset-x-0 media-max-lg:before:top-0',
          'media-max-lg:before:h-(--media-controls-gradient-height) media-max-lg:before:bg-(image:--media-controls-top-gradient)',
        ],
      },
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
    centerBuffering: {
      utilities: [],
      variants: { default: 'group/buffering contents', neutral: 'group/buffering contents' },
    },
    center: {
      utilities: [],
      variants: { default: center, neutral: center },
    },
    centerButton: {
      utilities: [],
      variants: {
        // Each centre button sets its own surface, so Tailwind never has to order two competing backgrounds.
        default: centerButtonBase,
        neutral: [centerButtonBase, 'text-media-controls-foreground!'],
      },
    },
    centerPlay: {
      utilities: [],
      variants: {
        // After start, fine pointers click the media instead; the button turns invisible rather than leaving, keeping focus.
        default: [
          ...centerPlay,
          'size-auto! p-4! media-max-360:p-3!',
          'bg-media-primary! text-media-primary-foreground! media-high-contrast:bg-media-primary!',
          'hover:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!',
          'focus-visible:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!',
          'pointer-fine:data-started:not-focus-visible:opacity-0!',
          'pointer-fine:data-started:not-focus-visible:pointer-events-none!',
        ],
        // Matches the compat skin's centre play button: a translucent black circle, set apart from the bare-icon playback
        // feedback. The neutral skin keeps its classic control bar once playback starts.
        neutral: [
          'size-14.5! media-max-360:size-10! rounded-[50%]! [corner-shape:round]!',
          'bg-media-backdrop/40! hover:bg-media-backdrop/60! focus-visible:bg-media-backdrop/60!',
          'media-high-contrast:bg-media-background!',
          'data-started:not-focus-visible:opacity-0!',
          'data-started:not-focus-visible:pointer-events-none!',
        ],
      },
    },
    centerPlayIcon: {
      utilities: [],
      variants: {
        default: 'size-media-icon-lg! media-max-360:size-media-icon!',
        neutral: 'size-7! media-max-360:size-5!',
      },
    },
    centerSeek: {
      utilities: [],
      // A touch affordance, hidden for fine pointers, on small players and until playback starts.
      variants: {
        default: [
          'media-max-2xs:hidden! pointer-fine:hidden! group-not-data-started/center:hidden!',
          'rounded-media-pill! bg-media-backdrop/35! text-media-controls-foreground! backdrop-filter-media-indicator',
          'media-high-contrast:bg-media-background!',
        ],
      },
    },
  },
});
