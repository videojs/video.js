import { styles } from 'vjsc/styles';

export default styles({
  file: 'video/controls.css',
  prefix: 'video-controls',
  rules: {
    backdrop: {
      utilities:
        'pointer-events-none absolute inset-0 bg-[rgba(0,0,0,0.4)] not-data-visible:hidden forced-colors:bg-none',
    },
    content: {
      utilities: 'group/controls pointer-events-none absolute inset-0 z-30',
    },
    buffering: {
      utilities: 'group/center-buffering contents',
    },
    center: {
      utilities: [
        'group-not-data-visible/controls:pointer-events-none pointer-events-auto absolute left-1/2 top-1/2 hidden transform-[translate(-50%,-50%)] items-center rtl:flex-row-reverse gap-2 media-360:flex',
        'media-high-contrast:rounded-none media-high-contrast:bg-media-background forced-colors:bg-transparent!',
        'group-not-data-visible/controls:opacity-0 group-data-visible/center-buffering:hidden!',
      ],
    },
    top: {
      utilities: [
        'group-not-data-visible/controls:pointer-events-none pointer-events-auto absolute inset-x-0 top-0 p-3 flex items-center rtl:flex-row-reverse justify-end gap-2',
        'media-high-contrast:rounded-none media-high-contrast:bg-media-background forced-colors:rounded-none forced-colors:bg-[Canvas]',
        'forced-colors:inset-x-0 forced-colors:top-0 forced-colors:justify-end forced-colors:rounded-none!',
        'forced-colors:inset-e-0',
        'group-not-data-visible/controls:opacity-0',
      ],
    },
    centerButton: {
      utilities: [
        'm-0! bg-media-background! media-high-contrast:bg-media-background! forced-colors:bg-[ButtonFace]!',
        'hover:bg-(--media-button-highlight)! focus-visible:bg-(--media-button-highlight)! aria-expanded:bg-(--media-button-highlight)!',
        'media-high-contrast:hover:bg-media-foreground! media-high-contrast:focus-visible:bg-media-foreground! media-high-contrast:aria-expanded:bg-media-foreground!',
        'forced-colors:hover:bg-[Highlight]! forced-colors:focus-visible:bg-[Highlight]! forced-colors:aria-expanded:bg-[Highlight]!',
      ],
    },
    centerPlay: {
      utilities: 'size-14.5!',
    },
    centerPlayIcon: {
      utilities: 'size-7!',
    },
    centerSeek: {
      utilities: 'hidden size-8! pointer-fine:grid',
    },
    centerSeekIcon: {
      utilities: 'size-4.5',
    },
    bottom: {
      utilities: [
        'group-not-data-visible/controls:pointer-events-none pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-media-background p-3',
        'media-high-contrast:rounded-none media-high-contrast:bg-media-background forced-colors:rounded-none forced-colors:bg-[Canvas]',
        'group-not-data-visible/controls:opacity-0',
      ],
    },
    videoBottom: {
      utilities: 'forced-colors:inset-x-0 forced-colors:bottom-0 forced-colors:rounded-none!',
    },
    sliderRow: {
      utilities: 'w-full',
    },
    row: {
      utilities: 'flex items-center rtl:flex-row-reverse justify-between gap-2',
    },
    group: {
      utilities: 'flex items-center rtl:flex-row-reverse gap-2',
    },
    start: {
      utilities: 'min-w-0',
    },
  },
});
