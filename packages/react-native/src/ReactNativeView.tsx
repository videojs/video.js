import type { ColorValue, ViewProps } from 'react-native';

type Props = ViewProps & {
  color?: ColorValue;
};

export function ReactNativeView(_props: Props): never {
  throw new Error("'react-native' is only supported on native platforms.");
}
