import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { timeStyles } from './styles';

export interface GroupProps extends ViewProps {
  /** Time values and separators to lay out in a row. */
  children?: ReactNode | undefined;
}

/**
 * Lays out composed time displays in a row, like the web `Time.Group`.
 *
 * Each value stays its own accessibility element, so a toggling value remains pressable on its own.
 *
 * ```tsx
 * <Time.Group>
 *   <Time.Value type="current" toggle />
 *   <Time.Separator />
 *   <Time.Value type="duration" />
 * </Time.Group>;
 * ```
 */
export function Group({ style, ...props }: GroupProps): ReactNode {
  return <View {...props} style={[timeStyles.group, style]} />;
}

export namespace Group {
  export type Props = GroupProps;
}
