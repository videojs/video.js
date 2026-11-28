import { styles } from 'vjsc/styles';

function when(layout: 'media-dialog-bar' | 'media-dialog-card', utilities: string): string {
  return utilities
    .split(' ')
    .map((utility) => `${layout}:${utility}`)
    .join(' ');
}

const bar = (utilities: string) => when('media-dialog-bar', utilities);
// The card repeats the error dialog in `dialog.styles.ts`, so a change there belongs here too.
const card = (utilities: string) => when('media-dialog-card', utilities);

export default styles({
  file: 'audio/error-dialog.css',
  prefix: 'audio-dialog',
  rules: {
    frame: {
      utilities: 'pointer-events-none absolute inset-0 z-50 rounded-[inherit] @container-size/media-dialog',
    },
    backdrop: {
      utilities: [
        'pointer-events-auto',
        bar('hidden'),
        card('absolute inset-0 z-40 bg-[rgba(0,0,0,0.75)] not-data-open:hidden'),
      ],
    },
    popup: {
      utilities: [
        'pointer-events-auto absolute z-50 bg-media-popover text-media-popover-foreground not-data-open:hidden',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-media-ring',
        'media-high-contrast:border media-high-contrast:border-solid media-high-contrast:border-current forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText]',
        bar('inset-0 flex flex-row items-center gap-3 rounded-[inherit] px-4 py-2'),
        card(
          'left-1/2 top-1/2 grid w-[calc(100%-2rem)] max-w-80 max-h-[calc(100%-2rem)] transform-[translate(-50%,-50%)]'
        ),
        card('gap-3 overflow-auto rounded-lg p-5'),
      ],
    },
    content: {
      utilities: [bar('max-h-full min-w-0 flex-1 overflow-y-auto overscroll-contain leading-snug'), card('contents')],
    },
    title: {
      utilities: [bar('me-1 inline font-bold'), card('text-lg font-bold')],
    },
    description: {
      utilities: ['text-[calc(var(--media-spacing)*3.5)] wrap-anywhere', bar('inline')],
    },
    close: {
      utilities: ['h-8 w-auto border! border-solid border-current px-3', bar('shrink-0'), card('justify-self-end')],
    },
  },
});
