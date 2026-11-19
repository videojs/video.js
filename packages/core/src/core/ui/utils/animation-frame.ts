/** Schedule `callback` for the next animation frame and return its cancel function. */
export function nextFrame(callback: () => void): () => void {
  const id = requestAnimationFrame(callback);

  return () => cancelAnimationFrame(id);
}
