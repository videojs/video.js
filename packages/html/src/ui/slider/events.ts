/** @internal */
export interface SliderValueEventDetail {
  /** The current slider value in the domain range (e.g., seconds for time, 0–1 for volume). */
  value: number;
}

/** @internal */
export interface SliderEventMap {
  /** Fires continuously as the slider value changes during drag or keyboard interaction. */
  'value-change': CustomEvent<SliderValueEventDetail>;
  /** Fires when the user commits a value — on pointer up or keyboard release. */
  'value-commit': CustomEvent<SliderValueEventDetail>;
  /** Fires when pointer movement begins a drag interaction. */
  'drag-start': CustomEvent<void>;
  /** Fires when a drag interaction ends (pointer up after dragging). */
  'drag-end': CustomEvent<void>;
}
