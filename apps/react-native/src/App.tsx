import { ReactNativeView } from '@videojs/react-native';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>@videojs/react-native</Text>
      <ReactNativeView color="#32a852" style={styles.box} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
  },
  box: {
    width: 200,
    height: 120,
  },
});
