import { useEffect, useState } from 'react';
import { Animated } from 'react-native';

export interface FadePresence {
  /** Drive the faded view's `opacity`. */
  opacity: Animated.Value;
  /** Whether to keep the view mounted: while shown, and until its fade-out finishes. */
  rendered: boolean;
}

/**
 * Fade a view in and out, keeping it mounted through the fade-out.
 *
 * The react-native stand-in for the DOM transition controller that drives web presence; cores here never see a
 * transition status, so nothing reads `starting`/`ending`.
 */
export function useFadePresence(show: boolean, duration = 150): FadePresence {
  const [opacity] = useState(() => new Animated.Value(show ? 1 : 0));
  const [rendered, setRendered] = useState(show);

  // Mount in the same render that shows, so the fade-in has a view to animate.
  if (show && !rendered) setRendered(true);

  useEffect(() => {
    const animation = Animated.timing(opacity, { toValue: show ? 1 : 0, duration, useNativeDriver: true });

    animation.start(({ finished }) => {
      if (finished && !show) setRendered(false);
    });

    return () => animation.stop();
  }, [opacity, show, duration]);

  return { opacity, rendered };
}
