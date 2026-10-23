import { styles } from 'vjsc/styles';

export default styles({
  file: 'display.css',
  prefix: 'media-title',
  rules: {
    root: {
      utilities: [
        // The title fills the player so its scrim can share the controls gradient height.
        'pointer-events-none absolute inset-0 z-20 isolate',
        'wrap-anywhere px-6 pt-2.5 text-[calc(var(--media-spacing)*4)] font-medium tracking-[-0.0125em] text-media-controls-foreground text-shadow-media',
        'media-md:px-6 media-md:pt-4',
        'origin-top duration-media-controls-enter ease-out',
        'not-data-visible:opacity-0 not-data-visible:-translate-y-media-hidden-offset not-data-visible:duration-media-controls',
        'pointer-fine:not-data-visible:blur-media-hidden',
      ],
      variants: {
        default: [
          // A row of the control size plus `--spacing(2)`, less the top padding, centres the text below that padding.
          'grid content-start items-center grid-rows-[minmax(calc(var(--media-control-size)-(--spacing(0.5))),auto)]',
          'media-md:grid-rows-[minmax(calc(var(--media-control-size)-(--spacing(2))),auto)]',
          'media-max-lg:pr-36',
          'transition-[filter,opacity,scale,translate]',
          'not-data-visible:scale-media-hidden',
          // The title paints its own top scrim; below lg the controls backdrop paints it for the top controls.
          'media-lg:before:absolute media-lg:before:inset-x-0 media-lg:before:top-0 media-lg:before:h-(--media-controls-gradient-height) media-lg:before:-z-1',
          'media-lg:before:bg-(image:--media-controls-top-gradient)',
        ],
        neutral: [
          'font-normal px-4 pt-3.5 media-md:pt-5',
          'transition-[filter,opacity,translate]',
          'not-data-visible:-translate-y-[min(var(--media-hidden-offset),var(--media-control-size))]',
          'before:absolute before:inset-x-0 before:top-0 before:h-(--media-controls-gradient-height) before:-z-1',
          'before:bg-(image:--media-controls-top-gradient)',
        ],
      },
    },
  },
});
