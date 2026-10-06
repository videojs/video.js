import { styles } from 'vjsc/styles';

export default styles({
  file: 'indicators.css',
  prefix: 'media-volume-indicator',
  rules: {
    root: {
      utilities: 'group/volume-status col-start-2 row-start-1 mt-3.5 self-start',
    },
    fill: {
      utilities: 'flex items-center rtl:flex-row-reverse gap-2',
    },
    icon: {
      utilities: 'hidden size-4.5 shrink-0',
    },
    highIcon: {
      utilities: 'group-data-[level=high]/volume-status:block',
    },
    lowIcon: {
      utilities: 'group-data-[level=low]/volume-status:block',
    },
    offIcon: {
      utilities: 'group-data-[level=off]/volume-status:block',
    },
    value: {
      utilities: 'tabular-nums',
    },
  },
});
