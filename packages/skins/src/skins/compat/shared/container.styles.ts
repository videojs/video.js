import { styles } from 'vjsc/styles';

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
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-media-ring',
      ],
      variants: {
        // The HTML skin slots the page's media, which the base `video` rule cannot reach across the shadow boundary.
        // The container is also a grid item of the skin host, so it must not inherit `min-*: auto` from its content.
        'shadow-dom': [
          'min-h-0 min-w-0',
          '[&>slot::slotted(video)]:m-0 [&>slot::slotted(video)]:block [&>slot::slotted(video)]:w-full',
          '[&>slot::slotted(video)]:max-w-full [&>slot::slotted(video)]:rounded-[inherit] [&>slot::slotted(video)]:object-media',
          // Page resets such as Tailwind's `video { height: auto }` outrank normal slotted styles, which leaves the
          // video at its natural height at the top of a container the page has given a different shape.
          '[&>slot::slotted(video)]:h-full!',
        ],
      },
    },
    // Size comes from the media or the page, never a fixed ratio the page cannot override through the shadow root.
    video: {
      scopeRoot: true,
      utilities: 'bg-black',
    },
    audio: {
      scopeRoot: true,
      utilities: 'overflow-visible! bg-media-background shadow-media-hairline',
    },
  },
});
