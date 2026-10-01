import { Container, createPlayer, Menu, QualityRadioGroup } from '@videojs/react';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { videoFeatures } from '@videojs/react/video';
import type { ReactNode } from 'react';

const { Player } = createPlayer({ features: videoFeatures });
const src = '{{VJS8_DEMO_VIDEO_HLS}}';

function QualityMenu(): ReactNode {
  return (
    <Menu.Root side="top" align="end">
      <QualityRadioGroup.Root>
        <Menu.Trigger className="settings-trigger" render={<button type="button" />}>
          Quality
          <QualityRadioGroup.Value className="menu-hint" />
        </Menu.Trigger>
        <Menu.Popup className="menu">
          <Menu.Content>
            <QualityRadioGroup.Options
              className="menu-group"
              renderItem={(props, item) => (
                <Menu.RadioItem {...props} className="menu-item">
                  <span>
                    {item.label}
                    {item.tier ? <sup className="menu-tier">{item.tier}</sup> : null}
                  </span>
                  {item.badge ? <span className="menu-badge">{item.badge}</span> : null}
                  <Menu.ItemIndicator checked={item.checked} forceMount className="menu-indicator">
                    ✓
                  </Menu.ItemIndicator>
                </Menu.RadioItem>
              )}
            />
          </Menu.Content>
        </Menu.Popup>
      </QualityRadioGroup.Root>
    </Menu.Root>
  );
}

export default function BasicUsage() {
  return (
    <Player>
      <Container className="media-container">
        <HlsJsVideo src={src} autoPlay crossOrigin="anonymous" muted playsInline loop />
        <div className="menu-bar">
          <QualityMenu />
        </div>
      </Container>
    </Player>
  );
}
