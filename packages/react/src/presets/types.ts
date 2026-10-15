import type { CSSProperties, PropsWithChildren } from 'react';

import type { Poster } from '@/ui/poster';
import type { Slider } from '@/ui/slider';

/** Shared layout props for React skins, combined with any skin-specific props in `T`. */
export type BaseSkinProps<T = unknown> = PropsWithChildren<
  T & {
    /** Inline styles applied to the skin's Container. */
    style?: CSSProperties;

    /** Class name applied to the skin's Container. */
    className?: string;
  }
>;

/** Shared props for video skins, including poster rendering customization. */
export type BaseVideoSkinProps<T = unknown> = BaseSkinProps<T> & {
  /**
   * Draws the poster image, in place of the `<img>` the skin renders. The URL still comes from the player, as `src`
   * alongside the rest of the image props — undefined until one resolves.
   *
   * @example
   *   ```tsx
   *   <VideoSkin
   *     renderPoster={({ src, ...props }: ComponentProps<'img'>) =>
   *       src ? <Image {...props} src={src} alt="" fill /> : null
   *     }
   *   />
   *   ```;
   */
  renderPoster?: Poster.ImageProps['render'];
};

/** Props for on-demand video skins, which add a thumbnail preview to the time slider. */
export type OnDemandVideoSkinProps<T = unknown> = BaseVideoSkinProps<T> & {
  /**
   * Draws the thumbnail preview image in place of the `<img>` the skin renders while scrubbing. The skin still resolves
   * the storyboard frame and passes `src`, sizing styles, and the rest of the image props; use it to set `crossOrigin`,
   * `loading`, or `fetchPriority`, or to render through your own image component.
   *
   * @example
   *   ```tsx
   *   <VideoSkin renderThumbnail={<img alt="" loading="lazy" fetchPriority="low" />} />
   *   ```;
   */
  renderThumbnail?: Slider.Thumbnail.ImageProps['render'];
};
