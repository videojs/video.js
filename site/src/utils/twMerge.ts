import { extendTailwindMerge } from 'tailwind-merge';

export const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-h1',
        'text-h15',
        'text-h2',
        'text-h25',
        'text-h3',
        'text-h4',
        'text-h5',
        'text-p1',
        'text-p2',
        'text-p3',
        'text-p4',
        'text-code',
      ],
      'font-family': ['font-display-compact', 'font-display'],
    },
  },
});
