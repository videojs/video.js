import { styles } from 'vjsc/styles';

const slottedVideo = '[&>slot::slotted(video)]';

/**
 * Shadow DOM utilities for every skin's container. The HTML skin slots the page's media, which the base `video` rule
 * cannot reach across the shadow boundary.
 */
export const slottedVideoFill = [
  `${slottedVideo}:m-0 ${slottedVideo}:block ${slottedVideo}:w-full`,
  `${slottedVideo}:max-w-full ${slottedVideo}:rounded-[inherit] ${slottedVideo}:object-media`,
  // Page resets such as Tailwind's `video { height: auto }` outrank normal slotted styles, which leaves the video at its
  // natural height at the top of a container the page has given a different shape.
  `${slottedVideo}:h-full!`,
] as const;

const slottedEmbed = '[&>slot::slotted([data-cross-origin-frame])]';

/**
 * Shadow DOM utilities for every skin's video preset. Iframe embeds such as `<youtube-video>` mark themselves
 * `data-cross-origin-frame` and keep a native-like default size outside a skin, so the skin stretches them like the
 * `<video>` the container sizes. Audio embeds carry the same marker but set their own height.
 */
export const slottedEmbedFill = [
  `${slottedEmbed}:m-0 ${slottedEmbed}:block ${slottedEmbed}:w-full ${slottedEmbed}:max-w-full`,
  `${slottedEmbed}:rounded-[inherit] ${slottedEmbed}:h-full!`,
  // A minimum set for standalone use, such as TikTok's portrait floor, would overflow the player.
  `${slottedEmbed}:min-w-0 ${slottedEmbed}:min-h-0`,
] as const;

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
        // The container is a grid item of the skin host, so it must not inherit `min-*: auto` from its content.
        'shadow-dom': ['min-h-0 min-w-0', ...slottedVideoFill],
      },
    },
  },
});
