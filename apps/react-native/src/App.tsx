import { Player, type PlayerStatus } from '@videojs/react-native';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

// biome-ignore lint/correctness/noUnusedVariables: kept alongside SOURCE_VOD to swap between while testing
const SOURCE_LIVE = 'https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8';

// warning - this asset's encoding doesn't work well in android emulator, but that's just an emulator quirk. It works fine on a real device.
const SOURCE_VOD = 'https://stream.mux.com/u02xH9SB1ZZNNjPiQp4l6mhzBKJ101uExYx4LU02J5Xm88.m3u8';

export default function App() {
  const player = useRef<Player.Ref>(null);
  const [status, setStatus] = useState<PlayerStatus | 'idle'>('idle');

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>@videojs/react-native</Text>
      <Player ref={player} source={SOURCE_VOD} onStatusChange={setStatus} style={styles.video} />
      <Text>status: {status}</Text>
      <View style={styles.controls}>
        <Button title="Play" onPress={() => player.current?.play()} />
        <Button title="Pause" onPress={() => player.current?.pause()} />
      </View>
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
  video: {
    width: 320,
    height: 180,
    backgroundColor: 'black',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
  },
});
