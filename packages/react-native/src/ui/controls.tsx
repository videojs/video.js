import { ControlsCore, type ControlsVisibility } from '@videojs/core';
import { isNull } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { usePlayer } from '../player/context';
import { selectControls, selectPlayback } from '../store/selectors';
import { useFadePresence } from './utils/use-fade-presence';
import { useScreenReaderEnabled } from './utils/use-screen-reader-enabled';

export interface ControlsProps extends ViewProps {
  /** Whether the controls follow the player's `controls` state or stay visible. Defaults to `'auto'`. */
  visibility?: ControlsVisibility | undefined;
  children?: ReactNode | undefined;
}

/**
 * Fills the player and fades its children in and out with the player's `controls` state.
 *
 * Owns the touch handling the web `controlsFeature` does on the container, since the native feature has no container to
 * listen to: a tap on the empty area behind the controls toggles them, and any touch on the visible controls restarts
 * the idle timer. Hidden controls ignore touches, so the first tap on a control only reveals it.
 *
 * Stays visible while a screen reader runs: hidden controls would leave nothing to focus, and a screen reader user has
 * no backdrop tap to reveal them.
 *
 * Without a `controls` feature in the store, the children always show.
 */
export function Controls({ visibility, children, style, ...props }: ControlsProps): ReactNode {
  const controls = usePlayer(selectControls);
  const playback = usePlayer(selectPlayback);
  const screenReader = useScreenReaderEnabled();
  const [core] = useState(() => new ControlsCore());

  core.setProps({ visibility: screenReader || !controls ? 'always' : visibility });
  core.setMedia(controls ?? null);
  core.setPlayback(playback ?? null);

  const state = core.getState();
  const visible = !isNull(state) && state.visible;
  const { opacity, rendered } = useFadePresence(visible);

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, style]} {...props}>
      {controls && (
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={() => controls.toggleControls()}
          style={StyleSheet.absoluteFill}
        />
      )}
      {rendered && (
        <Animated.View
          pointerEvents={visible ? 'box-none' : 'none'}
          // Bubbles from every touch inside, including ones a control claims, so pressing or dragging keeps them up.
          onTouchStart={() => controls?.toggleControls(true)}
          style={[StyleSheet.absoluteFill, { opacity }]}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}

export namespace Controls {
  export type Props = ControlsProps;
}
