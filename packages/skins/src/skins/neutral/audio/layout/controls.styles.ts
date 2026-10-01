import { styles } from 'vjsc/styles';

export default styles({
  file: 'audio/controls.css',
  prefix: 'audio',
  rules: {
    timeSliderGroup: {
      utilities: [
        '@container/audio-time-controls flex min-w-0 flex-1 flex-row-reverse items-center rtl:flex-row gap-3',
        'media-2xl:flex-row media-2xl:rtl:flex-row-reverse',
      ],
    },
  },
});
