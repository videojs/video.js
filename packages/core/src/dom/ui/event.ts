export interface UIEvent {
  readonly defaultPrevented?: boolean;
  readonly detail?: number;
  preventDefault(): void;
  stopPropagation(): void;
}

export interface UIKeyboardEvent extends UIEvent {
  key: string;
  repeat?: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  target: EventTarget;
  currentTarget: EventTarget;
}

export interface UIPointerEvent extends UIEvent {
  clientX: number;
  clientY: number;
  pointerId: number;
  pointerType: string;
  buttons: number;
}

/** @internal */
export interface UIWheelEvent extends UIEvent {
  deltaY: number;
}

export interface UIFocusEvent extends UIEvent {
  relatedTarget: EventTarget | null;
}
