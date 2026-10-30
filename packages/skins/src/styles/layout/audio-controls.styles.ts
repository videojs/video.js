import { styles } from 'vjsc/styles';

/** The bar padding per theme. The audio error dialog reads it to know the bar height. */
export const audioControlsInset = {
  default: '[--media-audio-controls-inset:--spacing(0.5)] media-lg:[--media-audio-controls-inset:--spacing(1)]',
  neutral: '[--media-audio-controls-inset:--spacing(1)]',
} as const;

export default styles({
  file: 'audio/controls.css',
  prefix: 'audio-controls',
  rules: {
    root: {
      utilities: [],
    },
    content: {
      utilities:
        'relative z-20 flex items-center rtl:flex-row-reverse rounded-media-controls bg-media-controls text-media-controls-foreground text-shadow-media',
      variants: {
        default: [
          audioControlsInset.default,
          'p-(--media-audio-controls-inset) surface-media after:surface-media-inset',
        ],
        neutral: [audioControlsInset.neutral, 'gap-2 p-(--media-audio-controls-inset) shadow-media-hairline'],
      },
    },
    start: {
      utilities: 'flex items-center rtl:flex-row-reverse gap-px',
    },
    end: {
      utilities: 'flex items-center rtl:flex-row-reverse gap-px',
    },
    spacer: {
      utilities: 'flex-1',
    },
  },
});
