import { styles } from 'vjsc/styles';

export default styles({
  file: 'indicators.css',
  prefix: 'media-seek-indicator',
  rules: {
    root: {
      utilities: [
        'group/seek-status col-start-2 row-start-1 grid place-content-center gap-1 p-4 text-center',
        'media-2xl:p-6',
        'data-[direction=backward]:col-start-1 data-[direction=backward]:justify-self-start',
        'data-[direction=forward]:col-start-3 data-[direction=forward]:justify-self-end',
      ],
    },
    icon: {
      utilities: [
        'hidden size-media-icon-lg group-data-direction/seek-status:block',
        'group-data-[direction=backward]/seek-status:scale-[-1_1]',
        'transition-[translate,opacity] duration-media-slow ease-in-out',
        'group-media-transitioning/seek-status:opacity-0',
        'group-data-[direction=forward]/seek-status:group-data-starting-style/seek-status:-translate-x-media-hidden-seek-offset',
        'group-data-[direction=backward]/seek-status:group-data-starting-style/seek-status:translate-x-media-hidden-seek-offset',
      ],
    },
    value: {
      utilities: 'tabular-nums',
    },
  },
});
