import { styles } from 'vjsc/styles';

export default styles({
  file: 'display.css',
  prefix: 'media-title',
  rules: {
    root: {
      utilities: [
        'pointer-events-none min-w-0 px-2 flex-1 truncate text-[calc(var(--media-spacing)*4)] text-media-foreground bg-media-background',
        'media-high-contrast:bg-media-background forced-colors:bg-transparent! forced-colors:text-[CanvasText] forced-colors:z-40',
        'not-data-visible:opacity-0',
      ],
    },
  },
});
