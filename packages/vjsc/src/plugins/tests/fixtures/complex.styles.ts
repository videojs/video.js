import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  layer: 'videojs.components',
  rules: {
    root: { className: 'media-root', utilities: ['[&_img]:block', '[&_video]:block'] },
  },
});
