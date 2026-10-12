import type { RenderTargetRules, TargetElement } from 'vjsc/target';

/**
 * The shared skin components declared with `defineRenderTarget` or used as `$render` delegates, and the element each
 * framework renders them with. Every target carries the same set, so a new shared component is added once.
 */
export function skinRenderTargets(elements: {
  readonly button: TargetElement;
  readonly div: TargetElement;
}): RenderTargetRules {
  return {
    Button: { element: elements.button },
    CaptionsButton: { component: true },
    PlaybackRateButton: { component: true },
    SliderBuffer: { element: elements.div },
    SliderFill: { element: elements.div },
    SliderThumb: { element: elements.div },
    SliderTrack: { element: elements.div },
  };
}
