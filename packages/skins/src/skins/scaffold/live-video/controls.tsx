import * as $ from '@videojs/core/vjsc';

import { CaptionsMenu } from '../shared/captions-menu';
import { VideoControlsContent } from '../shared/video-controls';

export function LiveVideoControls() {
  return (
    <$.Controls.Root>
      <VideoControlsContent center live menu={<CaptionsMenu />} />
    </$.Controls.Root>
  );
}
