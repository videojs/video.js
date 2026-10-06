import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-mute-button',
  rules: {
    root: {
      utilities: 'group/mute',
    },
    offIcon: {
      utilities: 'hidden group-data-muted/mute:block',
    },
    highIcon: {
      utilities: 'hidden group-not-data-muted/mute:block',
    },
  },
});
