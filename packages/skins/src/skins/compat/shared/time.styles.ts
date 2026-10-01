import { styles } from 'vjsc/styles';

export default styles({
  file: 'time.css',
  prefix: 'media-time',
  rules: {
    group: {
      utilities: 'flex shrink-0 items-center rtl:flex-row-reverse gap-1 px-1.5 tabular-nums',
    },
    currentValue: {
      utilities: 'hidden media-xs:inline data-unavailable:opacity-50',
    },
    toggle: {
      utilities: [
        'cursor-pointer rounded-sm media-xs:hidden outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-media-ring',
        'data-disabled:cursor-not-allowed data-disabled:opacity-40 forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100',
      ],
    },
    durationValue: {
      utilities: 'hidden opacity-70 media-xs:inline data-unavailable:opacity-50',
    },
    separator: {
      utilities: 'hidden opacity-70 media-xs:inline data-unavailable:opacity-50',
    },
  },
});
