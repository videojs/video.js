import { styles } from 'vjsc/styles';

import { audioControlsInset } from '../../../../styles/layout/audio-controls.styles';

/**
 * Lays the video error dialog out over the control bar when only the bar fits. The rules are important because the
 * dialog's own rules live in another stylesheet, whose order against this one is not fixed.
 */
function bar(utilities: string): string {
  return utilities
    .split(' ')
    .map((utility) => `media-dialog-bar:${utility}!`)
    .join(' ');
}

export default styles({
  file: 'audio/error-dialog.css',
  prefix: 'audio-dialog',
  rules: {
    frame: {
      utilities: 'pointer-events-none absolute inset-0 z-50 @container-size/media-dialog',
      variants: audioControlsInset,
    },
    region: {
      utilities: [
        'absolute inset-0',
        'media-dialog-card:overflow-clip media-dialog-card:rounded-media-player',
        'media-dialog-card:bottom-[calc(var(--media-control-size)+var(--media-audio-controls-inset)*2)]',
      ],
    },
    backdrop: {
      utilities: ['pointer-events-auto', bar('hidden')],
    },
    popup: {
      utilities: [
        'pointer-events-auto',
        // Over media the card keeps the video skin's light-on-dark colors in both color schemes.
        'media-dialog-card:scheme-dark',
        bar('inset-x-0 top-auto bottom-0 w-full max-w-none max-h-none translate-none'),
        bar('flex-row items-center rounded-media-controls p-0 py-(--media-audio-controls-inset) pe-1'),
        bar('bg-media-background text-media-controls-foreground text-shadow-none'),
        bar('backdrop-filter-media-dialog after:hidden'),
        bar('transition-[opacity,filter] delay-0 duration-media-slower'),
        bar('data-ending-style:duration-media-slower media-transitioning:blur-media-hidden-popup'),
      ],
      variants: {
        default: bar('ps-5 media-transitioning:scale-none'),
        neutral: [
          bar('gap-4 ps-3 shadow-media-hairline'),
          bar('backdrop-filter-none transition-[opacity,filter,scale]'),
        ],
      },
    },
    content: {
      utilities: [bar('block p-0 max-h-[2lh] min-w-0 flex-1'), bar('overscroll-contain leading-tight scrollbar-thin')],
    },
    title: {
      utilities: bar('me-1 inline text-media'),
    },
    description: {
      utilities: bar('inline'),
    },
    close: {
      utilities: bar('w-auto flex-none px-3 py-0'),
    },
  },
});
