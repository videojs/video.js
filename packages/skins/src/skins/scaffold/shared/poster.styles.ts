import { styles } from 'vjsc/styles';

export default styles({
  file: 'poster.css',
  prefix: 'media-poster',
  rules: {
    root: {
      shadowHost: true,
      utilities: 'absolute inset-0 size-full not-data-visible:hidden',
    },
    image: {
      shadowHost: true,
      utilities: 'size-full object-media',
    },
  },
});
