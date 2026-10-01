import { styles } from 'vjsc/styles';

export default styles({
  file: 'audio/time-slider.css',
  prefix: 'audio-time-slider',
  rules: {
    root: {
      utilities: [],
    },
    thumb: {
      utilities:
        'opacity-0 data-interactive:opacity-100 pointer-fine:group-hover/slider:scale-100 pointer-fine:group-hover/slider:opacity-100',
    },
    previewContent: {
      utilities: 'bottom-[calc(100%+var(--media-slider-preview-label-offset))] tabular-nums',
      variants: {
        default: 'left-1/2',
        neutral: '[left:var(--media-preview-left,var(--media-slider-pointer))]',
      },
    },
    value: {
      utilities: 'tabular-nums',
    },
  },
});
