import { StyleSheet } from 'react-native';

/** Size of the icons in the default controls, in points. Twice the icon grid, so strokes stay crisp. */
export const ICON_SIZE = 36;

export const ICON_COLOR = 'white';

export const buttonStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
