import { styles } from 'vjsc/styles';

export default styles({
  file: 'indicators.css',
  prefix: 'media-buffering-indicator',
  rules: {
    root: {
      utilities:
        'pointer-events-none absolute inset-0 grid place-items-center not-data-visible:hidden not-data-visible:[--media-spinner-animation:none]',
    },
    spinnerIcon: {
      utilities: 'size-7',
    },
  },
});
