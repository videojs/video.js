import { styles } from 'vjsc/styles';

export default styles({
  file: 'video/controls.css',
  prefix: 'video-controls',
  rules: {
    // Mute stays at every size: small players are often muted autoplay embeds, and hardware buttons don't unmute on iOS.
    volumeButton: {
      utilities: 'ms-px',
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
    // Without the slider, the bar shrinks to its content; important to beat the shared `inset-inline`.
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
    // From 4xs to 2xs the slider takes the time's room; important to beat the shared time rules.
    currentTimeValue: {
      utilities: 'media-4xs:media-max-2xs:hidden!',
    },
    // Small players keep only the current time, so the slider is not starved.
    remainingTimeValue: {
      utilities: 'media-max-sm:hidden',
    },
  },
});
