import { styles } from 'vjsc/styles';

export default styles({
  file: 'poster.css',
  prefix: 'media-poster',
  rules: {
    // `<media-poster>` hosts a shadow root, and the skin's image is slotted through it.
    root: {
      shadowHost: true,
      utilities: 'absolute inset-0 size-full not-data-visible:hidden',
      variants: {
        // An image slotted in from outside the skin cannot carry the image class, so the root sizes it.
        'shadow-dom': [
          '[&>slot::slotted(img:not([src]):not([srcset]))]:invisible',
          '[&>slot::slotted(img)]:block [&>slot::slotted(img)]:w-full [&>slot::slotted(img)]:object-media',
          // Page resets such as Tailwind's `img { height: auto }` outrank normal slotted styles.
          '[&>slot::slotted(img)]:h-full!',
        ],
      },
    },
    image: {
      shadowHost: true,
      utilities: 'size-full object-media',
    },
  },
});
