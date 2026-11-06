import { use, useEffect, useState, useSyncExternalStore } from 'react';
import type { BundledLanguage, Highlighter } from 'shiki';

import { shared } from '@/components/typography/styles';

import type SharedCode from './Shared';

interface ClientCodeProps {
  code: string;
  focusLines?: readonly number[];
  lang: BundledLanguage;
}

interface Highlighting {
  highlighter: Highlighter;
  Shared: typeof SharedCode;
}

let highlightingPromise: Promise<Highlighting> | null = null;
let loadedHighlighting: Highlighting | null = null;
const highlightingListeners = new Set<() => void>();

/** Load Shiki, its WASM, and the renderer on first use instead of with every island that shows code. */
function loadHighlighting(): Promise<Highlighting> {
  if (highlightingPromise) return highlightingPromise;

  const promise = Promise.all([
    import('./clientHighlighter').then(({ getClientHighlighter }) => getClientHighlighter()),
    import('./Shared'),
  ]).then(([highlighter, { default: Shared }]) => ({ highlighter, Shared }));

  highlightingPromise = promise;
  void promise.then((highlighting) => {
    // Record the settled value where `use()` reads it, so renders after the first load never suspend.
    Object.assign(promise, { status: 'fulfilled', value: highlighting });
    loadedHighlighting = highlighting;
    highlightingListeners.forEach((listener) => listener());
  });

  return promise;
}

let loadsOnInteraction = false;

/** Start loading once the reader interacts with the page, which is when prerendered code may start to change. */
function loadHighlightingOnInteraction(): void {
  if (loadsOnInteraction) return;

  loadsOnInteraction = true;

  for (const type of ['pointerdown', 'keydown'] as const) {
    window.addEventListener(type, () => void loadHighlighting(), { capture: true, once: true, passive: true });
  }
}

function subscribeToHighlighting(listener: () => void): () => void {
  highlightingListeners.add(listener);

  return () => highlightingListeners.delete(listener);
}

function subscribeToNothing(): () => void {
  return () => {};
}

/**
 * Uses `use()` instead of top-level `await` because top-level `await` causes Safari hydration errors when multiple
 * `client:idle` islands on the same Astro page share the module. https://github.com/withastro/astro/issues/10055
 *
 * There is deliberately no Suspense boundary here. React streams a completed boundary as a deferred `$RC(...)` script
 * once an island passes its progressive chunk size, and Astro's router runs each inline script text only once per
 * session. Revisiting a page then leaves those boundaries pending until React discards the server HTML.
 */
function ServerHighlightedCode({ code, focusLines, lang }: ClientCodeProps) {
  const { highlighter, Shared } = use(loadHighlighting());

  return <Shared code={code} focusLines={focusLines} lang={lang} highlighter={highlighter} />;
}

/**
 * Hydration adopts the server-highlighted markup without Shiki, which loads only once the code changes or the reader
 * starts interacting. Until it arrives, changed code shows as plain text instead of suspending the island.
 */
function HydratedCode({ code, focusLines, lang }: ClientCodeProps) {
  const highlighting = useSyncExternalStore(
    subscribeToHighlighting,
    () => loadedHighlighting,
    () => null
  );
  // Only hydration reads the server snapshot, so this records the code the server highlighted.
  const isHydrating = useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true
  );
  const [serverCode] = useState(isHydrating ? code : null);
  const showsServerMarkup = code === serverCode;

  useEffect(() => {
    if (highlighting) return;

    if (showsServerMarkup) loadHighlightingOnInteraction();
    else void loadHighlighting();
  }, [highlighting, showsServerMarkup]);

  if (highlighting) {
    const { highlighter, Shared } = highlighting;

    return <Shared code={code} focusLines={focusLines} lang={lang} highlighter={highlighter} />;
  }

  // Keep Shiki's server-rendered classes and tokens in place until the highlighter can reproduce them.
  if (showsServerMarkup) {
    return (
      <pre className={shared.pre} data-language={lang} suppressHydrationWarning>
        <code className={shared.codeBlock} dangerouslySetInnerHTML={{ __html: '' }} suppressHydrationWarning />
      </pre>
    );
  }

  return (
    <pre className={shared.pre} data-language={lang} suppressHydrationWarning>
      <code className={shared.codeBlock}>{code}</code>
    </pre>
  );
}

export default function ClientCode(props: ClientCodeProps) {
  return globalThis.window ? <HydratedCode {...props} /> : <ServerHighlightedCode {...props} />;
}
