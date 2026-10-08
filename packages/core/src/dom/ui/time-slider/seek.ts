import { createState } from '@videojs/store';
import { animationFrame } from '@videojs/utils/dom';

/** Hold the clicked position until seeking and the presentation layer's transition finish. @internal */
export function createTimeSliderSeek(property: string) {
  const state = createState<{ percent: number | undefined }>({ percent: undefined });
  let cancel: (() => void) | undefined;
  let seeking = false;
  let element: HTMLElement | null = null;

  function frame() {
    const transitioning = element
      ?.getAnimations?.()
      .some(
        (animation) =>
          'transitionProperty' in animation &&
          animation.transitionProperty === property &&
          animation.playState !== 'finished'
      );

    if (seeking || transitioning) {
      cancel = animationFrame(frame);
      return;
    }

    cancel = undefined;
    state.patch({ percent: undefined });
  }

  function seek(percent: number) {
    cancel?.();
    state.patch({ percent });
    cancel = animationFrame(frame);
  }

  return {
    state,
    seek,
    update(next: boolean, percent: number, el: HTMLElement | null) {
      element = el;

      if (next && !seeking && state.current.percent === undefined) seek(percent);

      seeking = next;
    },
    destroy() {
      cancel?.();
      cancel = undefined;
      seeking = false;
      element = null;
      state.patch({ percent: undefined });
    },
  };
}
