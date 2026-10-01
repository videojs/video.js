import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-live-button',
  rules: {
    root: {
      utilities: [
        // The shared button shell is a centred grid, so the dot and label flow into columns rather than
        // fighting it with a display override.
        'group/live grid-flow-col w-auto! items-center gap-1.5 px-2.5! text-media-sm font-semibold uppercase tracking-wider',
      ],
    },
    dot: {
      utilities: [
        'inline-block size-2 shrink-0 rounded-media-pill bg-current opacity-40 transition-[background-color,opacity] duration-media-base ease-out motion-reduce:transition-none',
        'group-data-live-edge/live:bg-[#f43f5e] group-data-live-edge/live:opacity-100',
      ],
    },
  },
});
