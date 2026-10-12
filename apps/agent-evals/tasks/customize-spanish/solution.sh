#!/usr/bin/env bash
# Reference solution for the oracle agent: the i18n provider with the shipped Spanish pack, passed as first-render
# translations so the server-rendered labels match the client, as the internationalization guide shows for SSR.
set -euo pipefail

cat > components/player.tsx <<'TSX'
import '@videojs/react/video/skin.css';
import { I18nProvider } from '@videojs/react/i18n';
import es from '@videojs/react/i18n/locales/es';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';

export function Player({ src }: { src: string }) {
  return (
    <I18nProvider locale="es" translations={es}>
      <VideoPlayer>
        <VideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>
          <Video src={src} playsInline />
        </VideoSkin>
      </VideoPlayer>
    </I18nProvider>
  );
}
TSX
