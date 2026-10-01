import type { Text } from '@videojs/core/i18n';
import { escapeHtml } from '@videojs/utils/string';

/**
 * Render a text descriptor as keyed media-text markup.
 *
 * @internal
 */
export function renderText(text: Text, attrs?: Record<string, string>): string {
  const attrText = Object.entries(attrs ?? {})
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join('');

  return `<media-text token="${escapeHtml(text.key)}"${attrText}>${escapeHtml(text.text)}</media-text>`;
}
