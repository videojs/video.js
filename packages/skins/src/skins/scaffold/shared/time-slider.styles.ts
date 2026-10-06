import { styles } from 'vjsc/styles';

export default styles({
  file: 'sliders.css',
  prefix: 'media-time-slider',
  rules: {
    root: {
      utilities: [
        'group/slider relative flex h-4 min-w-12 flex-1 cursor-pointer items-center',
        'data-disabled:cursor-not-allowed data-disabled:opacity-40 forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100',
      ],
    },
    chapters: {
      utilities: 'relative flex size-full items-center',
    },
    chapter: {
      utilities: [
        'absolute inset-0 flex items-center clip-media-chapter-x',
        '[--media-chapter-inset-start:0.5] [--media-chapter-inset-end:0.5]',
        'first-of-type:[--media-chapter-inset-start:0] last-of-type:[--media-chapter-inset-end:0]',
      ],
    },
    track: {
      utilities: [
        'absolute inset-x-0 isolate h-1.5 rounded-none forced-colors:h-1.5',
        'before:absolute before:inset-y-0 before:rounded-none before:bg-media-foreground before:opacity-20 before:clip-media-chapter-track-x',
        'media-high-contrast:before:opacity-50! forced-colors:before:bg-[Canvas] forced-colors:before:opacity-100! forced-colors:before:forced-color-adjust-none',
        'forced-colors:before:border forced-colors:before:border-solid forced-colors:before:border-[CanvasText]',
      ],
    },
    audioTrack: {
      utilities: 'before:opacity-20! forced-colors:before:opacity-100!',
    },
    buffer: {
      utilities: [
        'absolute inset-y-0 rounded-none bg-media-foreground opacity-20 clip-media-x-[--media-slider-buffer]',
        'forced-colors:opacity-100! forced-colors:forced-color-adjust-none',
        'forced-colors:bg-[repeating-linear-gradient(135deg,CanvasText_0px,CanvasText_1px,Canvas_1px,Canvas_3px)]',
      ],
    },
    audioBuffer: {
      utilities: 'opacity-20! forced-colors:opacity-100!',
    },
    fill: {
      utilities: [
        'absolute inset-y-0 rounded-none bg-media-accent clip-media-x-[--media-slider-fill] forced-colors:forced-color-adjust-none',
        'group-data-dragging/slider:clip-media-x-[--media-slider-pointer]',
        'forced-colors:bg-[Canvas] forced-colors:bg-[linear-gradient(Highlight,Highlight)]',
      ],
    },
    thumb: {
      utilities: [
        'absolute left-[var(--media-slider-fill,0%)] size-3 border border-solid border-media-foreground transform-[translateX(-50%)] rounded-none bg-media-foreground',
        'group-data-dragging/slider:left-(--media-slider-pointer)',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
        'forced-colors:bg-[Highlight] forced-colors:forced-color-adjust-none',
        'forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText]',
      ],
    },
    preview: {
      utilities: [
        'pointer-events-none bottom-[calc(100%+var(--media-spacing)*3)] grid max-w-39 origin-bottom justify-items-center gap-1',
        'opacity-0 group-data-disabled/slider:hidden',
        'group-data-pointing/slider:opacity-100',
        'group-data-dragging/slider:opacity-100',
      ],
    },
    previewMeta: {
      utilities: 'flex w-full min-w-0 justify-center bg-media-popover px-2 py-1',
    },
    audioPreviewMeta: {
      utilities: [
        'w-auto! rounded-none bg-media-popover px-1.5! py-0.5 text-media-popover-foreground',
        'media-high-contrast:outline forced-colors:outline',
      ],
    },
    previewLabel: {
      utilities: 'flex max-w-full min-w-0 items-center gap-2',
    },
    chapterTitle: {
      utilities: 'min-w-0 truncate opacity-70 empty:hidden',
    },
    value: {
      utilities: 'shrink-0 tabular-nums',
    },
  },
});
