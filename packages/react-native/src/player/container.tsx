import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

export interface ContainerProps extends ViewProps {
  children?: ReactNode | undefined;
}

/**
 * The player's layout and stacking root. Holds the media surface and the chrome as siblings.
 *
 * It has to be a plain `<View>` rather than the native surface: Android registers `VideoJSPlayerView` through
 * `SimpleViewManager`, a leaf base that cannot host React children, and iOS assigns the `AVPlayerLayer`-backed view as
 * its `contentView`. `<Video>` declares `children?: never` for the same reason.
 *
 * Thinner than its web counterpart, which additionally registers itself as the store's `container` via
 * `useContainerAttach`, owns a `ContainerCore` for activity state, and provides a popup group. None of that is
 * reachable yet — `PlayerTarget.container` is `HTMLElement`-typed, so nothing can be registered. See
 * `NativePlayerTarget` for what de-DOMing it would unlock.
 */
export function Container({ children, style, ...props }: ContainerProps): ReactNode {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
}

export namespace Container {
  export type Props = ContainerProps;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
});
