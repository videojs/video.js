import { styles } from 'vjsc/styles';

export default styles({
  file: 'container.css',
  prefix: 'media',
  rules: {
    root: {
      className: 'media-container',
      scopeRoot: true,
      utilities: [
        'relative block w-full overflow-hidden rounded-media-player [--spacing:var(--media-spacing)] [font-family:var(--media-font-family,inherit)] text-media text-media-foreground @container/media-root',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-media-ring',
      ],
    },
    video: {
      scopeRoot: true,
      utilities: 'aspect-video bg-black',
    },
    audio: {
      scopeRoot: true,
      utilities: 'aspect-auto overflow-visible! bg-media-background shadow-none',
    },
  },
});
