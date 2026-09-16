import '@app/styles.css';
import { VideoPlayer } from '@app/shared/react/players';
import { VideoSkinComponent } from '@app/shared/react/skins';
import { RemotionVideo } from '@videojs/react/media/remotion-video';
import type { RemotionSource } from '@videojs/remotion-video';
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { DemoPicker } from './demo-picker';
import { type Demo, type DemoId, DEMOS, readDemoFromUrl, writeDemoToUrl } from './demos';
import { SkinPicker } from './skin-picker';
import { SHARED_FILES, SourceViewer } from './source-viewer';

const INPUT_CLASS =
  'rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900';

/** The parameter form for a demo that declares fields; values flow into `inputProps` on every keystroke. */
function InputPropsForm({
  demo,
  values,
  onChange,
}: {
  demo: Demo;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}) {
  if (!demo.fields?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
      {demo.fields.map((field) => (
        <label key={field.key} className="flex items-center gap-2">
          {field.label}
          <input
            className={field.type === 'color' ? 'h-8 w-12 cursor-pointer' : INPUT_CLASS}
            type={field.type}
            value={String(values[field.key] ?? '')}
            onChange={(event) => onChange({ ...values, [field.key]: event.target.value })}
          />
        </label>
      ))}
    </div>
  );
}

function App() {
  const [demoId, setDemoId] = useState<DemoId>(readDemoFromUrl);
  const [inputProps, setInputProps] = useState<Record<string, unknown>>(
    () => DEMOS[readDemoFromUrl()].defaultInputProps ?? {}
  );
  const demo: Demo = DEMOS[demoId];
  const files = useMemo(() => [demo.file, ...SHARED_FILES], [demo]);

  // Same composition, new input props: the adapter treats that as a live update, not a new source.
  const source = useMemo<RemotionSource>(
    () => (demo.fields ? { ...demo.source, composition: { ...demo.source.composition, inputProps } } : demo.source),
    [demo, inputProps]
  );

  const selectDemo = (next: DemoId) => {
    writeDemoToUrl(next);
    setInputProps(DEMOS[next].defaultInputProps ?? {});
    setDemoId(next);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <DemoPicker demo={demoId} onChange={selectDemo} />
        <SkinPicker />
      </div>
      <VideoPlayer>
        <VideoSkinComponent>
          <RemotionVideo className="block h-full w-full" source={source} />
        </VideoSkinComponent>
      </VideoPlayer>
      <InputPropsForm demo={demo} values={inputProps} onChange={setInputProps} />
      <p className="max-w-[56rem] text-center text-sm text-neutral-600 dark:text-neutral-400">{demo.blurb}</p>
      <SourceViewer files={files} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
