import { styles } from 'vjsc/styles';

export default styles({
  file: 'display.css',
  prefix: 'media-title',
  rules: {
    root: {
      utilities: [
        'pointer-events-none absolute inset-x-0 top-0 z-20 isolate',
        'wrap-anywhere px-6 pt-2.5 text-[calc(var(--media-spacing)*4)] font-medium tracking-[-0.0125em] text-media-controls-foreground text-shadow-media',
        'media-md:px-6 media-md:pt-4',
        'origin-top duration-media-controls-enter ease-out',
        'not-data-visible:opacity-0 not-data-visible:-translate-y-media-hidden-offset not-data-visible:duration-media-controls',
        'pointer-fine:not-data-visible:blur-media-hidden',
      ],
      variants: {
        default: [
          'flex items-center min-h-[calc(var(--media-control-size)+(--spacing(2)))]',
          'media-max-lg:pr-36',
          'transition-[filter,opacity,scale,translate]',
          'not-data-visible:scale-media-hidden',
        ],
        neutral: [
          'font-normal px-4 pt-3.5 media-md:pt-5',
          'transition-[filter,opacity,translate]',
          'not-data-visible:-translate-y-[min(var(--media-hidden-offset),var(--media-control-size))]',
        ],
      },
    },
  },
});
