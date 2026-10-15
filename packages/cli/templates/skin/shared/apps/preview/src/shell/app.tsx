import { SidebarProvider } from '@preview/shell/components/ui/sidebar';
import { type CSSProperties, useEffect, useId, useRef, useState } from 'react';

import { skin } from './config';
import { PARAMS_MESSAGE } from './messages';
import { Navbar } from './navbar';
import { OptionsPanel } from './options-panel';
import { readParams, writeParams, type WorkbenchParams } from './params';
import { usePreferences } from './preferences';
import { readStored, writeStored } from './storage';
import { createUrlWriter } from './url';

const writeUrl = createUrlWriter();

/**
 * A slimmed-down Video.js sandbox for one skin: the options panel sets how the preview looks, and the preview frame
 * renders the skin on its own page so the shell's styles never reach it.
 */
export function App() {
  const optionsId = useId();
  const frame = useRef<HTMLIFrameElement>(null);
  const [params, setParams] = useState(() => readParams(location.search));
  const [optionsOpen, setOptionsOpen] = useState(() => readStored('options-open', true));
  // The frame loads once with the first settings; later changes are posted to it, so playback is never interrupted.
  const [frameUrl] = useState(() => `./preview.html#${writeParams(params)}`);
  const preferences = usePreferences();
  const query = writeParams(params);

  // Every setting lives in the URL, so a reload or a shared link reproduces the preview.
  useEffect(() => {
    // The frame updates straight away; the address bar catches up once changes pause.
    writeUrl(`?${query}`);
    frame.current?.contentWindow?.postMessage({ type: PARAMS_MESSAGE, query }, location.origin);
  }, [query]);

  // The scheme control drives the shell too, so its chrome matches what the preview shows.
  useEffect(() => {
    if (params.scheme === 'auto') delete document.documentElement.dataset.colorScheme;
    else document.documentElement.dataset.colorScheme = params.scheme;
  }, [params.scheme]);

  const update = (value: Partial<WorkbenchParams>) => setParams((current) => ({ ...current, ...value }));

  return (
    <SidebarProvider
      open={optionsOpen}
      onOpenChange={(open) => {
        writeStored('options-open', open);
        setOptionsOpen(open);
      }}
      className="bg-background text-foreground h-screen min-h-0 flex-col overflow-hidden"
      style={{ '--sidebar-width': '20rem' } as CSSProperties}
    >
      <Navbar previewUrl={`./preview.html#${query}`} optionsId={optionsId} />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <iframe
            ref={frame}
            src={frameUrl}
            onLoad={() => frame.current?.contentWindow?.postMessage({ type: PARAMS_MESSAGE, query }, location.origin)}
            className="min-h-0 w-full flex-1 border-0"
            title={`${skin.name} preview`}
          />
        </main>
        <OptionsPanel id={optionsId} params={params} onParamsChange={update} preferences={preferences} />
      </div>
    </SidebarProvider>
  );
}
