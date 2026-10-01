import { styles } from 'vjsc/styles';

export default styles({
  file: 'dialog.css',
  prefix: 'media-dialog',
  rules: {
    root: {
      className: 'media-dialog-root',
      utilities: '',
    },
    backdrop: {
      utilities: [
        'absolute inset-0 z-40 bg-media-backdrop/20 opacity-100 backdrop-filter-media-dialog rounded-[inherit]',
        'not-data-open:hidden transition-opacity delay-media-dialog duration-media-dialog ease-out',
        'media-transitioning:opacity-0 data-ending-style:delay-0',
      ],
      variants: {
        default: 'data-ending-style:duration-media-slower',
        neutral: 'data-ending-style:duration-media-instant',
      },
    },
    popup: {
      utilities: [
        'absolute top-1/2 left-1/2 z-50 flex w-media-dialog-width max-w-media-dialog max-h-[calc(100%-0.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-media-dialog text-media-popover-foreground outline-hidden not-data-open:hidden',
        'text-shadow-media-dialog transition-[opacity,scale] delay-media-dialog duration-media-dialog ease-out',
        'media-transitioning:scale-media-hidden-popup media-transitioning:opacity-0 data-ending-style:delay-0',
      ],
      variants: {
        default: [
          'bg-media-popover surface-media after:surface-media-inset',
          'p-3',
          'data-ending-style:duration-media-slower',
        ],
        neutral: ['p-4', 'data-ending-style:duration-media-instant'],
      },
    },
    content: {
      utilities: 'flex min-h-0 flex-col gap-2 overflow-y-auto',
      variants: { default: 'px-2 pt-2 pb-1.5', neutral: 'py-1.5' },
    },
    title: {
      utilities: 'm-0 text-media-lg font-semibold leading-tight',
    },
    description: {
      utilities: 'm-0 opacity-70 wrap-anywhere',
    },
    actions: {
      utilities: 'flex shrink-0 gap-2',
    },
    close: {
      utilities: 'h-media-control w-full flex-1 bg-media-primary! px-4 py-2 font-medium text-media-primary-foreground!',
    },
  },
});
