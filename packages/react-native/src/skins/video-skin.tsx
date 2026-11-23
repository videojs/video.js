import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Container, type ContainerProps } from '../player/container';
import { BufferingIndicator } from '../ui/buffering-indicator';
import { InlineError } from '../ui/inline-error';
import { PlayButton } from '../ui/play-button';
import { Poster } from '../ui/poster';
import { SeekButton } from '../ui/seek-button';
import { Time } from '../ui/time';
import { TimeSlider } from '../ui/time-slider';
import { Title } from '../ui/title';

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
 * The controls are always visible: auto-hide needs the `controls` feature, which cannot attach until the player target
 * accepts a react-native container. See `NativePlayerTarget`.
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
      {/* The bar is the title's own padding and background, so a player without a title shows no empty strip. */}
      <Title style={styles.title} />
      <View style={styles.buttonContainer}>
        <View style={styles.buttons}>
          <SeekButton seconds={-10} />
          <PlayButton />
          <SeekButton seconds={10} />
        </View>
      </View>
      <View pointerEvents="box-none" style={styles.bottom}>
        <Time.Value type="current" />
        <TimeSlider style={styles.slider} />
      </View>
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
    gap: 8,
  },
});
