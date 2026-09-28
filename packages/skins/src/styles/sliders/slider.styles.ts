import { styles } from 'vjsc/styles';

// Reveal part of a full round cap for tiny values instead of squeezing it into a vertical pill.
const trackLayer = [
  'pointer-events-none absolute inset-0 before:absolute before:size-full before:rounded-media-control',
  'data-[orientation=horizontal]:before:left-0 data-[orientation=horizontal]:before:min-w-1',
  'data-[orientation=vertical]:before:bottom-0 data-[orientation=vertical]:before:min-h-1',
] as const;

export default styles({
  file: 'sliders.css',
  prefix: 'media-slider',
  rules: {
    root: {
      utilities: [
        'group/slider relative flex flex-1 cursor-pointer items-center justify-center outline-hidden',
        'data-disabled:pointer-events-none',
        'transition-[--media-slider-fill,--media-slider-buffer] duration-media-slider ease-out data-dragging:duration-0',
        'rounded-media-pill',
        'data-[orientation=horizontal]:h-(--media-slider-height,--spacing(8))',
        'data-[orientation=vertical]:w-8 data-[orientation=vertical]:min-w-0',
      ],
      variants: {
        default: 'data-[orientation=horizontal]:min-w-18 data-[orientation=vertical]:h-18',
        minimal: 'data-[orientation=horizontal]:min-w-20 data-[orientation=vertical]:h-20',
      },
    },
    track: {
      utilities: [
        'relative isolate w-full select-none rounded-media-pill before:pointer-events-none before:absolute before:inset-0 before:rounded-media-control before:bg-current/20',
        'data-[orientation=horizontal]:h-1 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1',
      ],
    },
    fill: {
      utilities: [
        ...trackLayer,
        'before:bg-media-primary',
        'data-[orientation=horizontal]:clip-media-x-[--media-slider-fill]',
        'group-data-dragging/slider:data-[orientation=horizontal]:clip-media-x-[--media-slider-pointer]',
        'data-[orientation=vertical]:clip-media-y-[--media-slider-fill]',
        'group-data-dragging/slider:data-[orientation=vertical]:clip-media-y-[--media-slider-pointer]',
      ],
    },
    buffer: {
      utilities: [
        ...trackLayer,
        'before:bg-current/20',
        'data-[orientation=horizontal]:clip-media-x-[--media-slider-buffer]',
        'data-[orientation=vertical]:clip-media-y-[--media-slider-buffer]',
      ],
    },
    thumb: {
      utilities: [
        'absolute z-10 top-1/2 left-[var(--media-slider-fill,0%)] size-3 -translate-x-1/2 -translate-y-1/2 rounded-media-control bg-white',
        'select-none transition-[opacity,height,width,outline-offset,scale] duration-media-slider ease-out',
        'group-data-dragging/slider:scale-90',
        'data-[orientation=vertical]:top-[calc(100%-var(--media-slider-fill,0%))] data-[orientation=vertical]:left-1/2',
        'group-data-dragging/slider:data-[orientation=horizontal]:left-(--media-slider-pointer)',
        'group-data-dragging/slider:data-[orientation=vertical]:top-[calc(100%-var(--media-slider-pointer))]',
        'outline-transparent shadow-media-thumb',
      ],
      variants: {
        default: [
          'outline-4 -outline-offset-4',
          'hover:outline-current/15 hover:outline-offset-0 focus-visible:outline-current/15 focus-visible:outline-offset-0',
          'after:pointer-events-none after:absolute after:-inset-1 after:scale-50 after:rounded-[inherit] after:opacity-0',
          'after:shadow-[0_0_0_2px_currentColor] after:transition-[opacity,scale] after:duration-media-base after:ease-out',
          'focus-visible:after:scale-100 focus-visible:after:opacity-100',
        ],
        minimal: ['focus-ring-media', 'focus-visible:outline-media-ring focus-visible:outline-offset-2'],
      },
    },
    preview: {
      utilities: [
        'group/preview relative h-1 [--media-slider-preview-max-height:var(--media-slider-preview-max-width)]',
        'media-2xl:[--media-slider-preview-max-width:min(--spacing(48),100cqi)]',
        'before:pointer-events-none before:absolute before:z-1 before:-translate-1/2 before:scale-50 before:opacity-0',
        'before:transition-[opacity,scale] before:duration-media-slow before:ease-out',
        'data-pointing:not-data-dragging:before:scale-100 data-pointing:not-data-dragging:before:opacity-100',
      ],
      variants: {
        default: [
          'min-w-(--media-slider-preview-max-width)',
          '[--media-slider-preview-max-width:min(--spacing(32),100cqi)]',
          '@min-[30rem]/media-root:[--media-slider-preview-max-width:min(--spacing(40),100cqi)]',
          'before:top-1/2 before:left-1/2 before:size-1 before:rounded-media-control before:bg-current',
        ],
        minimal: [
          'min-w-full',
          '[--media-slider-preview-max-width:min(--spacing(28),100cqi)]',
          'media-lg:[--media-slider-preview-max-width:min(--spacing(36),100cqi)]',
          '[--media-preview-end-inset:calc(100cqi-100%)]',
          '[--media-preview-left:clamp(calc(var(--media-slider-preview-max-width)/2),var(--media-slider-pointer),calc(100%-var(--media-slider-preview-max-width)/2+var(--media-preview-end-inset)))]',
          'media-2xl:[--media-preview-left:var(--media-slider-pointer)]',
          'before:bg-current/35',
          'data-[orientation=horizontal]:before:top-1/2 data-[orientation=horizontal]:before:left-(--media-slider-pointer)',
          'data-[orientation=horizontal]:before:h-5 data-[orientation=horizontal]:before:w-px',
          'data-[orientation=vertical]:before:top-[calc(100%-var(--media-slider-pointer))] data-[orientation=vertical]:before:left-1/2',
          'data-[orientation=vertical]:before:h-px data-[orientation=vertical]:before:w-5',
        ],
      },
    },
    previewContent: {
      // Also carried by `<media-slider-thumbnail>`, which hosts a shadow root.
      shadowHost: true,
      utilities: [
        'absolute max-w-(--media-slider-preview-max-width) -translate-x-1/2 translate-y-media-hidden-preview-offset scale-media-hidden-preview opacity-0',
        'origin-bottom blur-media-hidden',
        'transition-[filter,opacity,scale] duration-media-base ease-out',
        'group-data-pointing/preview:scale-100 group-data-pointing/preview:opacity-100 group-data-pointing/preview:filter-none',
        'group-has-focus-visible/slider:scale-100 group-has-focus-visible/slider:opacity-100 group-has-focus-visible/slider:filter-none',
      ],
    },
  },
});
