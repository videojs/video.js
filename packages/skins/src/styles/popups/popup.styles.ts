import { styles } from 'vjsc/styles';

export default styles({
  file: 'popups.css',
  prefix: 'media-popup',
  rules: {
    popup: {
      className: 'media-popup',
      utilities: [
        'm-0 overflow-visible border-0 text-inherit',
        'media-transitioning:opacity-0 media-transitioning:blur-media-hidden-popup media-transitioning:scale-media-hidden-popup',
        'data-starting-style:transform-[translate(var(--media-popup-translate-x-distance,0),var(--media-popup-translate-y-distance,0))]',
        'data-ending-style:transform-none',
        'data-[side=top]:origin-bottom data-[side=bottom]:origin-top data-[side=left]:origin-right data-[side=right]:origin-left',
        'data-[side=top]:[--media-popup-translate-y-distance:var(--media-popup-translate-distance)]',
        'data-[side=bottom]:[--media-popup-translate-y-distance:calc(var(--media-popup-translate-distance)*-1)]',
        'data-[side=left]:[--media-popup-translate-x-distance:var(--media-popup-translate-distance)]',
        'data-[side=right]:[--media-popup-translate-x-distance:calc(var(--media-popup-translate-distance)*-1)]',
      ],
      variants: {
        neutral: 'data-starting-style:filter-none',
        // Compat combines translate and scale into one transform for browsers without individual transform properties.
        compat: [
          'media-transitioning:scale-none!',
          'data-starting-style:transform-[translate(var(--media-popup-translate-x-distance,0),var(--media-popup-translate-y-distance,0))_scale(var(--media-hidden-popup-scale))]',
          'data-ending-style:transform-[scale(var(--media-hidden-popup-scale))]',
        ],
      },
    },
    safeArea: {
      utilities: [
        'before:pointer-events-auto before:absolute',
        'data-[side=top]:before:inset-x-0 data-[side=top]:before:top-full',
        'data-[side=bottom]:before:inset-x-0 data-[side=bottom]:before:bottom-full',
        'data-[side=left]:before:inset-y-0 data-[side=left]:before:left-full',
        'data-[side=right]:before:inset-y-0 data-[side=right]:before:right-full',
        'data-[side=top]:before:h-(--media-popup-side-offset) data-[side=bottom]:before:h-(--media-popup-side-offset)',
        'data-[side=left]:before:w-(--media-popup-side-offset) data-[side=right]:before:w-(--media-popup-side-offset)',
      ],
    },
    transition: {
      utilities: ['transition-media-popup data-ending-style:duration-media-instant'],
    },
    surface: {
      // Also carried by `<media-slider-thumbnail>`, which hosts a shadow root.
      shadowHost: true,
      utilities: 'bg-media-popover text-media-popover-foreground surface-media after:surface-media-inset',
      variants: {
        neutral: 'after:hidden',
      },
    },
  },
});
