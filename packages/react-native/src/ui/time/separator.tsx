import type { ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';

import { timeStyles } from './styles';

export interface SeparatorProps extends TextProps {
  /** Separator content. Defaults to `/`. */
  children?: ReactNode | undefined;
}

/**
 * Divider between time values. Hidden from screen readers, like the web `Time.Separator`.
 *
 * ```tsx
 * <Time.Separator />
 * <Time.Separator> of </Time.Separator>
 * ```
 */
export function Separator({ children = '/', style, ...props }: SeparatorProps): ReactNode {
  return (
    <Text {...props} aria-hidden style={[timeStyles.text, style]}>
      {children}
    </Text>
  );
}

export namespace Separator {
  export type Props = SeparatorProps;
}
