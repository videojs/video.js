import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-fullscreen-button',
  rules: {
    root: {
      utilities: 'group/fullscreen',
    },
    enterIcon: {
      utilities: 'hidden group-not-data-fullscreen/fullscreen:block',
    },
    exitIcon: {
      utilities: 'hidden group-data-fullscreen/fullscreen:block',
    },
  },
});
