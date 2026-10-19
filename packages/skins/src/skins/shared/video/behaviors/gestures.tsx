import * as $ from '@videojs/core/vjsc';

export interface VideoGesturesProps {
  disabled?: boolean | undefined;
}

export function VideoGestures({ disabled = false }: VideoGesturesProps = {}) {
  return (
    <>
      <$.Gesture disabled={disabled} type="tap" action="togglePaused" pointer="mouse" region="center" />
      <$.Gesture disabled={disabled} type="tap" action="toggleControls" pointer="touch" />
      <$.Gesture disabled={disabled} type="doubletap" action="seekStep" region="left" />
      <$.Gesture disabled={disabled} type="doubletap" action="toggleFullscreen" region="center" />
      <$.Gesture disabled={disabled} type="doubletap" action="seekStep" region="right" />
    </>
  );
}
