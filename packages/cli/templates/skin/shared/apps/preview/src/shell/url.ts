/**
 * Browsers limit `history.replaceState` to about 100 calls per 10 seconds and throw past it, which dragging a slider
 * reaches quickly. Callers update the page straight away and pass the URL here; only the latest one is written, once
 * changes pause, and any pending one is written before the page is hidden so a reload still sees it.
 */
export function createUrlWriter(delay = 250): (url: string) => void {
  let pending: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;

    if (pending === undefined) return;

    history.replaceState(history.state, '', pending);
    pending = undefined;
  };

  window.addEventListener('pagehide', flush);

  return (url) => {
    pending = url;
    clearTimeout(timer);
    timer = setTimeout(flush, delay);
  };
}
