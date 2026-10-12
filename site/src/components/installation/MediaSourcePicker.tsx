import { getInstallationRenderer, type Renderer, resolveRenderer } from '@videojs/installation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import CardRadioGroup from '@/components/CardRadioGroup';
import { media } from '@/stores/installation';

import { MEDIA_SOURCE_MARKS, type MediaSourceMark } from './mediaSourceMarks';
import MediaSourceUrlField, { availableRenderers } from './MediaSourceUrlField';
import MuxUploaderPanel from './MuxUploaderPanel';
import { useSelection } from './useSelection';
import { withSelectionMarker } from './withSelectionMarker';

function cardMark(mark: MediaSourceMark): ReactNode {
  if ('monogram' in mark) {
    return <span className="font-display-compact text-p4 font-bold tracking-tight uppercase">{mark.monogram}</span>;
  }

  const Logo = mark.logo;

  return <Logo className={mark.wordmark ? 'w-7' : 'size-6'} />;
}

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

interface Props {
  supportedRenderers?: Renderer[];
}

function MediaSourcePicker({ supportedRenderers }: Props) {
  const $renderer = useSelection('media');
  const $useCase = useSelection('useCase');
  const $sourceUrl = useSelection('sourceUrl');

  const renderers = availableRenderers($useCase, supportedRenderers);
  const firstRenderer = renderers[0];
  const rendererSupported = renderers.includes($renderer);
  const sourceRenderer = resolveRenderer($sourceUrl, $useCase);
  const supportedSourceRenderer = sourceRenderer && renderers.includes(sourceRenderer) ? sourceRenderer : null;

  useEffect(() => {
    if (!rendererSupported && firstRenderer) media.set(firstRenderer);
  }, [firstRenderer, rendererSupported]);

  // Follow the renderer a pasted URL resolves to. Fitting the renderer to the use case lives in the store.
  useEffect(() => {
    if (supportedSourceRenderer) media.set(supportedSourceRenderer);
  }, [supportedSourceRenderer]);

  return (
    <div className="flex flex-col gap-8" data-ph-capture-attribute-location="installation-options">
      <MediaSourceUrlField id="source-url-input" supportedRenderers={supportedRenderers} choicesLocation="below" />

      <CardRadioGroup
        value={$renderer}
        onChange={(value) => media.set(value)}
        options={renderers.map((value) => ({
          value,
          label: getInstallationRenderer(value).label,
          description: RENDERER_DESCRIPTIONS[value],
          media: cardMark(MEDIA_SOURCE_MARKS[value]),
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
