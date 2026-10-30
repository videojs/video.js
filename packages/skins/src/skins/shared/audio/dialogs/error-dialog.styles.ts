import { styles } from 'vjsc/styles';

import { audioControlsInset } from '../../../../styles/layout/audio-controls.styles';

function when(layout: 'media-dialog-bar' | 'media-dialog-card', utilities: string): string {
  return utilities
    .split(' ')
    .map((utility) => `${layout}:${utility}`)
    .join(' ');
}

const bar = (utilities: string) => when('media-dialog-bar', utilities);
// The card repeats the video error dialog in `styles/popups/dialog.styles.ts`, so a change there belongs here too.
const card = (utilities: string) => when('media-dialog-card', utilities);

export default styles({
  file: 'audio/error-dialog.css',
  prefix: 'audio-dialog',
  rules: {
    root: {
      className: 'audio-dialog-root',
      utilities: '',
    },
    frame: {
      utilities: 'pointer-events-none absolute inset-0 z-50 @container-size/media-dialog',
      variants: audioControlsInset,
    },
    region: {
      utilities: [
        'absolute inset-0',
        card(
          'overflow-clip rounded-media-player bottom-[calc(var(--media-control-size)+var(--media-audio-controls-inset)*2)]'
        ),
      ],
    },
    backdrop: {
      utilities: [
        'pointer-events-auto',
        bar('hidden'),
        card('absolute inset-0 z-40 bg-media-backdrop/20 opacity-100 backdrop-filter-media-dialog rounded-[inherit]'),
        card('not-data-open:hidden transition-opacity delay-media-dialog duration-media-dialog ease-out'),
        card('media-transitioning:opacity-0 data-ending-style:delay-0'),
      ],
      variants: {
        default: card('data-ending-style:duration-media-slower'),
        neutral: card('data-ending-style:duration-media-instant'),
      },
    },
    popup: {
      utilities: [
        'pointer-events-auto absolute z-50 flex outline-hidden not-data-open:hidden',
        bar('inset-x-0 bottom-0 max-h-none w-full translate-none flex-row items-center rounded-media-controls'),
        bar('py-(--media-audio-controls-inset) pe-1 bg-media-background text-media-controls-foreground'),
        bar('backdrop-filter-media-dialog transition-[opacity,filter] duration-media-slower ease-out'),
        bar('media-transitioning:blur-media-hidden-popup media-transitioning:opacity-0'),
        // Over media the card keeps the video skin's light-on-dark colors in both color schemes.
        card('scheme-dark top-1/2 left-1/2 w-media-dialog-width max-w-media-dialog max-h-[calc(100%-0.5rem)]'),
        card('-translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-media-dialog text-media-popover-foreground'),
        card('text-shadow-media-dialog transition-[opacity,scale] delay-media-dialog duration-media-dialog ease-out'),
        card('media-transitioning:scale-media-hidden-popup media-transitioning:opacity-0 data-ending-style:delay-0'),
      ],
      variants: {
        default: [
          bar('gap-3 ps-5 surface-media'),
          card('bg-media-popover surface-media after:surface-media-inset p-3 data-ending-style:duration-media-slower'),
        ],
        neutral: [
          bar('gap-4 ps-3 shadow-media-hairline backdrop-filter-none transition-[opacity,filter,scale]'),
          bar('media-transitioning:scale-media-hidden-popup'),
          card('p-4 data-ending-style:duration-media-instant'),
        ],
      },
    },
    content: {
      utilities: [
        bar('max-h-[2lh] min-w-0 flex-1 overflow-y-auto overscroll-contain leading-tight scrollbar-thin'),
        card('flex min-h-0 flex-col gap-2 overflow-y-auto'),
      ],
      variants: {
        default: card('px-2 pt-2 pb-1.5'),
        neutral: card('py-1.5'),
      },
    },
    title: {
      utilities: ['m-0 font-semibold', bar('me-1 inline text-media'), card('text-media-lg leading-tight')],
    },
    description: {
      utilities: ['m-0 opacity-70 wrap-anywhere', bar('inline')],
    },
    actions: {
      utilities: 'flex shrink-0 gap-2',
    },
    close: {
      utilities: [
        'h-media-control bg-media-primary! font-medium text-media-primary-foreground!',
        bar('w-auto flex-none px-3'),
        card('w-full flex-1 px-4 py-2'),
      ],
    },
  },
});
