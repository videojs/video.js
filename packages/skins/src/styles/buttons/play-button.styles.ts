import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-play-button',
  rules: {
    root: {
      utilities: 'group/play',
    },
    restartIcon: {
      utilities: 'scale-media-hidden-icon opacity-0 group-data-ended/play:scale-100 group-data-ended/play:opacity-100',
    },
    playIcon: {
      utilities: [
        'scale-media-hidden-icon opacity-0',
        'group-not-data-ended/play:group-data-paused/play:opacity-100',
        'group-not-data-ended/play:group-data-paused/play:scale-100',
        'group-not-data-ended/play:group-not-data-started/play:opacity-100',
        'group-not-data-ended/play:group-not-data-started/play:scale-100',
      ],
      // Optically centres the triangle, as the playback status indicator does.
      variants: { default: 'translate-x-px' },
    },
    pauseIcon: {
      utilities: [
        'scale-media-hidden-icon opacity-0',
        'group-data-started/play:group-not-data-paused/play:group-not-data-ended/play:opacity-100',
        'group-data-started/play:group-not-data-paused/play:group-not-data-ended/play:scale-100',
      ],
    },
  },
});
