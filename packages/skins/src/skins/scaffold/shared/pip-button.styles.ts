import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-pip-button',
  rules: {
    root: {
      utilities: 'group/pip',
    },
    enterIcon: {
      utilities: 'group-data-pip/pip:hidden',
    },
    exitIcon: {
      utilities: 'hidden group-data-pip/pip:block',
    },
  },
});
