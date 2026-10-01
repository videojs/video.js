import { styles } from 'vjsc/styles';

export default styles({
  file: 'sliders.css',
  prefix: 'media-volume-slider',
  rules: {
    root: {
      utilities:
        'relative flex size-full cursor-pointer justify-center data-disabled:cursor-not-allowed data-disabled:opacity-40',
    },
    track: {
      utilities: [
        'absolute bottom-0 left-1/2 h-full w-1 transform-[translateX(-50%)] overflow-hidden rounded-media-pill bg-media-muted forced-colors:forced-color-adjust-none',
        'forced-colors:w-1.5 forced-colors:bg-[Canvas] forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText]',
      ],
    },
    fill: {
      utilities:
        'absolute bottom-0 left-0 h-[var(--media-slider-fill,0%)] w-full rounded-media-pill bg-media-primary forced-colors:forced-color-adjust-none',
    },
    thumb: {
      utilities: [
        'absolute bottom-[var(--media-slider-fill,0%)] left-1/2 size-3 transform-[translate(-50%,50%)] rounded-media-pill bg-current',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
        'forced-colors:bg-[Highlight] forced-colors:forced-color-adjust-none',
        'forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText]',
      ],
    },
  },
});
