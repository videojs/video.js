import { COMPARE_LAYOUTS, type CompareLayout, type ComparePanel } from '@app/compare';
import { Button } from '@app/components/ui/button';
import { Label } from '@app/components/ui/label';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@app/components/ui/resizable';
import { Switch } from '@app/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@app/components/ui/toggle-group';
import type { ColorScheme, PreloadValue, TextDirection } from '@app/constants';
import { LAYOUT_LABELS } from '@app/labels';
import type { MediaId } from '@app/media';
import type { CaptionsMode } from '@app/shared/captions';
import type { SandboxLocaleTag } from '@app/shared/i18n/locale-meta';
import type { AspectRatio } from '@app/shared/player-frame';
import type { SourceId } from '@app/shared/sources';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/16/solid';
import { observeResize } from '@videojs/utils/dom';
import { Fragment, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { type ReportInput, buildReport } from './report';

// Brand marks from Simple Icons (CC0).
const CSS_ICON =
  'M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z';
const TAILWIND_ICON =
  'M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z';

/** Everything the frames share; the panels carry what differs. */
export interface FrameParams {
  readonly media: MediaId;
  /** Render the media alone, in place of the skin. */
  readonly skinless: boolean;
  readonly source: SourceId;
  readonly autoplay: boolean;
  readonly muted: boolean;
  readonly loop: boolean;
  readonly preload: PreloadValue;
  readonly captions: CaptionsMode;
  readonly locale: SandboxLocaleTag;
  readonly accentColor: string;
  readonly width: number;
  readonly ratio: AspectRatio;
  readonly scheme: ColorScheme;
  readonly direction: TextDirection;
  /** Mirror playback between compare panels. */
  readonly mirror: boolean;
}

type PreviewProps = {
  onToolbarResize: (height: number) => void;
  panels: readonly ComparePanel[];
  layout: CompareLayout;
  onLayoutChange: (layout: CompareLayout) => void;
  onMirrorChange: (mirror: boolean) => void;
  /** The skin controls, shown at the start of the header. */
  controls: ReactNode;
  summary: string;
  /** Everything the report needs beyond the selection, gathered by the shell. */
  report: Omit<ReportInput, 'url' | 'userAgent' | 'viewport' | 'panels' | 'summary'>;
  params: FrameParams;
  onFrame: (id: string, frame: HTMLIFrameElement | null) => void;
  onFrameLoad: (id: string) => void;
};

function pagePath(panel: ComparePanel, media: MediaId): string {
  if (panel.platform === 'cdn') return '/cdn/';

  return `/${panel.platform}-${media}/`;
}

function buildUrl(panel: ComparePanel, params: FrameParams, bustCache = false): string {
  const query = new URLSearchParams({
    media: params.media,
    skin: panel.skin,
    styling: panel.styling,
    skins: panel.skins,
    skinless: params.skinless ? '1' : '0',
    source: params.source,
    autoplay: params.autoplay ? '1' : '0',
    muted: params.muted ? '1' : '0',
    loop: params.loop ? '1' : '0',
    preload: params.preload,
    locale: params.locale,
    width: String(params.width),
    ratio: params.ratio,
    scheme: params.scheme,
    dir: params.direction,
  });

  if (params.captions !== 'none') query.set('captions', params.captions);

  if (params.accentColor) query.set('accent', params.accentColor);

  if (params.mirror) query.set('mirror', '1');

  if (bustCache) query.set('_', String(Date.now()));

  return `${pagePath(panel, params.media)}?${query}`;
}

/**
 * The preview area: the skin controls and the preview actions, then one frame, or two framed panels laid out by
 * `layout`.
 */
export function Preview({
  onToolbarResize,
  panels,
  layout,
  onLayoutChange,
  onMirrorChange,
  controls,
  summary,
  report,
  params,
  onFrame,
  onFrameLoad,
}: PreviewProps) {
  const previewRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    return observeResize(toolbar, () => onToolbarResize(toolbar.getBoundingClientRect().height));
  }, [onToolbarResize]);
  const [wide, setWide] = useState(false);
  const orientation = layout === 'row' || (layout === 'auto' && wide) ? 'horizontal' : 'vertical';

  useLayoutEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    // Split comparisons side by side when the preview has at least 64rem of space.
    const breakpoint = 64 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);

    setWide(preview.getBoundingClientRect().width >= breakpoint);

    return observeResize(preview, ([entry]) => {
      if (entry) setWide(entry.contentRect.width >= breakpoint);
    });
  }, []);

  const comparing = panels.length > 1;
  const single = panels[0];
  const buildPreviewReport = () =>
    buildReport({
      ...report,
      url: location.href,
      summary,
      panels: comparing ? panels.map((panel) => ({ label: panel.label, url: buildUrl(panel, params) })) : [],
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, scale: devicePixelRatio },
    });

  return (
    <main ref={previewRef} className="bg-muted/40 flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={toolbarRef}
        className="border-border bg-background flex min-h-10 shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-1.5"
      >
        {controls}
        {/* The selection in words stays in the tree for assistive technology and tests; the controls say it visually. */}
        <p className="sr-only" data-testid="selection-summary">
          {summary}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {comparing ? (
            <>
              <MirrorToggle value={params.mirror} onChange={onMirrorChange} />
              <LayoutToggle value={layout} onChange={onLayoutChange} />
            </>
          ) : (
            single && <OpenLink href={buildUrl(single, params)} />
          )}
          <ReportButton build={buildPreviewReport} errors={report.errors.length} />
        </div>
      </div>
      <div className={comparing ? 'min-h-0 flex-1 p-3' : 'min-h-0 flex-1'}>
        {comparing ? (
          <ResizablePanelGroup orientation={orientation}>
            {panels.map((panel, index) => (
              <Fragment key={`${panel.id}:${pagePath(panel, params.media)}:${panel.styling}:${panel.skins}`}>
                {index > 0 && (
                  <ResizableHandle
                    withHandle
                    aria-label="Resize comparison panels"
                    onPointerDown={(event) => {
                      // Capture before the first move can enter a player iframe.
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    className="mx-1.5 aria-[orientation=horizontal]:mx-0 aria-[orientation=horizontal]:my-1.5"
                  />
                )}
                <ResizablePanel id={panel.id} defaultSize="50%" minSize="20%">
                  <PreviewPanel panel={panel} params={params} comparing onFrame={onFrame} onFrameLoad={onFrameLoad} />
                </ResizablePanel>
              </Fragment>
            ))}
          </ResizablePanelGroup>
        ) : (
          single && (
            <PreviewPanel
              key={`${single.id}:${pagePath(single, params.media)}:${single.styling}:${single.skins}`}
              panel={single}
              params={params}
              comparing={false}
              onFrame={onFrame}
              onFrameLoad={onFrameLoad}
            />
          )
        )}
      </div>
    </main>
  );
}

type PreviewPanelProps = {
  panel: ComparePanel;
  params: FrameParams;
  comparing: boolean;
  onFrame: (id: string, frame: HTMLIFrameElement | null) => void;
  onFrameLoad: (id: string) => void;
};

function PreviewPanel({ panel, params, comparing, onFrame, onFrameLoad }: PreviewPanelProps) {
  const reloadOnLocale = panel.platform === 'cdn';

  // Capture the initial query so the iframe doesn't reload when autoplay/muted
  // toggle — those changes are streamed in via postMessage.
  const [iframeUrl, setIframeUrl] = useState(() => buildUrl(panel, params));
  const previousLocaleRef = useRef(params.locale);

  // keep iframe `src` locale in sync; other toggles use postMessage.
  // oxlint-disable-next-line react/exhaustive-deps
  useEffect(() => {
    if (previousLocaleRef.current === params.locale) return;

    previousLocaleRef.current = params.locale;
    setIframeUrl(buildUrl(panel, params, reloadOnLocale));
  }, [params, panel, reloadOnLocale]);

  return (
    <section
      data-panel={panel.id}
      className={
        comparing
          ? 'bg-card border-border flex h-full min-h-0 flex-col overflow-hidden rounded-xl border'
          : 'relative flex h-full min-h-0 flex-1 flex-col'
      }
    >
      {comparing && (
        <header className="text-muted-foreground border-border/75 flex h-11 shrink-0 items-center justify-between border-b border-dashed pr-1.5 pl-3 text-sm">
          <span className="inline-flex items-center gap-1.5">
            {(panel.id === 'css' || panel.id === 'tailwind') && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <path d={panel.id === 'css' ? CSS_ICON : TAILWIND_ICON} />
              </svg>
            )}
            {panel.label}
          </span>
          <OpenLink href={buildUrl(panel, params)} />
        </header>
      )}
      <iframe
        ref={(frame) => onFrame(panel.id, frame)}
        data-panel={panel.id}
        src={iframeUrl}
        onLoad={() => onFrameLoad(panel.id)}
        className="min-h-0 w-full flex-1 border-0"
        title={comparing ? `player demo (${panel.label})` : 'player demo'}
      />
    </section>
  );
}

function OpenLink({ href }: { href: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      role="link"
      render={<a href={href} target="_blank" rel="noopener noreferrer" title="Open in new tab" />}
    >
      Open <ArrowTopRightOnSquareIcon className="size-4" aria-hidden="true" />
    </Button>
  );
}

/**
 * Copies a markdown report for bug reports and shows it in a dialog, so it can be read or selected when the clipboard
 * is unavailable. The badge counts the errors the frames relayed.
 */
function ReportButton({ build, errors }: { build: () => string; errors: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);

  const open = async () => {
    const text = build();

    setReport(text);
    setCopied(
      await navigator.clipboard?.writeText(text).then(
        () => true,
        () => false
      )
    );
    dialogRef.current?.showModal();
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => void open()}>
        Report
        {errors > 0 && (
          <span
            className="rounded-full bg-red-600 px-1.5 text-[10px] leading-4 text-white"
            aria-label={`${errors} errors`}
          >
            {errors}
          </span>
        )}
      </Button>
      <dialog
        ref={dialogRef}
        aria-label="Preview report"
        className="border-border bg-background text-foreground m-auto w-[min(48rem,90vw)] rounded-lg border p-4 shadow-lg backdrop:bg-black/40"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{copied ? 'Copied to the clipboard.' : 'Select and copy the report.'}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => dialogRef.current?.close()}>
            Close
          </Button>
        </div>
        <textarea
          readOnly
          value={report}
          aria-label="Report markdown"
          rows={12}
          className="border-border bg-muted text-foreground w-full resize-y rounded-md border p-2 font-mono text-xs"
        />
      </dialog>
    </>
  );
}

/** Play, pause, seek, volume, rate, and captions in one panel reach the other. */
function MirrorToggle({ value, onChange }: { value: boolean; onChange: (mirror: boolean) => void }) {
  const id = useId();

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Switch id={id} checked={value} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-muted-foreground cursor-pointer font-normal">
        Mirror playback
      </Label>
    </div>
  );
}

/** Side by side, stacked, or whichever fits: the panels' arrangement while comparing. */
function LayoutToggle({ value, onChange }: { value: CompareLayout; onChange: (layout: CompareLayout) => void }) {
  return (
    <ToggleGroup
      multiple={false}
      spacing={0}
      value={[value]}
      onValueChange={(next) => {
        const layout = COMPARE_LAYOUTS.find((layout) => layout === next[0]);

        if (layout) onChange(layout);
      }}
      aria-label="Compare layout"
      size="sm"
      variant="outline"
      className="shrink-0"
    >
      {COMPARE_LAYOUTS.map((layout) => (
        <ToggleGroupItem key={layout} value={layout}>
          {LAYOUT_LABELS[layout]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
