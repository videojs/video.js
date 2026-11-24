import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Container, type ContainerProps } from '../player/container';
import { BufferingIndicator } from '../ui/buffering-indicator';
import { Controls } from '../ui/controls';
import { InlineError } from '../ui/inline-error';
import { PlayButton } from '../ui/play-button';
import { Poster } from '../ui/poster';
import { SeekButton } from '../ui/seek-button';
import { Time } from '../ui/time';
import { TimeSlider } from '../ui/time-slider';
import { Title } from '../ui/title';
import { ICON_SIZE } from '../ui/utils/button';

/** Inset between a center button's icon and the edge of its scrim. */
const SCRIM_INSET = 10;
const SCRIM_SIZE = ICON_SIZE + SCRIM_INSET * 2;

export interface VideoSkinProps extends ContainerProps {
  children?: ReactNode | undefined;
}

/**
 * Chrome for a video player: a container holding the media surface and the controls as siblings.
 *
 * `children` renders first so the media sits beneath the chrome, matching the generated web skin. Overlays that only
 * display state (poster, buffering, error) ignore touches so the controls beneath them stay usable. The error renders
 * last so it sits above the controls.
 *
 * The controls hide after a moment of playback without touches; a tap on the video toggles them.
 *
 * ```tsx
 * <VideoSkin>
 *   <Video src="…" />
 * </VideoSkin>;
 * ```
 */
export function VideoSkin({ children, ...props }: VideoSkinProps): ReactNode {
  return (
    <Container {...props}>
      {children}
      <Poster />
      <BufferingIndicator />
      <Controls>
        {/* The bar is the title's own padding and background, so a player without a title shows no empty strip. */}
        <Title style={styles.title} />
        <View style={styles.buttonContainer}>
          <View style={styles.buttons}>
            <SeekButton seconds={-10} style={styles.scrim} />
            <PlayButton style={styles.scrim} />
            <SeekButton seconds={10} style={styles.scrim} />
          </View>
        </View>
        <View pointerEvents="box-none" style={styles.bottom}>
          <Time.Value type="current" />
          <TimeSlider style={styles.slider} />
        </View>
      </Controls>
      {/* Above the controls so its message is not dimmed or crossed by them; it ignores touches. */}
      <InlineError />
    </Container>
  );
}

export namespace VideoSkin {
  export type Props = VideoSkinProps;
}

const styles = StyleSheet.create({
  title: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  slider: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  // The center buttons float over the video, so each gets its own scrim to stay legible over bright frames.
  scrim: {
    padding: SCRIM_INSET,
    borderRadius: SCRIM_SIZE / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
