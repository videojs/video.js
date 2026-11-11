import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-fcast-button',
  rules: {
    root: {
      utilities: 'group/fcast relative data-hidden:hidden',
    },
    enterIcon: {
      utilities: 'opacity-0 group-not-data-[fcast-state=connected]/fcast:opacity-100',
    },
    exitIcon: {
      utilities: 'opacity-0 group-data-[fcast-state=connected]/fcast:opacity-100',
    },
    badge: {
      utilities: 'absolute bottom-0 right-0 text-[0.55rem] font-bold leading-none',
    },
  },
});
