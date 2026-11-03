import { styles } from 'vjsc/styles';

import { audioControlsInset } from '../../../../styles/layout/audio-controls.styles';
import { dialogCard } from '../../../../styles/popups/dialog.styles';

function when(layout: 'media-dialog-bar' | 'media-dialog-card', utilities: string): string {
  return utilities
    .split(' ')
    .map((utility) => `${layout}:${utility}`)
    .join(' ');
}

const bar = (utilities: string) => when('media-dialog-bar', utilities);
const card = (utilities: string) => when('media-dialog-card', utilities);
const cardGroups = (groups: readonly string[]) => groups.map(card);

// Assumes the bar is one control tall plus its padding. A taller bar needs this height changed too.
const barHeight = 'calc(var(--media-control-size)+var(--media-audio-controls-inset)*2)';

export default styles({
  file: 'audio/error-dialog.css',
  prefix: 'audio-dialog',
  rules: {
    root: {
      className: 'audio-dialog-root',
      utilities: '',
    },
    frame: {
      utilities: `pointer-events-none absolute inset-x-0 top-0 bottom-[${barHeight}] z-50 @container-size/media-dialog`,
      variants: audioControlsInset,
    },
    region: {
      utilities: [
        'absolute inset-x-0',
        bar(`top-full h-[${barHeight}]`),
        card('inset-y-0 overflow-clip rounded-media-player'),
      ],
    },
    backdrop: {
      utilities: ['pointer-events-auto', bar('hidden'), ...cardGroups(dialogCard.backdrop.utilities)],
      variants: {
        default: card(dialogCard.backdrop.variants.default),
        neutral: card(dialogCard.backdrop.variants.neutral),
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
        card('scheme-dark'),
        ...cardGroups(dialogCard.popup.utilities),
      ],
      variants: {
        default: [bar('gap-3 ps-5 surface-media'), ...cardGroups(dialogCard.popup.variants.default)],
        neutral: [
          bar('gap-4 ps-3 shadow-media-hairline backdrop-filter-none transition-[opacity,filter,scale]'),
          bar('media-transitioning:scale-media-hidden-popup'),
          card(dialogCard.popup.variants.neutral),
        ],
      },
    },
    content: {
      utilities: [
        bar('max-h-[2lh] min-w-0 flex-1 overflow-y-auto overscroll-contain leading-tight scrollbar-thin'),
        card(dialogCard.content.utilities),
      ],
      variants: {
        default: card(dialogCard.content.variants.default),
        neutral: card(dialogCard.content.variants.neutral),
      },
    },
    title: {
      utilities: ['m-0 font-semibold', bar('me-1 inline text-media'), card(dialogCard.title.utilities)],
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
        card(dialogCard.close.utilities),
      ],
    },
  },
});
