import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  layer: 'videojs.components',
  rules: {
    button: { className: 'media-button', utilities: ['grid', 'p-0'] },
    icon: { className: 'media-icon', utilities: ['size-4', 'shrink-0'] },
  },
});
