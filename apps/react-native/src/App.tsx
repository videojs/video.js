import { Player, type PlayerStatus, type ReactNativeMedia, Video } from '@videojs/react-native';
import { useEffect, useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

const SOURCE_LIVE = 'https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8';

// warning - this asset's encoding doesn't work well in android emulator, but that's just an emulator quirk. It works fine on a real device.
const SOURCE_VOD = 'https://stream.mux.com/u02xH9SB1ZZNNjPiQp4l6mhzBKJ101uExYx4LU02J5Xm88.m3u8';

/**
 * The original path: a Player that drives the TurboModule through React context.
 *
 * Intentionally kept but not rendered — swap it into `App` to compare the two
 * implementations. Both control paths are supported, neither is deprecated.
 */
// biome-ignore lint/correctness/noUnusedVariables: kept as a switchable alternative to AdapterVideo
function ContextPlayer() {
  const player = useRef<Player.Ref>(null);
  const [status, setStatus] = useState<PlayerStatus | 'idle'>('idle');
  const [source, setSource] = useState(SOURCE_VOD);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{'<Player> — context path'}</Text>
      <Player ref={player} source={source} onStatusChange={setStatus} style={styles.video} />
      <Text>status: {status}</Text>
      <Text>source: {source === SOURCE_VOD ? 'vod' : 'live'}</Text>
      <View style={styles.controls}>
        <Button title="Play" onPress={() => player.current?.play()} />
        <Button title="Pause" onPress={() => player.current?.pause()} />
        <Button
          title="Swap source"
          onPress={() => setSource((current) => (current === SOURCE_VOD ? SOURCE_LIVE : SOURCE_VOD))}
        />
      </View>
    </View>
  );
}

/**
 * The adapter path: a Video backed by a ReactNativeMedia implementing the
 * `Media` contract. Status comes from contract events rather than a callback
 * prop, which is what lets the shared store features consume it later.
 */
function AdapterVideo() {
  const media = useRef<ReactNativeMedia>(null);
  const [status, setStatus] = useState('idle');
  const [src, setSrc] = useState(SOURCE_VOD);

  useEffect(() => {
    const instance = media.current;
    if (!instance) return;

    const abort = new AbortController();
    const { signal } = abort;

    // Exactly the contract event names — note `pause`, not native's `paused`.
    instance.addEventListener('play', () => setStatus('play'), { signal });
    instance.addEventListener('playing', () => setStatus('playing'), { signal });
    instance.addEventListener('pause', () => setStatus('pause'), { signal });
    instance.addEventListener('ended', () => setStatus('ended'), { signal });

    return () => abort.abort();
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{'<Video> — Media adapter path'}</Text>
      <Video ref={media} src={src} style={styles.video} />
      <Text>status: {status}</Text>
      <Text>src: {src === SOURCE_VOD ? 'vod' : 'live'}</Text>
      <View style={styles.controls}>
        <Button title="Play" onPress={() => media.current?.play()} />
        <Button title="Pause" onPress={() => media.current?.pause()} />
        <Button
          title="Swap src"
          onPress={() => setSrc((current) => (current === SOURCE_VOD ? SOURCE_LIVE : SOURCE_VOD))}
        />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>@videojs/react-native</Text>
      <AdapterVideo />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 32,
    paddingVertical: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    fontSize: 14,
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
