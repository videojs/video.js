import * as $ from '@videojs/core/vjsc';

import { ControlsContent } from '../shared/controls';

export function LiveAudioControls() {
  return (
    <$.Controls.Root visibility="always">
      <ControlsContent audio live />
    </$.Controls.Root>
  );
}
