import { Container, createPlayer, Menu, AudioTrackRadioGroup } from '@videojs/react';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { videoFeatures } from '@videojs/react/video';
import type { ReactNode } from 'react';

const { Player } = createPlayer({ features: videoFeatures });
const src = '{{VJS10_MULTI_AUDIO_DEMO_VIDEO_HLS}}';

function AudioMenu(): ReactNode {
  return (
    <Menu.Root side="top" align="end">
      <AudioTrackRadioGroup.Root>
        <Menu.Trigger className="settings-trigger" render={<button type="button" />}>
          Audio
          <AudioTrackRadioGroup.Value className="menu-hint" />
        </Menu.Trigger>
        <Menu.Popup className="menu">
          <Menu.Content>
            <AudioTrackRadioGroup.Options
              className="menu-group"
              renderItem={(props, item) => (
                <Menu.RadioItem {...props} className="menu-item">
                  {item.label}
                  <Menu.ItemIndicator checked={item.checked} forceMount className="menu-indicator">
                    ✓
                  </Menu.ItemIndicator>
                </Menu.RadioItem>
              )}
            />
          </Menu.Content>
        </Menu.Popup>
      </AudioTrackRadioGroup.Root>
    </Menu.Root>
  );
}

export default function BasicUsage() {
  return (
    <Player>
      <Container className="media-container">
        <HlsJsVideo src={src} autoPlay crossOrigin="anonymous" muted playsInline loop />
        <div className="menu-bar">
          <AudioMenu />
        </div>
      </Container>
    </Player>
  );
}
