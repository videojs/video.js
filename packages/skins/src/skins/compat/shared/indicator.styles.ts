import { styles } from 'vjsc/styles';

export default styles({
  file: 'indicators.css',
  prefix: 'media-indicator',
  rules: {
    root: {
      utilities: [
        'pointer-events-none flex items-center gap-2 rounded-md bg-[rgba(0,0,0,0.5)] px-2.5 py-1',
        'media-high-contrast:bg-media-background media-high-contrast:outline media-high-contrast:outline-current',
        'forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:outline forced-colors:outline-[CanvasText]',
        'transition-[opacity,transform] duration-media-base ease-out data-starting-style:opacity-0 data-ending-style:opacity-0',
        'motion-safe:data-starting-style:transform-[scale(0.95)] motion-safe:data-ending-style:transform-[scale(0.95)]',
        'motion-reduce:transition-none',
      ],
    },
    group: {
      utilities:
        'pointer-events-none absolute inset-0 z-20 grid grid-cols-3 items-center justify-items-center forced-colors:z-40',
    },
  },
});
