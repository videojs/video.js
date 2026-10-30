/**
 * Fails when a budgeted entry's initial size grows past its budget.
 *
 * Usage: node .github/scripts/bundle-size-budget.js pr-size.json
 *
 * Reads the JSON produced by bundle-size.js and compares each entry's `size` —
 * the initial static graph, minified + brotli — against BUDGETS. Lazy dynamic
 * chunks, such as the engines LazyVideo loads once a source needs them, are
 * reported as `lazySize` and never count.
 *
 * To change a budget, edit BUDGETS below in the same PR as the growth and say
 * why in the PR description. Keep roughly 10% headroom over the measured size,
 * so the budget catches real growth rather than noise. Every budgeted entry
 * must be measured, so renaming or removing one means updating BUDGETS too.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Initial-size budgets in bytes (minified + brotli), keyed by entry name.
 *
 * The lazy media entries carry the PRD's near-zero baseline promise: a few KB
 * on top of the player, with every engine left to a lazy chunk.
 */
export const BUDGETS = {
  '@videojs/html/media/lazy-audio': 3200,
  '@videojs/html/media/lazy-video': 3700,
  '@videojs/react/media/lazy-audio': 3100,
  '@videojs/react/media/lazy-video': 3500,
};

/**
 * Compare measured entries against budgets. Returns one result per budget,
 * with `size` undefined when the entry wasn't measured.
 */
export function checkBudgets(entries, budgets = BUDGETS) {
  const sizes = new Map(entries.map((entry) => [entry.name, entry.size]));

  return Object.entries(budgets).map(([name, budget]) => {
    const size = sizes.get(name);
    return { name, size, budget, ok: size !== undefined && size <= budget };
  });
}

function formatResult({ name, size, budget, ok }) {
  if (size === undefined) return `✗ ${name}: not measured`;

  return `${ok ? '✓' : '✗'} ${name}: ${size} B of ${budget} B`;
}

function main() {
  const path = process.argv[2];

  if (!path) {
    console.error('Usage: node bundle-size-budget.js <size.json>');
    process.exit(1);
  }

  const results = checkBudgets(JSON.parse(readFileSync(path, 'utf8')));

  for (const result of results) console.log(formatResult(result));

  if (results.some((result) => !result.ok)) {
    console.error(
      '\nSize budget exceeded. Shrink the entry, or raise its budget in ' +
        '.github/scripts/bundle-size-budget.js and explain why in the PR.',
    );
    process.exit(1);
  }
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) main();
