import { styles } from 'vjsc/styles';

export default styles({
  file: 'choice.css',
  layer: 'components',
  rules: {
    first: { className: 'media-z', utilities: ['bg-red-500'] },
    second: { className: 'media-a', utilities: ['bg-blue-500'] },
  },
});
