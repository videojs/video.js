import { TimeSliderCore } from '@videojs/core';
import { useSnapshot } from '@videojs/store/react';
import { clamp } from '@videojs/utils/number';
import { omit } from '@videojs/utils/object';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';

import { usePlayer } from '../player/context';
import { selectBuffer, selectControls, selectPlayback, selectTime } from '../store/selectors';
import { useLatestRef } from '../utils/use-latest-ref';
import { toNativeA11yProps } from './utils/accessibility';
import { createSliderGesture } from './utils/slider-gesture';

export interface TimeSliderProps extends Omit<ViewProps, 'children'> {
  disabled?: boolean | undefined;
  /** Pause while dragging, resuming on release if it was playing. */
  pauseOnDrag?: boolean | undefined;
  /** Leading+trailing throttle (ms) for seeks while dragging. Read once, on mount. Defaults to the core's `100`. */
  changeThrottle?: number | undefined;
}

const ACCESSIBILITY_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const;

const EMPTY_BUFFER = { buffered: [], seekable: [] };

/**
 * Seeks through the media, showing played and buffered progress. Horizontal only.
 *
 * `TimeSliderCore` maps time and buffer state to slider state, as on web. The touch handling is react-native's own
 * (`createSliderGesture`), because the shared slider interaction is DOM-bound: it seeks on throttled drag moves, and
 * once more on release if the final position differs.
 *
 * Touches land on a full-size hit layer and bubble to the root's responder. Android's hit test passes over a view that
 * carries accessibility props (as the root must) when no child can take the touch, so the root cannot be the target
 * itself. The layer fills the root, so responder `locationX` is root-relative; the track and thumb ignore touches.
 */
export function TimeSlider({ disabled, pauseOnDrag, changeThrottle, style, ...props }: TimeSliderProps): ReactNode {
  const time = usePlayer(selectTime);
  const buffer = usePlayer(selectBuffer);
  const playback = usePlayer(selectPlayback);
  const controls = usePlayer(selectControls);
  const [core] = useState(() => new TimeSliderCore());

  const timeRef = useLatestRef(time);
  const playbackRef = useLatestRef(playback);
  const lastSeekRef = useRef<number | undefined>(undefined);
  const originRef = useRef(0);
  const releaseControlsLockRef = useRef<(() => void) | null>(null);

  // Keeps the controls up for the whole touch, as the web slider does; a drag outlasts the idle delay.
  const lockControls = () => {
    releaseControlsLockRef.current ??= controls?.requestControlsLock() ?? null;
  };
  const releaseControls = () => {
    releaseControlsLockRef.current?.();
    releaseControlsLockRef.current = null;
  };

  const [gesture] = useState(() => {
    function seekTo(percent: number) {
      const media = timeRef.current;
      if (!media) return;

      lastSeekRef.current = percent;
      void media.seek(core.rawValueFromPercent(percent));
    }

    return createSliderGesture({
      changeThrottle: changeThrottle ?? TimeSliderCore.defaultProps.changeThrottle,
      onValueChange: seekTo,
      onValueCommit(percent) {
        if (percent !== lastSeekRef.current) seekTo(percent);

        lastSeekRef.current = undefined;
      },
      onDragStart: () => core.startDrag(playbackRef.current),
      onDragEnd: () => core.endDrag(playbackRef.current),
    });
  });

  // Ending a drag on unmount also resumes playback that `pauseOnDrag` paused, and frees the controls.
  useEffect(
    () => () => {
      gesture.cancel();
      releaseControlsLockRef.current?.();
    },
    [gesture]
  );

  const input = useSnapshot(gesture.input);

  if (isUndefined(time)) return null;

  core.setProps({ disabled, pauseOnDrag, changeThrottle });
  core.setInput(input);
  core.setMedia({ ...time, ...(buffer ?? EMPTY_BUFFER) });

  const state = core.getState();
  const fillPercent = state.dragging ? input.dragPercent : state.fillPercent;
  // `role` takes precedence over `accessibilityRole`, and `role="slider"` gives iOS no Adjustable trait, so VoiceOver
  // would not offer swipe-to-adjust. `adjustable` maps to a slider on Android as well.
  const a11y = omit(toNativeA11yProps(core.getAttrs(state), { valueText: core.getValueTextParams(state) }), ['role']);

  const step = (direction: 1 | -1) => {
    // Larger than a keyboard arrow step: one swipe per second of media is unusable with a screen reader.
    const percent = clamp(state.fillPercent + direction * core.getLargeStepPercent(), 0, 100);

    void time.seek(core.rawValueFromPercent(percent));
  };

  return (
    <View
      {...a11y}
      accessibilityRole="adjustable"
      accessibilityActions={ACCESSIBILITY_ACTIONS}
      onAccessibilityAction={(event: AccessibilityActionEvent) => {
        if (state.disabled) return;

        if (event.nativeEvent.actionName === 'increment') step(1);
        else if (event.nativeEvent.actionName === 'decrement') step(-1);
      }}
      onLayout={(event) => gesture.setTrackSize(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !state.disabled}
      onMoveShouldSetResponder={() => !state.disabled}
      // The slider owns the touch once granted, so a parent scroll view cannot take it mid-drag.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event: GestureResponderEvent) => {
        const { pageX, locationX } = event.nativeEvent;

        originRef.current = pageX - locationX;
        lockControls();
        gesture.press(locationX);
      }}
      onResponderMove={(event: GestureResponderEvent) => gesture.move(event.nativeEvent.pageX - originRef.current)}
      onResponderRelease={() => {
        gesture.release();
        releaseControls();
      }}
      onResponderTerminate={() => {
        gesture.release();
        releaseControls();
      }}
      style={[styles.root, state.disabled && styles.disabled, style]}
      {...props}
    >
      {/* `collapsable={false}`: an empty view is otherwise flattened away and could not be hit. */}
      <View collapsable={false} style={styles.hitLayer} />
      <View pointerEvents="none" style={styles.track}>
        <View style={[styles.buffer, { width: `${state.bufferPercent}%` }]} />
        <View style={[styles.fill, { width: `${fillPercent}%` }]} />
      </View>
      <View
        pointerEvents="none"
        style={[styles.thumb, state.dragging && styles.thumbDragging, { left: `${fillPercent}%` }]}
      />
    </View>
  );
}

export namespace TimeSlider {
  export type Props = TimeSliderProps;
}

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;

const styles = StyleSheet.create({
  root: {
    // Taller than the track so the touch target meets the 44pt minimum.
    height: 44,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  hitLayer: {
    position: 'absolute',
    inset: 0,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  buffer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'white',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: 'white',
  },
  thumbDragging: {
    transform: [{ scale: 1.3 }],
  },
});
