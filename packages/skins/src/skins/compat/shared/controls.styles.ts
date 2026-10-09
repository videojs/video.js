import { styles } from 'vjsc/styles';

const transition =
  'transition-[opacity,transform] duration-media-instant ease-out group-not-data-visible/controls:duration-media-base group-not-data-visible/controls:opacity-0 motion-reduce:transition-none';

export default styles({
  file: 'video/controls.css',
  prefix: 'video-controls',
  rules: {
    buffering: {
      utilities: 'group/buffering contents',
    },
    backdrop: {
      utilities:
        'pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.7),rgba(0,0,0,0.2),rgba(0,0,0,0.5))] group-not-data-visible/buffering:not-data-visible:hidden forced-colors:bg-none',
    },
    content: {
      utilities: 'group/controls pointer-events-none absolute inset-0 z-30',
    },
    center: {
      utilities: [
        'group-not-data-visible/controls:pointer-events-none pointer-events-auto absolute left-1/2 top-1/2 hidden transform-[translate(-50%,-50%)] items-center rtl:flex-row-reverse gap-3 media-360:flex group-data-visible/buffering:hidden!',
        'media-high-contrast:rounded-lg media-high-contrast:bg-media-background forced-colors:bg-transparent!',
        transition,
        'motion-safe:group-not-data-visible/controls:transform-[translate(-50%,-50%)_scale(0.9)]',
      ],
    },
    top: {
      utilities: [
        'group-not-data-visible/controls:pointer-events-none pointer-events-auto absolute end-3 top-2.5 media-max-2xl:end-2 media-max-2xl:top-2 flex items-center gap-1',
        'media-high-contrast:rounded-lg media-high-contrast:bg-media-background forced-colors:rounded-lg forced-colors:bg-[Canvas]',
        'forced-colors:inset-x-0 forced-colors:top-0 forced-colors:justify-end forced-colors:rounded-none! forced-colors:px-3 forced-colors:py-2.5',
        'media-max-2xl:forced-colors:px-2 media-max-2xl:forced-colors:py-2 media-max-2xl:forced-colors:top-0 media-max-2xl:forced-colors:end-0',
        'forced-colors:end-0',
        transition,
        'motion-safe:group-not-data-visible/controls:transform-[translateY(var(--media-spacing))]',
      ],
    },
    centerButton: {
      utilities: [
        'bg-[rgba(0,0,0,0.4)]! media-high-contrast:bg-media-background! forced-colors:bg-[ButtonFace]!',
        'hover:bg-[rgba(0,0,0,0.85)]! focus-visible:bg-[rgba(0,0,0,0.85)]! aria-expanded:bg-[rgba(0,0,0,0.85)]!',
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
      utilities: 'hidden size-9! pointer-fine:grid',
    },
    centerSeekIcon: {
      utilities: 'size-4.5',
    },
    bottom: {
      utilities: [
        'group-not-data-visible/controls:pointer-events-none pointer-events-auto absolute inset-x-2 bottom-2 flex flex-col gap-0',
        'media-high-contrast:rounded-lg media-high-contrast:bg-media-background forced-colors:rounded-lg forced-colors:bg-[Canvas]',
        transition,
        'motion-safe:group-not-data-visible/controls:transform-[translateY(var(--media-spacing))]',
      ],
    },
    videoBottom: {
      utilities:
        'forced-colors:inset-x-0 forced-colors:bottom-0 forced-colors:rounded-none! forced-colors:px-2 forced-colors:py-2',
    },
    sliderRow: {
      utilities: 'w-full',
    },
    row: {
      utilities: 'flex items-center rtl:flex-row-reverse justify-between gap-2',
    },
    group: {
      utilities: 'flex items-center rtl:flex-row-reverse gap-1',
    },
    start: {
      utilities: 'min-w-0',
    },
  },
});
