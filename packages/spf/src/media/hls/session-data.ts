import type { SessionDataEntry } from '../types';
import { type AttributeList, matchTag } from './parse-attributes';
import { resolveUrl } from './resolve-url';

/**
 * Read one `#EXT-X-SESSION-DATA` tag's attributes as a {@link SessionDataEntry}, its `URI` resolved against `baseUrl`.
 * `undefined` for a tag missing `DATA-ID` or carrying neither `VALUE` nor `URI`.
 */
export function parseSessionData(attributes: AttributeList, baseUrl: string): SessionDataEntry | undefined {
  const dataId = attributes.get('DATA-ID');
  const value = attributes.get('VALUE');
  const uri = attributes.get('URI');
  // A tag MUST carry DATA-ID and exactly one of VALUE / URI.
  if (!dataId || (value === undefined && uri === undefined)) return undefined;

  const language = attributes.get('LANGUAGE');
  const entry: SessionDataEntry = { dataId };

  if (value !== undefined) entry.value = value;

  if (uri !== undefined) {
    entry.uri = resolveUrl(uri, baseUrl);
    entry.format = attributes.get('FORMAT') === 'RAW' ? 'RAW' : 'JSON';
  }

  if (language) entry.language = language;

  return entry;
}

/**
 * The `URI` of the first `#EXT-X-SESSION-DATA` tag carrying `dataId` by reference, resolved against `baseUrl` — the
 * entry `getSessionData` callers pick from a parsed presentation, read straight from playlist text for a player that
 * never parses the rest. An entry carrying its datum inline as `VALUE` is skipped. Throws when the URI cannot be
 * resolved, as the multivariant parser does.
 */
export function findSessionDataUri(playlist: string, dataId: string, baseUrl: string): string | undefined {
  for (const line of playlist.split(/\r?\n/)) {
    const attributes = matchTag(line.trim(), 'EXT-X-SESSION-DATA');
    const entry = attributes && parseSessionData(attributes, baseUrl);
    if (entry?.dataId === dataId && entry.uri) return entry.uri;
  }

  return undefined;
}
