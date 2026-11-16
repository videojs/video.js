import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-captions-button',
  rules: {
    root: {
      utilities: 'group/captions media-max-3xs:hidden',
    },
    offIcon: {
      utilities: 'group-data-active/captions:hidden',
    },
    onIcon: {
      utilities: 'hidden group-data-active/captions:block',
    },
  },
});
