import { safeDefine } from '../../registration/safe-define';
import { TimeSliderMarkersElement } from '../../ui/time-slider/markers';

safeDefine(TimeSliderMarkersElement);

declare global {
  interface HTMLElementTagNameMap {
    [TimeSliderMarkersElement.tagName]: TimeSliderMarkersElement;
  }
}
