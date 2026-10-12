import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-button',
  rules: {
    root: {
      utilities: [
        'relative grid size-8 shrink-0 cursor-pointer place-items-center rounded-none bg-media-background p-0 text-inherit',
        "pointer-coarse:before:absolute pointer-coarse:before:-inset-[3px] pointer-coarse:before:content-['']",
        'hover:bg-(--media-button-highlight) focus-visible:bg-(--media-button-highlight) aria-expanded:bg-(--media-button-highlight)',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-media-ring',
        'outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40 disabled:cursor-not-allowed disabled:opacity-40',
        'media-high-contrast:hover:bg-media-foreground media-high-contrast:hover:text-media-background media-high-contrast:focus-visible:bg-media-foreground media-high-contrast:focus-visible:text-media-background',
        'media-high-contrast:aria-expanded:bg-media-foreground media-high-contrast:aria-expanded:text-media-background',
        'forced-colors:border forced-colors:border-solid forced-colors:border-[ButtonText] forced-colors:bg-[ButtonFace] forced-colors:text-[ButtonText]',
        'forced-colors:forced-color-adjust-none',
        'forced-colors:hover:bg-[Highlight] forced-colors:hover:text-[HighlightText] forced-colors:focus-visible:bg-[Highlight] forced-colors:focus-visible:text-[HighlightText]',
        'forced-colors:aria-expanded:bg-[Highlight] forced-colors:aria-expanded:text-[HighlightText] forced-colors:aria-disabled:text-[GrayText] forced-colors:aria-disabled:opacity-100',
        'data-hidden:hidden',
      ],
    },
    icon: {
      utilities: 'col-start-1 row-start-1 size-4.5',
    },
    iconBase: {
      utilities: 'col-start-1 row-start-1 hidden size-4.5',
    },
  },
});
