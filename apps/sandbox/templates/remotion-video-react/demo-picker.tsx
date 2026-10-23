// Picks which composition plays. Swapping is a `source` change on the media, so the store sees `emptied` and a
// fresh load, exactly as it would for a new URL on a video element.

import { DEMO_IDS, type DemoId, DEMOS, isDemoId } from './demos';

const SELECT_CLASS =
  'rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900';

export function DemoPicker({ demo, onChange }: { demo: DemoId; onChange: (demo: DemoId) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      Composition
      <select
        className={SELECT_CLASS}
        value={demo}
        onChange={(event) => {
          if (isDemoId(event.target.value)) onChange(event.target.value);
        }}
      >
        {DEMO_IDS.map((id) => (
          <option key={id} value={id}>
            {DEMOS[id].label}
          </option>
        ))}
      </select>
    </label>
  );
}
