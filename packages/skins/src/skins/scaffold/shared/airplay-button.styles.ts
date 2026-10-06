import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-airplay-button',
  rules: {
    root: {
      utilities: 'group/airplay',
    },
    enterIcon: {
      utilities: 'group-data-[airplay-state=connected]/airplay:hidden',
    },
    exitIcon: {
      utilities: 'hidden group-data-[airplay-state=connected]/airplay:block',
    },
  },
});
