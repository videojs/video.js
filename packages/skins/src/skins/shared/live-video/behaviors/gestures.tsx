import * as $ from '@videojs/core/vjsc';

export interface LiveVideoGesturesProps {
  disabled?: boolean | undefined;
}

export function LiveVideoGestures({ disabled = false }: LiveVideoGesturesProps = {}) {
  return (
    <>
      <$.Gesture disabled={disabled} type="tap" action="togglePaused" pointer="mouse" region="center" />
      <$.Gesture disabled={disabled} type="tap" action="toggleControls" pointer="touch" />
      <$.Gesture disabled={disabled} type="doubletap" action="toggleFullscreen" region="center" />
    </>
  );
}
