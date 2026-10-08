import type { TooltipProps } from '@videojs/core';
import * as $ from '@videojs/core/vjsc';
import type { PropsWithChildren, VjscElement, VjscNode } from 'vjsc/components';

import type { SkinComponentDescription } from '../../meta';
import popupStyles from '../../styles/popups/popup.styles';
import styles from '../../styles/popups/tooltip.styles';

export interface ButtonTooltipProps extends TooltipProps {
  children: VjscElement;
  label?: VjscNode;
}

export function ButtonTooltip({ children, label, ...props }: PropsWithChildren<ButtonTooltipProps>) {
  return (
    <$.Tooltip.Root {...props}>
      <$.Tooltip.Trigger>{children}</$.Tooltip.Trigger>
      <$.Tooltip.Popup
        className={[popupStyles.popup, popupStyles.safeArea, popupStyles.transition, popupStyles.surface, styles.popup]}
      >
        {label ?? <$.Tooltip.Label />}
        {!label && <$.Tooltip.Shortcut className={styles.shortcut} />}
      </$.Tooltip.Popup>
    </$.Tooltip.Root>
  );
}

export const meta = {
  title: 'Button Tooltip',
  description: 'A tooltip that wraps a control button and shows its label and keyboard shortcut.',
} as const satisfies SkinComponentDescription;
