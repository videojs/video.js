import { styles } from 'vjsc/styles';

export default styles({
  file: 'popups.css',
  prefix: 'media-tooltip',
  rules: {
    popup: {
      utilities: [
        'pointer-events-none z-20 whitespace-nowrap rounded-none bg-media-popover px-1.5 py-0.5 text-media-popover-foreground',
        'shadow-none [--media-popup-side-offset:var(--media-tooltip-side-offset)] [--media-tooltip-side-offset:calc(var(--media-spacing)*9)]',
        'data-open:flex data-open:items-center data-open:gap-1',
        'media-high-contrast:outline forced-colors:outline',
      ],
    },
    screenPopup: {
      utilities: '[--media-tooltip-side-offset:calc(var(--media-spacing)*3)]!',
    },
    shortcut: {
      utilities: 'text-media-sm [font-family:inherit]',
    },
  },
});
