import type { Renderer } from '@videojs/installation';
import type { ComponentType, SVGProps } from 'react';

import Image from '@/assets/icons/image.svg?react';
import CloudflareLogo from '@/assets/logos/brands/cloudflare.svg?react';
import Html5Logo from '@/assets/logos/brands/html5.svg?react';
import SpotifyLogo from '@/assets/logos/brands/spotify.svg?react';
import TiktokLogo from '@/assets/logos/brands/tiktok.svg?react';
import TwitchLogo from '@/assets/logos/brands/twitch.svg?react';
import VimeoLogo from '@/assets/logos/brands/vimeo.svg?react';
import YoutubeLogo from '@/assets/logos/brands/youtube.svg?react';
import MuxLogo from '@/assets/logos/mux-small.svg?react';

/**
 * How a media source is badged: a square logo or icon, a wide wordmark sized by its width, or, for protocols without a
 * brand mark, a monogram. Each surface renders the marks at its own size so they stay the same everywhere.
 */
export type MediaSourceMark = { logo: ComponentType<SVGProps<SVGSVGElement>>; wordmark?: true } | { monogram: string };

export const MEDIA_SOURCE_MARKS = {
  'html5-video': { logo: Html5Logo },
  'html5-audio': { logo: Html5Logo },
  hls: { monogram: 'HLS' },
  dash: { monogram: 'DASH' },
  'mux-video': { logo: MuxLogo, wordmark: true },
  'mux-audio': { logo: MuxLogo, wordmark: true },
  vimeo: { logo: VimeoLogo },
  youtube: { logo: YoutubeLogo },
  cloudflare: { logo: CloudflareLogo },
  tiktok: { logo: TiktokLogo },
  twitch: { logo: TwitchLogo },
  spotify: { logo: SpotifyLogo },
  'background-video': { logo: Image },
  'hls-background-video': { monogram: 'HLS' },
  'mux-background-video': { logo: MuxLogo, wordmark: true },
} satisfies Record<Renderer, MediaSourceMark>;
