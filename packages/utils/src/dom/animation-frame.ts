/**
 * Request an animation frame with cleanup.
 *
 * @example
 *   ```ts
 *   const cancel = animationFrame((time) => console.log('Frame at', time));
 *   cancel(); // Cancel if needed
 *   ```;
 *
 * @internal
 */
export function animationFrame(callback: FrameRequestCallback): () => void {
  const id = requestAnimationFrame(callback);

  return () => cancelAnimationFrame(id);
}
