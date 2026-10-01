import { styles } from 'vjsc/styles';

export default styles({
  file: 'video/controls.css',
  prefix: 'video-controls',
  rules: {
    content: {
      className: 'video-controls-wrap',
      utilities: 'flex-wrap media-2xl:flex-nowrap',
    },
    start: {
      utilities: 'flex flex-1 items-center rtl:flex-row-reverse gap-px media-2xl:flex-none',
    },
    end: {
      utilities: [
        'flex flex-1 items-center rtl:flex-row-reverse justify-end gap-px media-2xl:flex-none',
        'media-max-2xl:mask-media-volume media-max-2xl:[mask-size:400%_100%]',
        'group-has-[[data-volume-level][aria-expanded=true]]/controls:media-max-2xl:mask-media-volume-open',
      ],
    },
    trailing: {
      utilities: 'flex items-center rtl:flex-row-reverse gap-px',
    },
    timeSliderGroup: {
      className: 'video-time-slider-group',
      utilities: [
        '@container/video-time-controls -order-1 flex flex-none basis-full flex-row-reverse items-center rtl:flex-row gap-3 px-1.5',
        '[--media-slider-height:--spacing(5)]',
        'media-2xl:order-none media-2xl:min-w-0 media-2xl:flex-1 media-2xl:flex-row media-2xl:rtl:flex-row-reverse',
        'media-2xl:[--media-slider-height:--spacing(8)]',
        'media-2xl:mask-media-volume media-2xl:[mask-size:200%_100%]',
        'group-has-[[data-volume-level][aria-expanded=true]]/controls:media-2xl:mask-media-volume-open',
      ],
    },
  },
});
