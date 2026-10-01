/**
 * Wrap `source.dispatchEvent` so every event is also re-dispatched on `target`.
 *
 * @internal
 */
export function bridgeEvents(source: EventTarget, target: EventTarget): void {
  if (!source.dispatchEvent) return;

  source.dispatchEvent = (event: Event) =>
    target.dispatchEvent(new (event.constructor as typeof Event)(event.type, event));
}
