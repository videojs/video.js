import { type ColorValue, codegenNativeComponent, type ViewProps } from 'react-native';

interface NativeProps extends ViewProps {
  color?: ColorValue;
}

export default codegenNativeComponent<NativeProps>('ReactNativeView');
