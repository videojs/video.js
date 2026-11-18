import type { PropsOf } from 'vjsc/components';

import { AudioTrackMenu } from '../../../../components/menus/audio-track-menu';
import { CaptionsSubmenu } from '../../../../components/menus/captions-submenu';
import { QualityMenu } from '../../../../components/menus/quality-menu';
import { SettingsMenu } from '../../../../components/menus/settings-menu';

export type LiveVideoSettingsMenuProps = Omit<PropsOf<typeof SettingsMenu>, 'children'>;

// The video settings menu without playback rate, which does not apply at the live edge.
export function LiveVideoSettingsMenu(props: LiveVideoSettingsMenuProps = {}) {
  return (
    <SettingsMenu {...props}>
      <QualityMenu />
      <AudioTrackMenu />
      <CaptionsSubmenu />
    </SettingsMenu>
  );
}
