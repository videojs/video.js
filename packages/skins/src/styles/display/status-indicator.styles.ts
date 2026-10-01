import { styles } from 'vjsc/styles';

const icon = ['hidden shrink-0'] as const;

const iconVariants = {
  default: ['mix-blend-difference'],
  neutral: ['drop-shadow-media-icon'],
} as const;

export default styles({
  file: 'indicators.css',
  prefix: 'media-status-indicator',
  rules: {
    root: {
      utilities: 'group/input-status',
    },
    content: {
      utilities: 'flex',
      variants: { default: 'w-full' },
    },
    captionsOnIcon: {
      utilities: [...icon, 'group-data-[status=captions-on]/input-status:block'],
      variants: iconVariants,
    },
    captionsOffIcon: {
      utilities: [...icon, 'group-data-[status=captions-off]/input-status:block'],
      variants: iconVariants,
    },
    fullscreenEnterIcon: {
      utilities: [...icon, 'group-data-[status=fullscreen]/input-status:block'],
      variants: iconVariants,
    },
    fullscreenExitIcon: {
      utilities: [...icon, 'group-data-[status=exit-fullscreen]/input-status:block'],
      variants: iconVariants,
    },
    pipEnterIcon: {
      utilities: [...icon, 'group-data-[status=pip]/input-status:block'],
      variants: iconVariants,
    },
    pipExitIcon: {
      utilities: [...icon, 'group-data-[status=exit-pip]/input-status:block'],
      variants: iconVariants,
    },
    value: {
      utilities: 'ml-auto',
      variants: { default: 'mix-blend-difference' },
    },
  },
});
