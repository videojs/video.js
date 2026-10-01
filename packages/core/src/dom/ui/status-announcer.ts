import type { StatusAnnouncerCore } from '../../core/ui/status-announcer/core';
import { getMediaSnapshot, type MediaSnapshotStore } from './input-action';
import { isSliderFocused } from './slider/focus';

/** @internal */
export interface StatusAnnouncerStore extends MediaSnapshotStore {
  readonly target: unknown | null;
  subscribe(callback: () => void): () => void;
}

/** @internal */
export function subscribeToStatusAnnouncer(store: StatusAnnouncerStore, core: StatusAnnouncerCore): () => void {
  let active = true;
  let pending = false;
  let target = store.target;
  let revision = 0;

  const baseline = () => {
    target = store.target;
    pending = true;
    const current = ++revision;

    core.resetSnapshot();

    queueMicrotask(() => {
      if (!active || current !== revision) return;

      pending = false;
      target = store.target;

      if (target) core.processSnapshot(getMediaSnapshot(store));
    });
  };

  const unsubscribe = store.subscribe(() => {
    const nextTarget = store.target;

    if (nextTarget !== target) {
      baseline();
      return;
    }

    if (!nextTarget || pending) return;

    core.processSnapshot(getMediaSnapshot(store));
  });

  baseline();

  return () => {
    active = false;
    unsubscribe();
  };
}

/** @internal */
export function shouldAnnounceStatusChange(container: HTMLElement | null | undefined): boolean {
  return !container || !isSliderFocused(container);
}
