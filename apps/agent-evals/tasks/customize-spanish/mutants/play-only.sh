#!/usr/bin/env bash
# Relabels the play button by hand and leaves every other control in English.
# expect: task
set -euo pipefail

cat > components/player.tsx <<'TSX'
import '@videojs/react/video/skin.css';
import { I18nProvider } from '@videojs/react/i18n';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';

export function Player({ src }: { src: string }) {
  return (
    <I18nProvider locale="en" translations={{ buttons: { play: 'Reproducir', pause: 'Pausar' } }}>
      <VideoPlayer>
        <VideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>
          <Video src={src} playsInline />
        </VideoSkin>
      </VideoPlayer>
    </I18nProvider>
  );
}
TSX
