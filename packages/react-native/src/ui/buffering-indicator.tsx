import { BufferingIndicatorCore, type BufferingIndicatorProps as CoreBufferingIndicatorProps } from '@videojs/core';
import { SpinnerIcon } from '@videojs/icons/react-native';
import { useSnapshot } from '@videojs/store/react';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View, type ViewProps } from 'react-native';

import { usePlayer } from '../player/context';
import { selectPlayback } from '../store/selectors';
import { useDestroy } from '../utils/use-destroy';
import { ICON_COLOR } from './utils/button';

export interface BufferingIndicatorProps extends Omit<ViewProps, 'children'>, CoreBufferingIndicatorProps {}

/** One full turn of the spinner, matching the web icon's `1s steps(8)` fade. */
const SPIN_DURATION = 1000;
const SPIN_STEPS = 8;
const SPINNER_SIZE = 48;

/**
 * Shows a spinner while playback is waiting for data, after a delay (default 500ms) so quick stalls do not flash it.
 *
 * Decorative, like the web indicator: it is hidden from assistive technology.
 */
export function BufferingIndicator({ delay, style, ...props }: BufferingIndicatorProps): ReactNode {
  const playback = usePlayer(selectPlayback);
  const [core] = useState(() => new BufferingIndicatorCore());

  useDestroy(core);

  core.setProps({ delay });

  if (playback) core.update(playback);

  const { visible } = useSnapshot(core.state);
  if (isUndefined(playback) || !visible) return null;

  return (
    <View pointerEvents="none" aria-hidden style={[styles.root, style]} {...props}>
      <Spinner />
    </View>
  );
}

export namespace BufferingIndicator {
  export type Props = BufferingIndicatorProps;
}

/**
 * The web spinner animates each segment's opacity with CSS, which `react-native-svg` cannot run. The icon's segments
 * already fade around the ring, so stepping the whole icon through eighths of a turn gives the same look. It is
 * mirrored first so the fading tail trails the bright head as it turns clockwise, as it does on web.
 */
function Spinner(): ReactNode {
  const [rotation] = useState(() => new Animated.Value(0));
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: SPIN_DURATION,
        easing: (t) => Math.floor(t * SPIN_STEPS) / SPIN_STEPS,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
      rotation.setValue(0);
    };
  }, [rotation, reduceMotion]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }, { scaleX: -1 }] }}>
      <SpinnerIcon color={ICON_COLOR} width={SPINNER_SIZE} height={SPINNER_SIZE} />
    </Animated.View>
  );
}

function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
