import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-seek-button',
  rules: {
    content: {
      utilities: 'relative grid',
    },
    audio: {
      utilities: 'hidden media-sm:grid',
    },
    backwardIcon: {
      utilities: 'transform-[scaleX(-1)]',
    },
    label: {
      // The seconds sit inside the arc the icon draws, so they are placed against it, not flowed after it.
      utilities:
        'absolute bottom-[calc(var(--media-spacing)*-0.75)] text-[calc(var(--media-spacing)*2.25)] font-medium tracking-tighter tabular-nums',
    },
    backwardLabel: {
      utilities: '-left-px',
    },
    forwardLabel: {
      utilities: '-right-px',
    },
  },
});
