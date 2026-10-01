import { styles } from 'vjsc/styles';

export default styles({
  file: 'live-video/controls.css',
  prefix: 'video-controls',
  rules: {
    start: {
      utilities: 'flex items-center rtl:flex-row-reverse gap-px',
    },
    end: {
      utilities: [
        'flex items-center rtl:flex-row-reverse gap-px mask-media-volume [mask-size:400%_100%]',
        'group-has-[[data-volume-level][aria-expanded=true]]/controls:mask-media-volume-open',
      ],
    },
  },
});
