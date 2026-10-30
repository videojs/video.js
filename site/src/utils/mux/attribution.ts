import { getLinkDestination } from '@/components/typography/linkDestination';

/** The campaign every link to Mux carries, so Mux's own analytics can credit visits and signups to Video.js. */
const MUX_CAMPAIGN = { utm_source: 'videojs', utm_campaign: 'vjs10' } as const;

/**
 * Where on videojs.org a Mux link sits, sent as `utm_content`. Chrome placements reuse the analytics `location` names;
 * links written in content share one value per section.
 */
export type MuxPlacement =
  | 'hero'
  | 'footer'
  | 'footer-docs'
  | 'sponsors'
  | 'mux-uploader'
  | 'error-page'
  | 'support-page'
  | 'help-page'
  | 'html5-video-support-page'
  | 'docs-content'
  | 'blog-content';

/**
 * Tag a link to a Mux page with the Video.js campaign and its placement. Tags the link already has are kept, and any
 * other href, including Mux media URLs, is returned as is.
 */
export function withMuxAttribution(href: string, placement: MuxPlacement): string {
  if (getLinkDestination(href) !== 'mux') return href;

  const url = new URL(href);

  for (const [name, value] of Object.entries({ ...MUX_CAMPAIGN, utm_content: placement })) {
    if (!url.searchParams.has(name)) url.searchParams.set(name, value);
  }

  return url.href;
}

/** Standalone pages that pitch Mux to their own audience, so their links are credited apart from the docs. */
const PAGE_PLACEMENTS = new Map<string, MuxPlacement>([
  ['/help', 'help-page'],
  ['/html5-video-support', 'html5-video-support-page'],
]);

/** The placement for a Mux link written in page content. */
export function contentPlacement(pathname: string): MuxPlacement {
  const page = PAGE_PLACEMENTS.get(pathname.replace(/\/$/, ''));
  if (page) return page;

  return pathname.startsWith('/blog') ? 'blog-content' : 'docs-content';
}
