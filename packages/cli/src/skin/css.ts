import { isString } from '@videojs/utils/predicate';

import type { CssTree } from './registry';

function serializeBlock(tree: CssTree, depth: number): string[] {
  const indent = '  '.repeat(depth);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(tree)) {
    if (isString(value)) {
      lines.push(`${indent}${key}: ${value};`);
    } else if (Object.keys(value).length === 0) {
      // Shadcn writes an empty block as a statement, which is how Tailwind's `@slot` is declared.
      lines.push(`${indent}${key};`);
    } else {
      lines.push(`${indent}${key} {`, ...serializeBlock(value, depth + 1), `${indent}}`);
    }
  }

  return lines;
}

/** Serialize registry `css` rules, such as `@utility` and `@custom-variant`, the way `shadcn add` writes them. */
export function serializeCss(tree: CssTree): string {
  return Object.entries(tree)
    .map(([key, value]) => serializeBlock({ [key]: value }, 0).join('\n'))
    .join('\n\n');
}

/**
 * The Tailwind entry stylesheet for a React + Tailwind skin: the import, the skin's theme, and its utilities. It only
 * scans the skin, so the workbench's own classes stay out of the preview.
 */
export function tailwindStylesheet(themeVars: ReadonlyMap<string, string>, css: CssTree): string {
  const sections = ['@import "tailwindcss" source(none);\n\n@source "./";'];

  if (themeVars.size > 0) {
    const vars = [...themeVars].map(([name, value]) => `  --${name}: ${value};`);

    sections.push(['@theme inline {', ...vars, '}'].join('\n'));
  }

  if (Object.keys(css).length > 0) sections.push(serializeCss(css));

  return `${sections.join('\n\n')}\n`;
}
