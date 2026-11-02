import getReadingTime from 'reading-time';
import type { MdastPluginInput } from 'satteri';
import { defineMdastPlugin } from 'satteri';

import { getAstroFrontmatter } from './satteriAstroData';

/**
 * Calculates reading time and injects it into the Astro frontmatter bag for templates (read via
 * `remarkPluginFrontmatter`).
 *
 * Returned as a factory so the text accumulator resets per document. Visitors only collect text; the reading time is
 * computed once in `after`, because recomputing it on every literal node is quadratic in document length.
 */
export function satteriReadingTime(): MdastPluginInput {
  return () => {
    const chunks: string[] = [];
    const accumulate = (node: { value: string }) => {
      chunks.push(node.value);
    };

    return defineMdastPlugin({
      name: 'astro-reading-time',
      text: accumulate,
      inlineCode: accumulate,
      code: accumulate,
      after: (_root, ctx) => {
        const frontmatter = getAstroFrontmatter(ctx);
        if (!frontmatter || chunks.length === 0) return;

        const readingTime = getReadingTime(chunks.join(' '));

        frontmatter.minutesRead = readingTime.text;
        frontmatter.readingTimeMinutes = readingTime.minutes;
      },
    });
  };
}
