import { styles } from 'vjsc/styles';

export default styles({
  file: 'sliders.css',
  prefix: 'media-slider-thumbnail',
  rules: {
    root: {
      // `<media-slider-thumbnail>` hosts a shadow root, so the image is slotted through it.
      shadowHost: true,
      utilities: 'block max-w-39 overflow-hidden rounded-md bg-[rgba(0,0,0,0.5)] shadow-lg',
    },
    image: {
      shadowHost: true,
      utilities: 'block',
    },
  },
});
