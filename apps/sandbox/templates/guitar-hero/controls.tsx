import { CaptionsButton, Menu, PlayButton, QualityRadioGroup, Time, TimeSlider } from '@videojs/react';

import type { Song } from './song';
import { solosTrack, starPowerTrack } from './tracks';

export function ControlBar({ song }: { song: Song }) {
  return (
    <div className="control-bar">
      <PlayButton
        className="control"
        render={(props, state) => <button {...props}>{state.paused ? 'Play' : 'Pause'}</button>}
      />
      <Time.Group className="time">
        <Time.Value type="current" />
        <Time.Separator />
        <Time.Value type="duration" />
      </Time.Group>
      <SongProgress />
      <PartMenu song={song} />
      <CaptionsButton
        className="control"
        render={(props, state) => <button {...props}>{state.subtitlesShowing ? 'Lyrics on' : 'Lyrics off'}</button>}
      />
    </div>
  );
}

/** How far through the song's sections, with its solos and Star Power phrases marked. No skipping ahead. */
function SongProgress() {
  return (
    <TimeSlider.Root disabled className="progress">
      <TimeSlider.Chapters
        className="sections"
        renderChapter={(props) => (
          <div {...props} className="section">
            <TimeSlider.Track className="track">
              <TimeSlider.Fill className="fill" />
            </TimeSlider.Track>
          </div>
        )}
      />
      <TimeSlider.Markers
        filter={solosTrack}
        className="markers"
        renderMarker={(props) => <div {...props} className="marker" data-type="solo" />}
      />
      <TimeSlider.Markers
        filter={starPowerTrack}
        className="markers"
        renderMarker={(props) => <div {...props} className="marker" data-type="star-power" />}
      />
    </TimeSlider.Root>
  );
}

/** The quality menu picks the part: each of the media's renditions is one instrument at one difficulty. */
function PartMenu({ song }: { song: Song }) {
  const label = (id: string) => song.parts.find((part) => part.id === id)?.label ?? id;

  return (
    <Menu.Root side="top" align="end">
      <QualityRadioGroup.Root formatRendition={(rendition) => label(rendition.id)}>
        <Menu.Trigger className="control" render={<button type="button" />}>
          <QualityRadioGroup.Value />
        </Menu.Trigger>
        <Menu.Popup className="menu">
          <Menu.Content>
            <QualityRadioGroup.Options
              renderItem={(props, item) => (
                // Every part is a choice; there's no "Auto" difficulty.
                <Menu.RadioItem {...props} className="menu-item" hidden={item.value === 'auto'}>
                  {item.label}
                </Menu.RadioItem>
              )}
            />
          </Menu.Content>
        </Menu.Popup>
      </QualityRadioGroup.Root>
    </Menu.Root>
  );
}
