import { DocSearchButton } from '@docsearch/react/button';
import type { DocSearchModal as DocSearchModalComponent } from '@docsearch/react/modal';
import { useDocSearchKeyboardEvents } from '@docsearch/react/useDocSearchKeyboardEvents';
import { useStore } from '@nanostores/react';
import clsx from 'clsx';
import { debounce, noop } from 'es-toolkit/function';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { GITHUB_REPO_URL } from '@/consts';
import {
  DOCSEARCH_API_KEY,
  DOCSEARCH_APP_ID,
  DOCSEARCH_BLOG_INDEX,
  DOCSEARCH_CHANGELOG_INDEX,
  DOCSEARCH_DOCS_INDEX,
} from '@/search.config';
import { currentFramework } from '@/stores/preferences';
import { ANALYTICS_EVENTS, reportableSearchQuery, trackEvent } from '@/utils/analytics-events';

let reportedQuery = '';

// DocSearch builds this URL while rendering the no-results screen, once per keystroke. Waiting for typing to settle
// reports the query the reader stopped on, not every prefix of it, and only if the screen still shows no results for
// it: a longer query may have found some since.
export const reportNoResults = debounce((input: string) => {
  const searchInput = document.querySelector<HTMLInputElement>('.DocSearch-Input');
  if (!document.querySelector('.DocSearch-NoResults') || searchInput?.value !== input) return;

  const query = reportableSearchQuery(input);
  if (!query || query === reportedQuery) return;

  reportedQuery = query;
  trackEvent(ANALYTICS_EVENTS.searchNoResults, { query });
}, 1000);

function missingResultsUrl({ query }: { query: string }): string {
  reportNoResults(query);

  return `${GITHUB_REPO_URL}issues/new?title=${encodeURIComponent(`Search: no results for "${query}"`)}&labels=search`;
}

// The modal and its Algolia client are most of DocSearch's weight but only matter once a reader searches. Load them on
// the first sign of intent rather than with the trigger, which every page hydrates.
let modalPromise: Promise<typeof DocSearchModalComponent> | undefined;

function loadModal() {
  modalPromise ??= import('@docsearch/react/modal').then((module) => module.DocSearchModal);
  return modalPromise;
}

// A failed preload surfaces when the reader opens the modal.
function preloadModal() {
  loadModal().catch(noop);
}

// Browsers cache a failed module import, so a reload is the only way to fetch the modal again.
function reloadPage() {
  window.location.reload();
}

// Ask AI is not configured, so the modal never toggles it.
function ignoreAskAiToggle() {}

interface SearchProps {
  className?: string;
}

export default function Search({ className }: SearchProps) {
  const framework = useStore(currentFramework);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [DocSearchModal, setDocSearchModal] = useState<typeof DocSearchModalComponent>();
  const [isOpen, setIsOpen] = useState(false);

  function open() {
    loadModal().then((modal) => {
      setDocSearchModal(() => modal);
      setIsOpen(true);
    }, reloadPage);
  }

  function close() {
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen: open,
    onClose: close,
    isAskAiActive: false,
    onAskAiToggle: ignoreAskAiToggle,
  });

  // A flex wrapper keeps the button's box on whole pixels; an inline strut would add a half-pixel line box. The trigger
  // is a compact field beside the mobile menu button, collapses to an icon while the desktop links share a narrow nav,
  // and takes its full 180px from `lg` up (see the matching breakpoints in `docsearch.css`).
  // DocSearch portals its modal to `document.body`, so only the trigger inherits the wrapper's analytics location.
  return (
    <div
      className={clsx('flex min-w-0 sm:w-full sm:max-w-36 md:w-auto md:max-w-none lg:w-full lg:max-w-45', className)}
      data-ph-capture-attribute-location="search"
    >
      <DocSearchButton
        ref={buttonRef}
        translations={{ buttonText: 'Search...', buttonAriaLabel: 'Search documentation' }}
        onClick={open}
        onFocus={preloadModal}
        onPointerEnter={preloadModal}
        onTouchStart={preloadModal}
      />
      {isOpen &&
        DocSearchModal &&
        createPortal(
          <DocSearchModal
            appId={DOCSEARCH_APP_ID}
            apiKey={DOCSEARCH_API_KEY}
            indices={[
              {
                name: DOCSEARCH_DOCS_INDEX,
                searchParameters: {
                  facetFilters: framework ? [`framework:${framework}`] : [],
                },
              },
              {
                name: DOCSEARCH_BLOG_INDEX,
              },
              {
                name: DOCSEARCH_CHANGELOG_INDEX,
              },
            ]}
            initialScrollY={window.scrollY}
            onClose={close}
            onAskAiToggle={ignoreAskAiToggle}
            getMissingResultsUrl={missingResultsUrl}
          />,
          document.body
        )}
    </div>
  );
}
