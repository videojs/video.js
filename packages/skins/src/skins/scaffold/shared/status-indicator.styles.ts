import { styles } from 'vjsc/styles';

export default styles({
  file: 'indicators.css',
  prefix: 'media-status-indicator',
  rules: {
    root: {
      utilities: 'group/input-status col-start-2 row-start-1 self-start mt-3',
    },
    icon: {
      utilities: 'hidden size-4.5 shrink-0',
    },
    captionsOnIcon: {
      utilities: 'group-data-[status=captions-on]/input-status:block',
    },
    captionsOffIcon: {
      utilities: 'group-data-[status=captions-off]/input-status:block',
    },
    fullscreenEnterIcon: {
      utilities: 'group-data-[status=fullscreen]/input-status:block',
    },
    fullscreenExitIcon: {
      utilities: 'group-data-[status=exit-fullscreen]/input-status:block',
    },
    pipEnterIcon: {
      utilities: 'group-data-[status=pip]/input-status:block',
    },
    pipExitIcon: {
      utilities: 'group-data-[status=exit-pip]/input-status:block',
    },
  },
});
