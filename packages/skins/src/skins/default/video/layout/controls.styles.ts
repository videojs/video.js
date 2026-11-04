import { styles } from 'vjsc/styles';

export default styles({
  file: 'video/controls.css',
  prefix: 'video-controls',
  rules: {
    volumeButton: {
      utilities: 'ms-px media-max-2xs:hidden',
    },
    settingsButton: {
      utilities: 'media-lg:ms-px',
    },
    timeSliderGroup: {
      className: 'video-time-slider-group',
      utilities: 'flex flex-1 items-center rtl:flex-row-reverse gap-2.5 px-2 media-lg:px-3',
    },
    timeValue: {
      className: 'video-time-value',
      utilities: [],
    },
    // Small players keep only the current time, so the slider is not starved.
    remainingTimeValue: {
      utilities: 'media-max-sm:hidden',
    },
  },
});
