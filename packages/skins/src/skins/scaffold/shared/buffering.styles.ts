import { styles } from 'vjsc/styles';

export default styles({
  file: 'indicators.css',
  prefix: 'media-buffering-indicator',
  rules: {
    root: {
      utilities:
        'pointer-events-none absolute inset-0 grid place-items-center not-data-visible:hidden not-data-visible:[--media-spinner-animation:none] motion-reduce:[--media-spinner-animation:none]',
    },
    spinnerIcon: {
      utilities: 'size-7',
    },
    controls: {
      utilities: 'group/buffering-controls contents',
    },
    backdrop: {
      utilities: 'z-40 group-not-data-visible/buffering-controls:bg-[rgba(0,0,0,0.4)] forced-colors:bg-transparent!',
    },
  },
});
