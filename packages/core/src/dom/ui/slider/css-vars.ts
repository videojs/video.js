import type { SliderPreviewOverflow, SliderState } from '../../../core/ui/slider/core';
import { SliderCSSVars } from '../../../core/ui/slider/vars';
import type { TimeSliderState } from '../../../core/ui/time-slider/core';

/** @internal */
export function getSliderCSSVars(state: SliderState): Record<string, string> {
  return {
    [SliderCSSVars.fill]: `${state.fillPercent.toFixed(3)}%`,
    [SliderCSSVars.pointer]: `${state.pointerPercent.toFixed(3)}%`,
  };
}

/** @internal */
export function getTimeSliderCSSVars(state: TimeSliderState): Record<string, string> {
  return {
    ...getSliderCSSVars(state),
    [SliderCSSVars.buffer]: `${state.bufferPercent.toFixed(3)}%`,
  };
}

// ---------------------------------------------------------------------------
// Slider Preview
// ---------------------------------------------------------------------------

export type { SliderPreviewOverflow } from '../../../core/ui/slider/core';

/**
 * Compute structural positioning styles for a slider preview element.
 *
 * @internal
 */
export function getSliderPreviewStyle(width: number, overflow: SliderPreviewOverflow) {
  const halfWidth = width / 2;

  return {
    position: 'absolute',
    left:
      overflow === 'visible'
        ? `calc(var(${SliderCSSVars.pointer}) - ${halfWidth}px)`
        : `min(max(0px, calc(var(${SliderCSSVars.pointer}) - ${halfWidth}px)), calc(100% - ${width}px))`,
    width: 'max-content',
    pointerEvents: 'none',
  };
}
