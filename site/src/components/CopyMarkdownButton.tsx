import { Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { useState } from 'react';

import Check from '@/assets/icons/check.svg?react';
import ChevronDown from '@/assets/icons/chevron-down.svg?react';
import Copy from '@/assets/icons/copy.svg?react';
import Markdown from '@/assets/icons/markdown.svg?react';
import ClaudeLogo from '@/assets/logos/brands/claude.svg?react';
import OpenAiLogo from '@/assets/logos/brands/openai.svg?react';
import { ANALYTICS_EVENTS, trackEvent } from '@/utils/analytics-events';
import { getInstallationRouteSegment } from '@/utils/installation/routes';
import useIsHydrated from '@/utils/useIsHydrated';

export interface CopyMarkdownButtonProps {
  className?: string;
  style?: React.CSSProperties;
  timeout?: number;
}

type CopyState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string };

/**
 * The page's Markdown twin from the llms-markdown integration: written at build time, converted on request in dev. An
 * installation guide's twin carries the picks the page shows, including the Shadcn framework before its URL is
 * normalized.
 */
async function markdownUrl(): Promise<string> {
  const location = window.location;
  const registryFramework = globalThis.document?.documentElement.dataset.registryFramework;

  // Strip trailing slashes so `/guide/` becomes `/guide.md`, not `/guide/.md`. Astro forbids trailing slashes but
  // infrastructure may add them back.
  const pathname = location.pathname.replace(/\/+$/, '');
  const url = new URL(`${location.origin}${pathname}.md${location.search}`);
  const installationRoute = getInstallationRouteSegment(pathname);

  if (installationRoute) {
    const { canonicalInstallationSearch } = await import('@/utils/installation/url-state');

    url.search = canonicalInstallationSearch(
      installationRoute,
      url.search,
      registryFramework === 'react' || registryFramework === 'html' ? registryFramework : undefined
    );
  }

  return url.toString();
}

/** Remove private installation input before embedding a documentation URL in a third-party assistant link. */
async function publicMarkdownUrl(url: string): Promise<string> {
  if (url === '#') return url;

  const { PRIVATE_INSTALLATION_QUERY_PARAMETERS } = await import('@videojs/installation');
  const publicUrl = new URL(url);

  for (const parameter of PRIVATE_INSTALLATION_QUERY_PARAMETERS) publicUrl.searchParams.delete(parameter);

  return publicUrl.toString();
}

function assistantPrompt(url: string): string {
  return `Read ${url} so I can ask questions about it.`;
}

const segmentClass = clsx(
  'inline-flex h-8 items-center border border-line bg-surface text-p3 whitespace-nowrap shadow-xs select-none',
  'intent:border-line-strong intent:text-faded-black dark:intent:text-manila-light text-muted',
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold focus-visible:relative focus-visible:z-10'
);

const itemClass = clsx(
  'flex cursor-pointer items-center gap-2.5 rounded-md corner-squircle px-2 py-1.5 text-p3 no-underline outline-none select-none',
  'data-[highlighted]:bg-surface dark:data-[highlighted]:bg-warm-gray'
);

/**
 * Split button beside the page title: copy the page's Markdown, or open a menu to view that Markdown, or hand the page
 * to an assistant.
 */
export default function CopyMarkdownButton({ className, style }: CopyMarkdownButtonProps) {
  const [state, setState] = useState<CopyState>({ status: 'idle' });
  const [menuUrls, setMenuUrls] = useState({ markdown: '#', public: '#' });
  const isHydrated = useIsHydrated();
  const disabled = !isHydrated || state.status === 'loading';

  const handleCopy = async () => {
    try {
      setState({ status: 'loading' });

      const markdownBlobPromise = markdownUrl()
        .then((mdUrl) => fetch(mdUrl))
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch markdown: ${response.status} ${response.statusText}`);
          }

          return response.text();
        })
        .then((text) => new Blob([text], { type: 'text/plain' }));

      // Feature detection: ClipboardItem required for Safari compatibility
      if (typeof ClipboardItem === 'undefined') {
        // Fallback for very old browsers (pre-2024)
        const blob = await markdownBlobPromise;
        const text = await blob.text();

        await navigator.clipboard.writeText(text);
      } else {
        // Safari requires passing async operation TO clipboard API
        // (not awaiting first) to preserve user gesture context
        const clipboardItem = new ClipboardItem({
          'text/plain': markdownBlobPromise,
        });

        await navigator.clipboard.write([clipboardItem]);
      }

      setState({ status: 'success' });
      trackEvent(ANALYTICS_EVENTS.agentHandoff, { method: 'copy-markdown' });
      setTimeout(() => {
        setState({ status: 'idle' });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
      const message = err instanceof Error ? err.message : 'Failed to copy markdown';

      setState({ status: 'error', message });
      setTimeout(() => {
        setState({ status: 'idle' });
      }, 2000);
    }
  };

  // Links are built on the client since they embed the page's own URL; the server renders the menu closed.
  const mdUrl = isHydrated ? menuUrls.markdown : '#';
  const prompt = isHydrated ? encodeURIComponent(assistantPrompt(menuUrls.public)) : '';

  const ariaLabel = state.status === 'success' ? 'Copied' : 'Copy page as Markdown';
  const label = state.status === 'success' ? 'Copied' : state.status === 'error' ? 'Error' : 'Copy page';

  return (
    <div className={clsx('inline-flex items-stretch', className)} style={style} data-llms-ignore>
      <button
        type="button"
        disabled={disabled}
        onClick={handleCopy}
        className={clsx(
          segmentClass,
          'gap-1.5 rounded-l-lg corner-squircle pr-2.5 pl-2.5',
          state.status === 'loading' && 'opacity-70',
          disabled ? 'cursor-wait' : 'cursor-pointer'
        )}
        aria-label={ariaLabel}
        data-ph-capture-attribute-cta="copy-markdown"
      >
        {state.status === 'success' ? (
          <Check className="text-accent size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        <span className="grid">
          {/* Reserve the widest label so the button doesn't resize between states. */}
          <span className="invisible col-start-1 row-start-1" aria-hidden="true">
            Copy page
          </span>
          <span className="col-start-1 row-start-1">{label}</span>
        </span>
      </button>
      <Menu.Root
        modal={false}
        onOpenChange={(open) => {
          if (!open) return;

          void markdownUrl().then(async (markdown) =>
            setMenuUrls({ markdown, public: await publicMarkdownUrl(markdown) })
          );
        }}
      >
        <Menu.Trigger
          disabled={!isHydrated}
          aria-label="More ways to use this page"
          data-ph-capture-attribute-cta="markdown-menu"
          className={clsx(
            segmentClass,
            '-ml-px w-8 justify-center rounded-r-lg corner-squircle data-[popup-open]:text-faded-black dark:data-[popup-open]:text-manila-light',
            isHydrated ? 'cursor-pointer' : 'cursor-wait'
          )}
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-40 outline-none">
            <Menu.Popup
              className={clsx(
                'min-w-56 origin-(--transform-origin) rounded-lg corner-squircle border border-line bg-surface-raised p-1 text-p3 shadow-lg dark:bg-soot',
                'transition duration-150 ease-out starting-style:scale-95 starting-style:opacity-0 ending-style:scale-95 ending-style:opacity-0 ending-style:duration-100',
                'motion-reduce:transition-none'
              )}
            >
              <Menu.Item
                className={itemClass}
                onClick={() => trackEvent(ANALYTICS_EVENTS.agentHandoff, { method: 'view-markdown' })}
                render={
                  <a
                    href={mdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ph-capture-attribute-cta="view-markdown"
                  />
                }
              >
                <Markdown className="size-4 shrink-0" aria-hidden="true" />
                View as Markdown
              </Menu.Item>
              <Menu.Separator className="bg-line my-1 h-px" />
              <Menu.Item
                className={itemClass}
                onClick={() => trackEvent(ANALYTICS_EVENTS.agentHandoff, { method: 'open-in-chatgpt' })}
                render={
                  <a
                    href={`https://chatgpt.com/?hints=search&prompt=${prompt}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ph-capture-attribute-cta="open-in-chatgpt"
                    data-ph-capture-attribute-destination="external"
                  />
                }
              >
                <OpenAiLogo className="size-4 shrink-0" aria-hidden="true" />
                Open in ChatGPT
              </Menu.Item>
              <Menu.Item
                className={itemClass}
                onClick={() => trackEvent(ANALYTICS_EVENTS.agentHandoff, { method: 'open-in-claude' })}
                render={
                  <a
                    href={`https://claude.ai/new?q=${prompt}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ph-capture-attribute-cta="open-in-claude"
                    data-ph-capture-attribute-destination="external"
                  />
                }
              >
                <ClaudeLogo className="size-4 shrink-0" aria-hidden="true" />
                Open in Claude
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <span aria-live="polite" className="sr-only">
        {state.status === 'success' ? 'Copied' : state.status === 'error' ? 'Error copying markdown' : ''}
      </span>
    </div>
  );
}
