import { styles } from 'vjsc/styles';

export default styles({
  file: 'container.css',
  prefix: 'media',
  rules: {
    skin: {
      utilities: [],
    },
    root: {
      className: 'media-container',
      scopeRoot: true,
      utilities: [
        'relative isolate block h-full w-full overflow-clip rounded-media-player bg-media-background @container/media-root',
        '[--spacing:var(--media-spacing)] font-media text-media leading-normal subpixel-antialiased',
        'outline-2 -outline-offset-4 outline-transparent transition-[outline-offset,outline-color] duration-media-fast ease-out',
        'focus-visible:outline-media-ring focus-visible:outline-offset-2',
        'after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit]',
        'after:border after:border-(--media-frame-border) [&:fullscreen]:after:hidden',
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
  },
});
