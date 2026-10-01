import { styles } from 'vjsc/styles';

export default styles({
  file: 'indicators.css',
  prefix: 'media-volume-indicator',
  rules: {
    root: {
      utilities: [
        'group/volume-status col-start-2 row-start-1 mt-3.5 h-7 w-[min(70%,11rem)] self-start overflow-hidden',
        'rounded-media-pill! bg-[rgba(255,255,255,0.2)]! p-0! text-white',
        'media-high-contrast:bg-black! media-high-contrast:outline media-high-contrast:outline-white',
        'forced-colors:bg-[Canvas]! forced-colors:text-[CanvasText] forced-colors:forced-color-adjust-none',
      ],
    },
    fill: {
      // The fill paints from the left in white, so the icon inside it reads
      // dark on the filled part and light on the rest.
      utilities: [
        'flex size-full items-center rtl:flex-row-reverse gap-2 rounded-[inherit] px-1.5 py-0 bg-left bg-no-repeat bg-[linear-gradient(white,white)]',
        'bg-size-[var(--media-volume-fill,0%)_100%] transition-[background-size] duration-media-base ease-linear motion-reduce:transition-none',
        'forced-colors:bg-[linear-gradient(CanvasText,CanvasText)]',
      ],
    },
    icon: {
      utilities: [
        'hidden size-4.5 shrink-0 opacity-50 mix-blend-difference media-high-contrast:opacity-100',
        'forced-colors:rounded-media-pill forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:opacity-100 forced-colors:mix-blend-normal',
      ],
    },
    highIcon: {
      utilities: 'group-data-[level=high]/volume-status:block',
    },
    lowIcon: {
      utilities: 'group-data-[level=low]/volume-status:block',
    },
    offIcon: {
      utilities: 'group-data-[level=off]/volume-status:block',
    },
    value: {
      utilities: 'hidden',
    },
  },
});
