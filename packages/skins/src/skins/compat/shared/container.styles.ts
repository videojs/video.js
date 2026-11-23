import { styles } from 'vjsc/styles';

import { slottedEmbedFill, slottedVideoFill } from '../../../styles/layout/container.styles';

export default styles({
  file: 'container.css',
  prefix: 'media',
  rules: {
    root: {
      className: 'media-container',
      scopeRoot: true,
      utilities: [
        'relative block h-full w-full overflow-hidden rounded-media-player [--spacing:var(--media-spacing)] font-media text-media text-media-foreground @container/media-root',
        'after:pointer-events-none after:absolute after:inset-0 after:z-50 after:rounded-[inherit] after:border after:border-(--media-frame-border)',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-media-focus-ring',
      ],
      variants: {
        // The container is a grid item of the skin host, so it must not inherit `min-*: auto` from its content.
        'shadow-dom': ['min-h-0 min-w-0', ...slottedVideoFill],
      },
    },
    // Size comes from the media or the page, never a fixed ratio the page cannot override through the shadow root.
    video: {
      scopeRoot: true,
      utilities: 'bg-black',
      variants: {
        'shadow-dom': slottedEmbedFill,
      },
    },
    audio: {
      scopeRoot: true,
      utilities: 'overflow-visible! bg-media-background shadow-media-hairline',
    },
  },
});
