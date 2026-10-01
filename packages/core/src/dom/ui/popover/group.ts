/** @internal */
export type PopupGroupCloseReason = 'group-open';

/** @internal */
export interface PopupGroupMember {
  close: (reason: PopupGroupCloseReason) => void;
  readonly triggerElement: HTMLElement | null;
}

/** @internal */
export interface PopupGroup {
  open: (member: PopupGroupMember) => void;
  close: (member: PopupGroupMember) => void;
  isOpenFor: (trigger: HTMLElement | null) => boolean;
  subscribe: (listener: () => void) => () => void;
}

/** @internal */
export function createPopupGroup(): PopupGroup {
  let current: PopupGroupMember | null = null;
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  return {
    open(member) {
      if (current === member) return;

      const previous = current;

      current = member;
      previous?.close('group-open');
      notify();
    },

    close(member) {
      if (current !== member) return;

      current = null;
      notify();
    },

    isOpenFor(trigger) {
      return trigger !== null && current?.triggerElement === trigger;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
