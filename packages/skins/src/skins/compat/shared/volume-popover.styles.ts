import { styles } from 'vjsc/styles';

export default styles({
  file: 'popups.css',
  prefix: 'media-volume-popover',
  rules: {
    popup: {
      utilities: [
        'z-20 h-24 w-7 rounded-media-pill bg-media-popover px-3.5 py-2.5 text-media-popover-foreground',
        'surface-media [--media-popup-side-offset:var(--media-popover-side-offset)] [--media-popover-side-offset:calc(var(--media-spacing)*6)]',
        'media-high-contrast:outline forced-colors:outline',
      ],
    },
  },
});
