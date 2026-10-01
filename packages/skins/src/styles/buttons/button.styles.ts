import { styles } from 'vjsc/styles';

const icon = 'col-start-1 row-start-1 size-media-icon drop-shadow-media-icon [text-shadow:inherit]';

export default styles({
  file: 'buttons.css',
  prefix: 'media-button',
  rules: {
    root: {
      utilities: [
        'grid size-media-control min-h-0 shrink-0 touch-manipulation select-none place-items-center rounded-media-control border-0 bg-transparent p-0 text-center text-inherit [corner-shape:var(--media-control-corner-shape)]',
        'cursor-pointer focus-ring-media',
        'will-change-[scale] duration-media-base ease-out [transition-property:background-color,color,outline-offset,scale]',
        'media-highlighted:highlight-media',
        'not-aria-disabled:hover:highlight-media',
        'focus-visible:outline-media-ring focus-visible:outline-offset-2',
        'not-aria-disabled:active:scale-[0.97]',
        'motion-reduce:scale-100 motion-reduce:will-change-auto motion-reduce:[transition-property:background-color,color]',
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
      ],
      variants: {
        neutral: 'supports-[corner-shape:squircle]:rounded-2xl',
      },
    },
    iconBase: {
      utilities: icon,
    },
    icon: {
      utilities: [icon, 'transition-[opacity,scale] duration-media-base ease-out'],
    },
  },
});
