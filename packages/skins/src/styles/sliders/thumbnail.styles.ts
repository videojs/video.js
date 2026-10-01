import { styles } from 'vjsc/styles';

export default styles({
  file: 'sliders.css',
  prefix: 'media-slider-thumbnail',
  rules: {
    // `<media-slider-thumbnail>` hosts a shadow root, and the image and spinner are slotted through it.
    root: {
      shadowHost: true,
      utilities: [
        'group/thumbnail pointer-events-none overflow-hidden rounded-media-popup bg-media-backdrop/90',
        'bottom-[calc(100%+var(--media-slider-preview-offset))]',
        'max-h-(--media-slider-preview-max-height)',
        'data-loading:aspect-video data-loading:w-(--media-slider-preview-max-width)',
      ],
      variants: {
        default: [
          'left-1/2',
          'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-(image:--media-thumbnail-gradient)',
        ],
        neutral: 'left-(--media-preview-left,var(--media-slider-pointer))',
        // An image slotted in from outside the skin cannot carry the image class, so the root styles it.
        'shadow-dom': [
          '[&>slot::slotted(img)]:block [&>slot::slotted(img)]:transition-opacity',
          '[&>slot::slotted(img)]:duration-media-base [&>slot::slotted(img)]:ease-out',
          '[&[data-loading]>slot::slotted(img)]:opacity-0',
        ],
      },
    },
    image: {
      shadowHost: true,
      utilities: ['block transition-opacity duration-media-base ease-out', 'group-data-loading/thumbnail:opacity-0'],
    },
    spinnerIcon: {
      shadowHost: true,
      utilities: [
        'absolute top-1/2 left-1/2 z-10 size-media-icon -translate-x-1/2 -translate-y-1/2 opacity-0',
        'transition-opacity duration-media-base ease-out',
        'group-not-data-loading/thumbnail:[--media-spinner-animation:none]',
        'group-data-loading/thumbnail:opacity-100',
        'drop-shadow-media-icon',
      ],
    },
  },
});
