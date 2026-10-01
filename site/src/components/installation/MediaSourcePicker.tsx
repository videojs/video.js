import { Input } from '@base-ui/react/input';
import {
  articleFor,
  getInstallationPreset,
  getInstallationRenderer,
  type Renderer,
  resolveRenderer,
} from '@videojs/installation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import Image from '@/assets/icons/image.svg?react';
import LinkSquare from '@/assets/icons/link-square.svg?react';
import CloudflareLogo from '@/assets/logos/brands/cloudflare.svg?react';
import Html5Logo from '@/assets/logos/brands/html5.svg?react';
import SpotifyLogo from '@/assets/logos/brands/spotify.svg?react';
import TiktokLogo from '@/assets/logos/brands/tiktok.svg?react';
import TwitchLogo from '@/assets/logos/brands/twitch.svg?react';
import VimeoLogo from '@/assets/logos/brands/vimeo.svg?react';
import YoutubeLogo from '@/assets/logos/brands/youtube.svg?react';
import MuxLogo from '@/assets/logos/mux-small.svg?react';
import CardRadioGroup from '@/components/CardRadioGroup';
import { media, sourceUrl } from '@/stores/installation';

import MuxUploaderPanel from './MuxUploaderPanel';
import { useSelection } from './useSelection';
import { withSelectionMarker } from './withSelectionMarker';

/** Protocols without a brand mark get a monogram so every card still has a recognizable badge. */
function Monogram({ children }: { children: string }) {
  return <span className="font-display-compact text-p4 font-bold tracking-tight uppercase">{children}</span>;
}

const RENDERER_MEDIA = {
  'html5-video': <Html5Logo className="size-6" />,
  'html5-audio': <Html5Logo className="size-6" />,
  hls: <Monogram>HLS</Monogram>,
  dash: <Monogram>DASH</Monogram>,
  'mux-video': <MuxLogo className="w-7" />,
  'mux-audio': <MuxLogo className="w-7" />,
  vimeo: <VimeoLogo className="size-6" />,
  youtube: <YoutubeLogo className="size-6" />,
  cloudflare: <CloudflareLogo className="size-6" />,
  tiktok: <TiktokLogo className="size-6" />,
  twitch: <TwitchLogo className="size-6" />,
  spotify: <SpotifyLogo className="size-6" />,
  'background-video': <Image className="size-6" />,
  'hls-background-video': <Monogram>HLS</Monogram>,
  'mux-background-video': <MuxLogo className="w-7" />,
} satisfies Record<Renderer, ReactNode>;

const RENDERER_DESCRIPTIONS = {
  'html5-video': 'MP4, WebM, and other file URLs',
  'html5-audio': 'MP3, AAC, and other file URLs',
  hls: 'Adaptive .m3u8 streams via hls.js',
  dash: 'Adaptive .mpd streams via dash.js',
  'mux-video': 'Mux playback IDs with Mux Data selected by default',
  'mux-audio': 'Mux playback IDs with Mux Data selected by default',
  vimeo: 'Vimeo videos and private links',
  youtube: 'YouTube videos and shorts',
  cloudflare: 'Cloudflare Stream videos',
  tiktok: 'TikTok videos',
  twitch: 'Twitch channels, videos, and clips',
  spotify: 'Spotify tracks, albums, and episodes',
  'background-video': 'Muted, looping file URLs',
  'hls-background-video': 'Muted, looping HLS streams',
  'mux-background-video': 'Muted, looping Mux playback IDs',
} satisfies Record<Renderer, string>;

/** How long typing may pause before the draft URL reaches the preview. */
const COMMIT_DELAY_MS = 500;

interface Props {
  supportedRenderers?: Renderer[];
}

function MediaSourcePicker({ supportedRenderers }: Props) {
  const $renderer = useSelection('media');
  const $useCase = useSelection('useCase');
  const $sourceUrl = useSelection('sourceUrl');

  // The input edits a local draft and commits to the store after a pause, or at once on paste, blur, or Enter. The
  // preview reloads its media on every store change, and a half-typed URL fails the media URL safety check, opens
  // the player's error dialog, and pulls focus out of the field mid-word.
  const [draft, setDraft] = useState($sourceUrl);
  const [syncedUrl, setSyncedUrl] = useState($sourceUrl);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // An outside write to the store, such as a finished Mux upload, replaces the draft. Adjusting state during render is
  // the sanctioned way to derive it from a changed input.
  if ($sourceUrl !== syncedUrl) {
    setSyncedUrl($sourceUrl);
    setDraft($sourceUrl);
  }

  useEffect(() => () => clearCommitTimer(), []);

  function clearCommitTimer() {
    if (commitTimer.current === null) return;

    clearTimeout(commitTimer.current);
    commitTimer.current = null;
  }

  function commit(value: string) {
    clearCommitTimer();
    sourceUrl.set(value);
  }

  function scheduleCommit(value: string) {
    clearCommitTimer();
    commitTimer.current = setTimeout(() => commit(value), COMMIT_DELAY_MS);
  }

  const presetRenderers = getInstallationPreset($useCase).renderers;
  const renderers = supportedRenderers
    ? presetRenderers.filter((value) => supportedRenderers.includes(value))
    : presetRenderers;
  const firstRenderer = renderers[0];
  const rendererSupported = renderers.includes($renderer);
  const sourceRenderer = resolveRenderer($sourceUrl, $useCase);
  const sourceLabel = sourceRenderer ? getInstallationRenderer(sourceRenderer).label : null;
  const supportedSourceRenderer = sourceRenderer && renderers.includes(sourceRenderer) ? sourceRenderer : null;

  useEffect(() => {
    if (!rendererSupported && firstRenderer) media.set(firstRenderer);
  }, [firstRenderer, rendererSupported]);

  // Follow the renderer a pasted URL resolves to. Fitting the renderer to the use case lives in the store.
  useEffect(() => {
    if (supportedSourceRenderer) media.set(supportedSourceRenderer);
  }, [supportedSourceRenderer]);

  const hasUrl = $sourceUrl.trim().length > 0;
  const showSourceMatch = hasUrl && sourceRenderer && sourceRenderer === $renderer;
  const showSourceSuggestion = hasUrl && supportedSourceRenderer && sourceRenderer !== $renderer;
  const showNoMatch = hasUrl && !sourceRenderer;

  return (
    <div className="flex flex-col gap-8" data-ph-capture-attribute-location="installation-options">
      <div className="flex flex-col gap-2">
        <label htmlFor="source-url-input" className="text-p3 font-semibold">
          Paste a media URL to detect its source type
        </label>
        <div className="relative">
          <LinkSquare
            className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="source-url-input"
            type="url"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              scheduleCommit(e.target.value);
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text').trim();
              if (!pasted) return;

              e.preventDefault();
              setDraft(pasted);
              commit(pasted);
            }}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(draft);
            }}
            placeholder="https://stream.mux.com/….m3u8"
            className="corner-squircle border-line bg-surface text-p3 placeholder:text-muted intent:border-line-strong focus-visible:border-line-strong focus-visible:outline-gold h-10 w-full rounded-lg border pr-3 pl-9 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-1"
          />
        </div>
        <p className="text-p4 dark:text-muted" aria-live="polite">
          {showSourceMatch ? (
            <>
              This looks like {articleFor(sourceRenderer)} <strong className="font-semibold">{sourceLabel}</strong>{' '}
              link, selected below.
            </>
          ) : showSourceSuggestion ? (
            <>
              This looks like {articleFor(supportedSourceRenderer)} {sourceLabel} link.{' '}
              <button
                type="button"
                onClick={() => media.set(supportedSourceRenderer)}
                className="intent:decoration-gold cursor-pointer underline"
              >
                Select {sourceLabel}
              </button>
            </>
          ) : showNoMatch ? (
            "We couldn't detect the source type. Pick one below."
          ) : (
            'Optional. The URL also ends up in your generated code.'
          )}
        </p>
      </div>

      <CardRadioGroup
        value={$renderer}
        onChange={(value) => media.set(value)}
        options={renderers.map((value) => ({
          value,
          label: getInstallationRenderer(value).label,
          description: RENDERER_DESCRIPTIONS[value],
          media: RENDERER_MEDIA[value],
        }))}
        aria-label="Select media source type"
        layout="row"
        minColumnWidth="14rem"
      />

      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="bg-line h-px flex-1" />
        <span className="text-muted text-p4 tracking-wide uppercase select-none">or</span>
        <span className="bg-line h-px flex-1" />
      </div>

      <MuxUploaderPanel />
    </div>
  );
}

export default withSelectionMarker(MediaSourcePicker);
