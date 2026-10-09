import { styles } from 'vjsc/styles';

export default styles({
  file: 'display.css',
  prefix: 'media-title',
  rules: {
    root: {
      utilities: [
        'pointer-events-none absolute start-5 end-34 top-4 media-max-2xl:top-3.5 z-20 min-w-0 truncate text-[calc(var(--media-spacing)*4)] font-medium text-white',
        'media-high-contrast:bg-media-background forced-colors:bg-transparent! forced-colors:text-[CanvasText] forced-colors:z-40',
        'transition-[opacity,transform] duration-media-instant ease-out not-data-visible:duration-media-base not-data-visible:opacity-0 motion-safe:not-data-visible:transform-[translateY(calc(var(--media-spacing)*-1))] motion-reduce:transition-none',
      ],
    },
  },
});
