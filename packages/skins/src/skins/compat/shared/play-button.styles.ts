import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-play-button',
  rules: {
    root: {
      utilities: 'group/play',
    },
    restartIcon: {
      utilities: 'group-data-ended/play:block',
    },
    playIcon: {
      utilities: [
        'group-not-data-ended/play:group-data-paused/play:block',
        'group-not-data-ended/play:group-not-data-started/play:block',
      ],
    },
    pauseIcon: {
      utilities: 'group-data-started/play:group-not-data-paused/play:group-not-data-ended/play:block',
    },
  },
});
