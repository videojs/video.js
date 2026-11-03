/**
 * Header-level text-segment metadata — the `X-TIMESTAMP-MAP` correlation scraped from a VTT segment's raw bytes.
 * DOM-free (a plain fetch + regex parse): the native `<track>` parser in `media/dom/text` (`resolveVttSegment`)
 * discards this header, so a caller that needs it (e.g. non-zero-PTS relocation) fetches the bytes itself.
 */
import { parseVttTimestampMap, type TimestampMap } from './parse-vtt-timestamp-map';

/**
 * Header-level metadata for a text segment, surfaced alongside its cues. Each field is present only when the segment
 * declared it.
 */
export interface TextSegmentMetadata {
  timestampMap?: TimestampMap;
}

/**
 * Fetch a VTT segment and scrape only its header metadata (no cue parsing).
 *
 * The native `<track>` parser (`media/dom/text`'s `resolveVttSegment`) discards `X-TIMESTAMP-MAP`, so reading it
 * requires the raw bytes. This is a separate, caller-controlled fetch — the caller decides _when_ metadata is needed
 * (e.g. once per source) rather than paying for it on every segment. `credentials` is the mode the engine's request
 * policy resolved for the segment.
 */
export async function resolveVttSegmentMetadata(
  url: string,
  { credentials }: { credentials?: RequestCredentials | undefined } = {}
): Promise<TextSegmentMetadata> {
  const text = await fetch(url, { credentials }).then((response) => response.text());

  return { timestampMap: parseVttTimestampMap(text) };
}
