import { Container, createPlayer } from '@videojs/react';
import { Video, videoFeatures } from '@videojs/react/video';
import { useEffect, useRef, useState } from 'react';

export const { Player, usePlayer } = createPlayer({ features: videoFeatures });

const STORAGE_KEY = 'player:volume';

// Guard storage access so playback still works when storage is blocked.
function readSaved(): { volume: number; muted: boolean } | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

    return Number.isFinite(value?.volume) && typeof value?.muted === 'boolean' ? value : null;
  } catch {
    return null;
  }
}

function save(prefs: { volume: number; muted: boolean }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable; skip persistence.
  }
}

function VolumePersistence() {
  const store = usePlayer();
  const { volume, muted } = usePlayer((s) => ({ volume: s.volume, muted: s.muted }));
  // Read the saved value once, before the save effect below can write.
  const [saved] = useState(readSaved);
  const restored = useRef(false);

  // Save on change, once the restore has run.
  useEffect(() => {
    if (!restored.current) return;

    save({ volume, muted });
  }, [volume, muted]);

  // Restore once the store attaches to the media; actions throw before that.
  useEffect(() => {
    const restore = () => {
      if (!store.target) return false;

      if (saved) {
        store.setVolume(saved.volume);

        // Apply saved mute after setVolume, which unmutes above zero.
        if (saved.muted) store.setMuted(true);
      }

      restored.current = true;
      return true;
    };
    if (restore()) return;

    const unsubscribe = store.subscribe(() => {
      if (restore()) unsubscribe();
    });

    return unsubscribe;
  }, [store, saved]);

  return null;
}

export default function App() {
  return (
    <Player>
      <Container>
        <Video src="{{VJS10_DEMO_VIDEO_MP4}}" playsInline />
        <VolumePersistence />
      </Container>
    </Player>
  );
}
