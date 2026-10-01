import { DocSearch } from '@docsearch/react';
import { useStore } from '@nanostores/react';
import clsx from 'clsx';

import { GITHUB_REPO_URL } from '@/consts';
import {
  DOCSEARCH_API_KEY,
  DOCSEARCH_APP_ID,
  DOCSEARCH_BLOG_INDEX,
  DOCSEARCH_CHANGELOG_INDEX,
  DOCSEARCH_DOCS_INDEX,
} from '@/search.config';
import { currentFramework } from '@/stores/preferences';

interface SearchProps {
  className?: string;
}

export default function Search({ className }: SearchProps) {
  const framework = useStore(currentFramework);

  // A flex wrapper keeps the button's box on whole pixels; an inline strut would add a half-pixel line box. The trigger
  // is a compact field beside the mobile menu button, collapses to an icon while the desktop links share a narrow nav,
  // and takes its full 180px from `lg` up (see the matching breakpoints in `docsearch.css`).
  // DocSearch portals its modal to `document.body`, so only the trigger inherits the wrapper's analytics location.
  return (
    <div
      className={clsx('flex min-w-0 sm:w-full sm:max-w-36 md:w-auto md:max-w-none lg:w-full lg:max-w-45', className)}
      data-ph-capture-attribute-location="search"
    >
      <DocSearch
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
        translations={{
          button: { buttonText: 'Search...', buttonAriaLabel: 'Search documentation' },
        }}
        getMissingResultsUrl={({ query }) =>
          `${GITHUB_REPO_URL}issues/new?title=${encodeURIComponent(`Search: no results for "${query}"`)}&labels=search`
        }
      />
    </div>
  );
}
