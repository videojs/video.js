import { styles } from 'vjsc/styles';

const icon = [
  'col-start-1 row-start-1 scale-media-hidden-icon opacity-0',
  'transition-[opacity,scale] duration-media-base ease-out',
] as const;

const iconVariants = {
  default: ['size-media-icon-lg'],
  neutral: ['size-media-icon-xl'],
} as const;

export default styles({
  file: 'indicators.css',
  prefix: 'media-playback-status-indicator',
  rules: {
    root: {
      utilities: [
        'group/playback-status col-start-2 row-start-1 grid place-content-center p-4 text-center',
        'transition-[opacity,scale] duration-media-slow ease-out',
        'media-transitioning:scale-media-hidden-playback media-transitioning:opacity-0',
        'data-ending-style:duration-media-fast data-ending-style:ease-in',
      ],
      variants: { default: 'rounded-media-pill bg-media-backdrop/35 backdrop-filter-media-indicator' },
    },
    playIcon: {
      utilities: [
        ...icon,
        'group-data-[status=play]/playback-status:scale-100 group-data-[status=play]/playback-status:opacity-100',
      ],
      variants: {
        default: [...iconVariants.default, 'group-data-[status=play]/playback-status:translate-x-px'],
        neutral: iconVariants.neutral,
      },
    },
    pauseIcon: {
      utilities: [
        ...icon,
        'group-data-[status=pause]/playback-status:scale-100 group-data-[status=pause]/playback-status:opacity-100',
      ],
      variants: iconVariants,
    },
  },
});
