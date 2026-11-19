import { type CodegenTypes, codegenNativeComponent, type ViewProps } from 'react-native';

interface NativeProps extends ViewProps {
  playerHandle: CodegenTypes.Int32;
}

export default codegenNativeComponent<NativeProps>('VideoJSPlayerView');
