import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-settings-button',
  rules: {
    root: {
      utilities: 'group/settings',
    },
    icon: {
      utilities:
        'transition-[transform] duration-media-base ease-in-out motion-reduce:transition-none motion-safe:group-aria-expanded/settings:transform-[rotate(90deg)]',
    },
    label: {
      utilities: 'sr-only',
    },
  },
});
