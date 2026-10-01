import * as $ from '@videojs/core/vjsc';
import { type ClassNameValue, type VjscElement, type VjscNode } from 'vjsc/components';

import popupStyles from '../../../styles/popups/popup.styles';
import tooltipStyles from './tooltip.styles';

export function ButtonTooltip({
  children,
  delay,
  disabled,
  label,
  popupClassName,
  sticky,
}: {
  children: VjscElement;
  delay?: number;
  disabled?: boolean;
  label?: VjscNode;
  popupClassName?: ClassNameValue;
  sticky?: boolean;
}) {
  return (
    <$.Tooltip.Root delay={delay} disabled={disabled} side="top" sticky={sticky}>
      <$.Tooltip.Trigger>{children}</$.Tooltip.Trigger>
      <$.Tooltip.Popup
        className={[
          popupStyles.popup,
          popupStyles.safeArea,
          popupStyles.transition,
          tooltipStyles.popup,
          popupClassName,
        ]}
      >
        {label ?? <$.Tooltip.Label />}
        {!label && <$.Tooltip.Shortcut className={tooltipStyles.shortcut} />}
      </$.Tooltip.Popup>
    </$.Tooltip.Root>
  );
}
