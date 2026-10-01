import { Container, createPlayer, Menu, CaptionsRadioGroup } from '@videojs/react';
import { Video, videoFeatures } from '@videojs/react/video';
import type { ReactNode } from 'react';

const { Player } = createPlayer({ features: videoFeatures });

function CaptionsMenu(): ReactNode {
  return (
    <Menu.Root side="top" align="end">
      <CaptionsRadioGroup.Root>
        <Menu.Trigger className="settings-trigger" render={<button type="button" />}>
          Captions
          <CaptionsRadioGroup.Value className="menu-hint" />
        </Menu.Trigger>
        <Menu.Popup className="menu">
          <Menu.Content>
            <CaptionsRadioGroup.Options
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
      </CaptionsRadioGroup.Root>
    </Menu.Root>
  );
}

export default function BasicUsage() {
  return (
    <Player>
      <Container className="media-container">
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" autoPlay muted playsInline loop>
          <track kind="captions" src="/docs/demos/captions-button/captions.vtt" srcLang="en" label="English" />
          <track kind="subtitles" src="/docs/demos/captions-button/captions.vtt" srcLang="es" label="Spanish" />
        </Video>
        <div className="menu-bar">
          <CaptionsMenu />
        </div>
      </Container>
    </Player>
  );
}
