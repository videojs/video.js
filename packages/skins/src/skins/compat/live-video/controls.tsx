import * as $ from '@videojs/core/vjsc';

import { SettingsMenu } from '../shared/settings-menu';
import { VideoControlsContent } from '../shared/video-controls';

export function LiveVideoControls() {
  return (
    <$.Controls.Root>
      <VideoControlsContent center live menu={<SettingsMenu />} />
    </$.Controls.Root>
  );
}
