import { useEffect, useRef, useState } from 'react';

import { usePlayer } from './VolumePersistence';

export default function CaptionsPersistence() {
  const store = usePlayer();
  const tracks = usePlayer((s) => s.textTrackList);
  const [saved] = useState(() => {
    try {
      return localStorage.getItem('player:captions');
    } catch {
      return null;
    }
  });
  const restored = useRef(false);
  const lastSelection = useRef<string | null>(null);

  useEffect(() => {
    const subtitles = tracks.filter((t) => t.kind === 'captions' || t.kind === 'subtitles');
    if (!subtitles.length) return;

    const showing = subtitles.find((t) => t.mode === 'showing');
    const selection = showing ? showing.language : 'off';

    // Restore once the first subtitle list arrives, then honor later changes.
    if (!restored.current) {
      const desired = saved === 'off' ? undefined : subtitles.find((t) => t.language === saved);

      restored.current = true;
      lastSelection.current = selection;

      if (saved && (desired || saved === 'off')) {
        store.selectSubtitlesTrack(desired?.id ?? null);
      }

      return;
    }

    // Save only later selection changes, preserving an unmatched preference.
    if (selection === lastSelection.current) return;

    lastSelection.current = selection;

    try {
      localStorage.setItem('player:captions', selection);
    } catch {
      // Continue without persistence when storage is blocked.
    }
  }, [store, tracks, saved]);

  return null;
}
