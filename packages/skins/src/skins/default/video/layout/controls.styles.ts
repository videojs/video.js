import { styles } from 'vjsc/styles';

export default styles({
  file: 'video/controls.css',
  prefix: 'video-controls',
  rules: {
    volumeButton: {
      utilities: 'ms-px media-max-2xs:hidden',
    },
    settingsButton: {
      utilities: 'media-lg:ms-px media-max-3xs:hidden',
    },
    timeSliderGroup: {
      className: 'video-time-slider-group',
      utilities: [
        'flex flex-1 items-center rtl:flex-row-reverse gap-2.5 px-2 media-lg:px-3',
        // With settings hidden the slider, or the time below 4xs, ends the bar and needs room before its edge.
        'media-max-3xs:pr-3.5',
        'media-max-4xs:flex-none',
      ],
    },
    // Without the slider, the bar wraps play and the current time instead of spanning the player. Important because the
    // CSS build emits this rule before the shared `primary` rule's `inset-inline`.
    compactPrimary: {
      utilities: 'media-max-4xs:right-auto!',
    },
    topControls: {
      utilities: 'media-max-4xs:hidden',
    },
    // The slider shrinks with the player instead of holding the shared minimum width; audio keeps that minimum.
    timeSlider: {
      utilities: 'min-w-0! media-max-4xs:hidden',
    },
    // Small players keep only the current time, so the slider is not starved.
    remainingTimeValue: {
      utilities: 'media-max-sm:hidden',
    },
  },
});
