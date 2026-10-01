import { styles } from 'vjsc/styles';

export default styles({
  file: 'time.css',
  prefix: 'media-time',
  rules: {
    group: {
      utilities: 'flex items-center rtl:flex-row-reverse gap-1',
    },
    value: {
      utilities: 'tabular-nums transition-opacity duration-media-slow ease-out data-unavailable:opacity-50',
    },
    toggle: {
      utilities: [
        'cursor-pointer rounded-sm tabular-nums focus-ring-media',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
        'transition-[outline-color,outline-offset] duration-media-fast ease-out',
        'focus-visible:outline-media-ring focus-visible:outline-offset-2',
      ],
      variants: {
        neutral:
          'supports-[corner-shape:squircle]:rounded-2xl supports-[corner-shape:squircle]:[corner-shape:squircle]',
      },
    },
    currentValue: {
      utilities: 'hidden media-2xl:inline',
    },
    separator: {
      utilities: 'hidden media-2xl:inline media-2xl:text-media-controls-foreground/60',
    },
    durationValue: {
      utilities:
        'tabular-nums transition-opacity duration-media-slow ease-out data-unavailable:opacity-50 media-2xl:text-media-controls-foreground/60',
    },
  },
});
