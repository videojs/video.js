import type { MarkdownHeading } from 'astro';
import { useMemo } from 'react';

import { TableOfContentsDesktop } from './TableOfContents.desktop';
import { TableOfContentsMobile } from './TableOfContents.mobile';
import { filterHeadingsForToc, navigateToHeading, useActiveHeading, useRenderedHeadings } from './utils';

interface TableOfContentsProps {
  headings: MarkdownHeading[];
  /** Use the popover rail at every width, for pages without a docs sidebar or a TOC column. */
  railOnly?: boolean;
}

export function TableOfContents({ headings, railOnly = false }: TableOfContentsProps) {
  const filteredHeadings = useMemo(() => filterHeadingsForToc(headings), [headings]);
  const renderedHeadings = useRenderedHeadings(filteredHeadings);
  const activeId = useActiveHeading(renderedHeadings);

  // A standalone rail with one entry adds chrome without navigation.
  if (renderedHeadings.length < (railOnly ? 2 : 1)) {
    // Astro SSR logs false "Invalid hook call" when a React component with hooks returns null. See withastro/astro#12283.
    // oxlint-disable-next-line react/jsx-no-useless-fragment
    return <></>;
  }

  if (railOnly) {
    return (
      <TableOfContentsMobile headings={renderedHeadings} activeId={activeId} onNavigate={navigateToHeading} railOnly />
    );
  }

  return (
    <>
      <TableOfContentsMobile
        headings={renderedHeadings}
        activeId={activeId}
        onNavigate={navigateToHeading}
        className="xl:hidden"
      />
      <TableOfContentsDesktop
        headings={renderedHeadings}
        activeId={activeId}
        onNavigate={navigateToHeading}
        className="hidden xl:block"
      />
    </>
  );
}
