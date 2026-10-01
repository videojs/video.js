import { styles } from 'vjsc/styles';

export default styles({
  file: 'container.css',
  prefix: 'media',
  rules: {
    root: {
      className: 'media-container',
      scopeRoot: true,
      utilities: [
        'relative block w-full overflow-hidden rounded-media-player [--spacing:var(--media-spacing)] font-media text-media text-media-foreground @container/media-root',
        'after:pointer-events-none after:absolute after:inset-0 after:z-50 after:rounded-[inherit] after:border after:border-(--media-frame-border)',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-media-ring',
      ],
    },
    video: {
      scopeRoot: true,
      utilities: 'aspect-video bg-black',
    },
    audio: {
      scopeRoot: true,
      utilities: 'aspect-auto overflow-visible! bg-media-background shadow-media-hairline',
    },
  },
});
