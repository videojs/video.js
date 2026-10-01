import { useStore } from '@nanostores/react';
import { getInstallationPreset, type Renderer, type Skin, type UseCase } from '@videojs/installation';
import { Container } from '@videojs/react';
import { Audio, AudioPlayer, AudioSkin, NeutralAudioSkin } from '@videojs/react/audio';
import { BackgroundVideo, BackgroundVideoPlayer, BackgroundVideoSkin } from '@videojs/react/background';
import { LiveAudioPlayer, LiveAudioSkin, NeutralLiveAudioSkin } from '@videojs/react/live-audio';
import { LiveVideoPlayer, LiveVideoSkin, NeutralLiveVideoSkin } from '@videojs/react/live-video';
import { HlsAudio } from '@videojs/react/media/hls-audio';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { NeutralVideoSkin, Video, VideoPlayer, VideoSkin } from '@videojs/react/video';
import type { ReactNode } from 'react';

import ArrowRight from '@/assets/icons/arrow-right.svg?react';
import {
  VJS10_DEMO_AUDIO,
  VJS10_DEMO_BACKGROUND_VIDEO_MP4,
  VJS10_DEMO_BACKGROUND_VIDEO_POSTER,
  VJS10_DEMO_LIVE,
  VJS10_DEMO_VIDEO,
} from '@/consts';
import { currentFramework } from '@/stores/preferences';
import useIsHydrated from '@/utils/useIsHydrated';

import { useSelection } from './useSelection';

import '@videojs/react/video/skin.css';
import '@videojs/react/video/neutral-skin.css';
import '@videojs/react/audio/skin.css';
import '@videojs/react/audio/neutral-skin.css';
import '@videojs/react/live-video/skin.css';
import '@videojs/react/live-video/neutral-skin.css';
import '@videojs/react/live-audio/skin.css';
import '@videojs/react/live-audio/neutral-skin.css';
import '@videojs/react/background/skin.css';
import { withSelectionMarker } from './withSelectionMarker';

const FILE_RENDERERS: Renderer[] = ['html5-video', 'html5-audio'];
const HLS_RENDERERS: Renderer[] = ['hls', 'mux-video', 'mux-audio'];

const SKIN_PAGES = {
  'default-video': { video: 'video-skin', 'neutral-video': 'video-neutral-skin' },
  'default-audio': { audio: 'audio-skin', 'neutral-audio': 'audio-neutral-skin' },
  'live-video': { video: 'live-video-skin', 'neutral-video': 'live-video-neutral-skin' },
  'live-audio': { audio: 'live-audio-skin', 'neutral-audio': 'live-audio-neutral-skin' },
  'background-video': { video: 'background-video-skin' },
} satisfies Record<UseCase, Partial<Record<Skin, string>>>;

interface Source {
  url: string;
  kind: 'file' | 'hls';
  demo: boolean;
}

/** An absolute http(s) URL that names a resource, so a bare origin or a half-typed address keeps the demo media. */
function isLoadableUrl(value: string): boolean {
  if (!URL.canParse(value)) return false;

  const parsed = new URL(value);

  return (
    (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
    parsed.hostname.includes('.') &&
    parsed.pathname.length > 1
  );
}

/**
 * The preview follows the media source step: a pasted file or HLS URL (including a Mux upload) plays here, while embeds
 * such as YouTube or Vimeo keep the demo media since each needs its own adapter.
 */
function resolveSource($useCase: UseCase, $renderer: Renderer, $sourceUrl: string): Source {
  const preset = getInstallationPreset($useCase);
  const url = isLoadableUrl($sourceUrl.trim()) ? $sourceUrl.trim() : '';
  if (url && FILE_RENDERERS.includes($renderer)) return { url, kind: 'file', demo: false };

  if (url && HLS_RENDERERS.includes($renderer)) return { url, kind: 'hls', demo: false };

  if (preset.live) return { url: VJS10_DEMO_LIVE.hls, kind: 'hls', demo: true };

  if ($useCase === 'background-video') return { url: VJS10_DEMO_BACKGROUND_VIDEO_MP4, kind: 'file', demo: true };

  if (preset.mediaType === 'audio') return { url: VJS10_DEMO_AUDIO, kind: 'file', demo: true };

  return { url: VJS10_DEMO_VIDEO.mp4, kind: 'file', demo: true };
}

function VideoPreview({ skin: $skin, source, live }: { skin: Skin; source: Source; live: boolean }) {
  const poster = source.demo ? VJS10_DEMO_VIDEO.poster : undefined;
  const media =
    source.kind === 'hls' ? (
      <HlsJsVideo key={source.url} src={source.url} playsInline crossOrigin="anonymous" controls={$skin === 'none'} />
    ) : (
      <Video
        key={source.url}
        src={source.url}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        controls={$skin === 'none'}
      />
    );
  const Player = live ? LiveVideoPlayer : VideoPlayer;
  const FullSkin = live ? LiveVideoSkin : VideoSkin;
  const NeutralSkin = live ? NeutralLiveVideoSkin : NeutralVideoSkin;

  return (
    <Player poster={poster}>
      {$skin === 'none' ? (
        <Container className="bg-faded-black aspect-video w-full overflow-hidden rounded-2xl [&_video]:size-full">
          {media}
        </Container>
      ) : $skin.startsWith('neutral') ? (
        <NeutralSkin className="aspect-video w-full">{media}</NeutralSkin>
      ) : (
        <FullSkin className="aspect-video w-full">{media}</FullSkin>
      )}
    </Player>
  );
}

function AudioPreview({ skin: $skin, source, live }: { skin: Skin; source: Source; live: boolean }) {
  const media =
    source.kind === 'hls' ? (
      <HlsAudio key={source.url} src={source.url} crossOrigin="anonymous" controls={$skin === 'none'} />
    ) : (
      <Audio key={source.url} src={source.url} preload="metadata" crossOrigin="anonymous" controls={$skin === 'none'} />
    );
  const Player = live ? LiveAudioPlayer : AudioPlayer;
  const FullSkin = live ? LiveAudioSkin : AudioSkin;
  const NeutralSkin = live ? NeutralLiveAudioSkin : NeutralAudioSkin;

  return (
    <div className="flex aspect-video w-full items-center justify-center">
      <Player>
        {$skin === 'none' ? (
          <Container className="w-full max-w-md [&_audio]:w-full">{media}</Container>
        ) : $skin.startsWith('neutral') ? (
          <NeutralSkin className="w-full max-w-md">{media}</NeutralSkin>
        ) : (
          <FullSkin className="w-full max-w-md">{media}</FullSkin>
        )}
      </Player>
    </div>
  );
}

function BackgroundPreview({ source }: { source: Source }) {
  return (
    <BackgroundVideoPlayer>
      <BackgroundVideoSkin className="aspect-video w-full overflow-hidden rounded-2xl">
        <BackgroundVideo
          key={source.url}
          src={source.url}
          poster={source.demo ? VJS10_DEMO_BACKGROUND_VIDEO_POSTER : undefined}
          preload="metadata"
        />
      </BackgroundVideoSkin>
    </BackgroundVideoPlayer>
  );
}

/**
 * Live preview of the player the guide is about to generate: the chosen preset and skin, playing the chosen source. It
 * answers "what does this skin look like?" without leaving the page.
 */
function InstallationPreview() {
  const $useCase = useSelection('useCase');
  const $skin = useSelection('skin');
  const $renderer = useSelection('media');
  const $sourceUrl = useSelection('sourceUrl');
  const framework = useStore(currentFramework);
  const isHydrated = useIsHydrated();

  const preset = getInstallationPreset($useCase);
  const source = resolveSource($useCase, $renderer, $sourceUrl);
  const isBackground = $useCase === 'background-video';
  const effectiveSkin: Skin = isBackground ? 'video' : $skin;

  let player: ReactNode;

  if (isBackground) player = <BackgroundPreview source={source} />;
  else if (preset.mediaType === 'audio')
    player = <AudioPreview skin={effectiveSkin} source={source} live={preset.live} />;
  else player = <VideoPreview skin={effectiveSkin} source={source} live={preset.live} />;

  // SAFETY: SKIN_PAGES lists every preset; a skin missing from a preset (such as "none") simply has no reference page.
  const skinPage = (SKIN_PAGES[$useCase] as Partial<Record<Skin, string>>)[effectiveSkin];
  const skinLabel =
    effectiveSkin === 'none'
      ? 'no skin'
      : effectiveSkin.startsWith('neutral')
        ? 'the neutral skin'
        : 'the default skin';
  const referenceHref =
    isHydrated && framework && skinPage ? `/docs/framework/${framework}/reference/components/${skinPage}` : null;

  return (
    <figure className="flex flex-col gap-3">
      {/* The player sits inside a padded surface so it reads as a preview of a component, not as page content. */}
      <div className="corner-squircle border-line bg-surface overflow-hidden rounded-lg border p-5 sm:p-8">
        {player}
      </div>
      <figcaption className="text-muted text-p3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span>
          {preset.label} preset with {skinLabel}
          {source.demo ? ', playing our demo media.' : ', playing your source.'}
          {effectiveSkin === 'none' && ' Native controls stand in for the UI you will build.'}
        </span>
        {referenceHref && (
          <a
            href={referenceHref}
            className="text-faded-black intent:text-accent dark:text-manila-light inline-flex items-center gap-1 font-semibold"
          >
            Skin reference
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        )}
      </figcaption>
    </figure>
  );
}

export default withSelectionMarker(InstallationPreview);
