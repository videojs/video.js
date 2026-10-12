import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-cast-button',
  rules: {
    root: {
      utilities: 'group/cast',
    },
    enterIcon: {
      utilities: 'group-data-[cast-state=connected]/cast:hidden',
    },
    exitIcon: {
      utilities: 'hidden group-data-[cast-state=connected]/cast:block',
    },
  },
});
