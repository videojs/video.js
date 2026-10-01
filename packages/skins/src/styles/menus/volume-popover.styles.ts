import { styles } from 'vjsc/styles';

export default styles({
  file: 'popups.css',
  rules: {
    popup: {
      className: 'media-volume-popover',
      utilities: [
        'rounded-media-control px-0 py-3 [--media-popup-side-offset:var(--media-popover-side-offset)]',
        'data-[side=right]:rounded-none data-[side=right]:p-0 data-[side=right]:px-3 data-[side=right]:surface-media-none! data-[side=right]:after:hidden',
        'data-[side=right]:[--media-popover-side-offset:0rem]',
      ],
      variants: {
        neutral: [
          'data-[side=left]:rounded-none data-[side=left]:border-0 data-[side=left]:py-0 data-[side=left]:ps-16 data-[side=left]:pe-2',
          'data-[side=left]:surface-media-none! data-[side=left]:bg-linear-to-l data-[side=left]:from-media-controls data-[side=left]:from-80% data-[side=left]:to-transparent',
          'data-[side=left]:after:hidden',
          'data-[side=left]:[--media-popover-side-offset:0rem]',
        ],
      },
    },
  },
});
