import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createSliderGesture } from '../slider-gesture';

function setup(changeThrottle = 0) {
  const calls = {
    onValueChange: vi.fn<(percent: number) => void>(),
    onValueCommit: vi.fn<(percent: number) => void>(),
    onDragStart: vi.fn<() => void>(),
    onDragEnd: vi.fn<() => void>(),
  };
  const gesture = createSliderGesture({ changeThrottle, ...calls });

  gesture.setTrackSize(200);

  return { gesture, ...calls };
}

describe('createSliderGesture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('commits a press at the touched position without dragging', () => {
    const { gesture, onValueChange, onValueCommit, onDragStart } = setup();

    gesture.press(50);
    gesture.move(51);

    expect(gesture.input.current).toMatchObject({ pointing: true, dragging: false, pointerPercent: 25 });
    expect(onValueChange).not.toHaveBeenCalled();

    gesture.release();

    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(25);
    expect(onDragStart).not.toHaveBeenCalled();
    expect(gesture.input.current).toMatchObject({ pointing: false, dragging: false });
  });

  it('drags past the threshold and commits the release position', () => {
    const { gesture, onValueChange, onValueCommit, onDragStart, onDragEnd } = setup();

    gesture.press(50);
    gesture.move(100);
    gesture.move(150);

    expect(onDragStart).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls).toEqual([[50], [75]]);
    expect(gesture.input.current).toMatchObject({ dragging: true, dragPercent: 75 });

    gesture.release();

    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(75);
    expect(onDragEnd).toHaveBeenCalledOnce();
  });

  it('clamps positions outside the track', () => {
    const { gesture, onValueCommit } = setup();

    gesture.press(10);
    gesture.move(-40);
    gesture.release();

    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(0);

    gesture.press(10);
    gesture.move(400);
    gesture.release();

    expect(onValueCommit).toHaveBeenLastCalledWith(100);
  });

  it('throttles changes during a drag and drops the trailing change on release', () => {
    const { gesture, onValueChange, onValueCommit } = setup(100);

    gesture.press(0);
    gesture.move(20);
    gesture.move(40);
    gesture.move(60);

    expect(onValueChange.mock.calls).toEqual([[10]]);

    gesture.release();
    vi.advanceTimersByTime(200);

    expect(onValueChange.mock.calls).toEqual([[10]]);
    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(30);
  });

  it('ends a drag on cancel without committing', () => {
    const { gesture, onValueCommit, onDragEnd } = setup();

    gesture.press(0);
    gesture.move(100);
    gesture.cancel();

    expect(onDragEnd).toHaveBeenCalledOnce();
    expect(onValueCommit).not.toHaveBeenCalled();
  });

  it('reports zero before the track is measured', () => {
    const { gesture, onValueCommit } = setup();

    gesture.setTrackSize(0);
    gesture.press(80);
    gesture.release();

    expect(onValueCommit).toHaveBeenCalledExactlyOnceWith(0);
  });
});
