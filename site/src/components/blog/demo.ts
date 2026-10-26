// Shared by the static skin demos, which scale every dimension from `--unit` to keep the Default skin's proportions.
export const iconStyle = { width: 'calc(var(--unit) * 18)', height: 'calc(var(--unit) * 18)', flexShrink: 0 };
export const buttonStyle = { width: 'calc(var(--unit) * 36)', height: 'calc(var(--unit) * 36)' };

/** Responsive widths for demo background images, which never render wider than the 48rem article column. */
export const imageWidths = [480, 768, 1536];
export const imageSizes = '(min-width: 48rem) 48rem, 100vw';

/**
 * Run a demo's looping animation only while it is on screen, the reader hasn't paused it, and reduced motion is off.
 * Wires the `[data-animation-toggle]` button from `AnimationControls` inside `host`, if any, and returns a cleanup
 * function.
 */
export function connectDemoAnimation(host: HTMLElement, { play, pause }: { play: () => void; pause: () => void }) {
  const button = host.querySelector<HTMLButtonElement>('[data-animation-toggle]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  // Assume the demo is on screen so it starts straight away; the observer pauses it once it scrolls out of view.
  let visible = true;

  const update = () => {
    if (visible && !paused) play();
    else pause();

    button?.toggleAttribute('data-playing', !paused);
  };

  const toggle = () => {
    paused = !paused;
    update();
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry!.isIntersecting;
    update();
  });

  button?.addEventListener('click', toggle);
  observer.observe(host);
  update();

  return () => {
    button?.removeEventListener('click', toggle);
    observer.disconnect();
    pause();
  };
}
