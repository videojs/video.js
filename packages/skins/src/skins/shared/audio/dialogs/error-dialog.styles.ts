import { styles } from 'vjsc/styles';

export default styles({
  file: 'audio/error-dialog.css',
  prefix: 'audio-dialog',
  rules: {
    root: {
      className: 'audio-dialog-root',
      utilities: '',
    },
    backdrop: {
      utilities: 'hidden',
    },
    popup: {
      utilities: [
        'absolute inset-0 z-50 flex h-full max-h-none w-full translate-none flex-row items-center rounded-media-pill py-0 pe-1 outline-hidden not-data-open:hidden',
        'bg-media-background text-media-controls-foreground backdrop-filter-media-dialog',
        'transition-[opacity,filter] duration-media-slower ease-out',
        'media-transitioning:blur-media-hidden-popup media-transitioning:opacity-0',
      ],
      variants: {
        default: 'gap-3 px-5',
        neutral: [
          'gap-4 px-3 backdrop-filter-none transition-[opacity,filter,scale]',
          'media-transitioning:scale-media-hidden-popup',
        ],
      },
    },
    content: {
      utilities: 'flex min-h-0 flex-1 flex-row items-center gap-2 overflow-visible',
    },
    title: {
      utilities: 'm-0 text-media font-semibold leading-tight',
    },
    description: {
      utilities: 'm-0 opacity-70 wrap-anywhere',
    },
    actions: {
      utilities: 'flex shrink-0 gap-2',
    },
    close: {
      utilities: 'h-media-control w-auto flex-none bg-media-primary! px-3 font-medium text-media-primary-foreground!',
    },
  },
});
