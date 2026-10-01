import { styles } from 'vjsc/styles';

export default styles({
  file: 'indicators.css',
  prefix: 'media-seek-indicator',
  rules: {
    root: {
      utilities: [
        'group/seek-status col-start-2 row-start-1 mx-3 flex-col justify-center gap-1!',
        'bg-transparent! media-high-contrast:bg-transparent! forced-colors:bg-transparent!',
        'data-[direction=backward]:col-start-1 data-[direction=backward]:justify-self-start rtl:data-[direction=backward]:col-start-3 rtl:data-[direction=backward]:justify-self-end',
        'data-[direction=forward]:col-start-3 data-[direction=forward]:justify-self-end rtl:data-[direction=forward]:col-start-1 rtl:data-[direction=forward]:justify-self-start',
      ],
    },
    icon: {
      utilities: 'size-4.5 group-data-[direction=backward]/seek-status:transform-[scaleX(-1)]',
    },
    value: {
      utilities: 'tabular-nums',
    },
  },
});
