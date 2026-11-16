import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-settings-button',
  rules: {
    root: {
      utilities: 'media-max-3xs:hidden',
    },
    label: {
      utilities: 'sr-only',
    },
  },
});
