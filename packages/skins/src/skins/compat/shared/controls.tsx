import * as $ from '@videojs/core/vjsc';
import { Box, type VjscNode } from 'vjsc/components';

import { AirPlayButton } from './airplay-button';
import audioControlsStyles from './audio-controls.styles';
import { CaptionsToggle } from './captions-button';
import controlsStyles from './controls.styles';
import { LiveButton } from './live-button';
import { PlayButton } from './play-button';
import { TimeSlider } from './time-slider';
import { type ThumbnailSlot } from './time-slider';
import timeStyles from './time.styles';
import { VolumePopover } from './volume-popover';

export function ControlsRow({
  audio = false,
  live = false,
  menu,
  rate,
  seekBackward,
  seekForward,
}: ControlsSlots & { audio?: boolean; live?: boolean; menu?: VjscNode } = {}) {
  return (
    <$.Controls.Group className={controlsStyles.row}>
      <$.Controls.Group className={[controlsStyles.group, controlsStyles.start]}>
        <PlayButton />
        {seekBackward}
        {seekForward}
        {live && <LiveButton />}
        {audio ? rate : <VolumePopover />}
        {!live && (
          <$.Time.Group className={timeStyles.group}>
            <$.Time.Value className={timeStyles.toggle} type="current" toggle />
            <$.Time.Value className={timeStyles.currentValue} type="current" />
            <$.Time.Separator className={timeStyles.separator} />
            <$.Time.Value className={timeStyles.durationValue} type="duration" />
          </$.Time.Group>
        )}
      </$.Controls.Group>

      <$.Controls.Group className={controlsStyles.group}>
        {(!live || audio) && <CaptionsToggle />}
        {menu ?? (audio && <VolumePopover />)}
        {audio && <AirPlayButton />}
      </$.Controls.Group>
    </$.Controls.Group>
  );
}

export interface ControlsSlots extends ThumbnailSlot {
  /** The playback-rate control, supplied by the on-demand audio preset. */
  rate?: VjscNode;
  /** The skip-back control, supplied by the presets that have a timeline. */
  seekBackward?: VjscNode;
  /** The skip-forward control, supplied by the presets that have a timeline. */
  seekForward?: VjscNode;
}

export function ControlsContent({
  audio = false,
  center = false,
  live = false,
  menu,
  rate,
  renderThumbnail,
  seekBackward,
  seekForward,
  top,
}: ControlsSlots & { audio?: boolean; center?: boolean; live?: boolean; menu?: VjscNode; top?: VjscNode } = {}) {
  return (
    <$.Controls.Content className={[controlsStyles.content, audio && audioControlsStyles.content]}>
      <$.Tooltip.Provider>
        {top && <$.Controls.Group className={controlsStyles.top}>{top}</$.Controls.Group>}
        {center && (
          <$.Controls.Group className={controlsStyles.center}>
            {seekBackward}
            <PlayButton
              className={[controlsStyles.centerButton, controlsStyles.centerPlay]}
              iconClassName={controlsStyles.centerPlayIcon}
              tooltip={false}
            />
            {seekForward}
          </$.Controls.Group>
        )}
        <Box
          className={[controlsStyles.bottom, audio && audioControlsStyles.bottom, !audio && controlsStyles.videoBottom]}
        >
          {!live && <TimeSlider audio={audio} renderThumbnail={renderThumbnail} />}
          <ControlsRow
            audio={audio}
            live={live}
            menu={menu}
            rate={rate}
            seekBackward={center ? undefined : seekBackward}
            seekForward={center ? undefined : seekForward}
          />
        </Box>
      </$.Tooltip.Provider>
    </$.Controls.Content>
  );
}
