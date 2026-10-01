import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-seek-button',
  rules: {
    root: {
      utilities: [],
    },
    content: {
      utilities: 'relative grid',
    },
    backwardIcon: {
      utilities: '-scale-x-100',
    },
    label: {
      utilities: 'absolute bottom-[-3px] text-media-xs font-medium tracking-tighter tabular-nums',
    },
    backwardLabel: {
      utilities: '-left-px',
    },
    forwardLabel: {
      utilities: '-right-px',
    },
  },
});
