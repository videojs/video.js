import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { defaultConfig } from 'cn/config';
import { describe, expect, test } from 'vite-plus/test';

import { cn } from '../utils';

/** A stock utility from each merge theme group, paired with the utility prefix that reads that group. */
const stockUtilities: Record<string, { prefix: string; stock: string }> = {
  blur: { prefix: 'blur', stock: 'blur-sm' },
  color: { prefix: 'text', stock: 'text-red-500' },
  container: { prefix: 'max-w', stock: 'max-w-sm' },
  'drop-shadow': { prefix: 'drop-shadow', stock: 'drop-shadow-sm' },
  radius: { prefix: 'rounded', stock: 'rounded-sm' },
  shadow: { prefix: 'shadow', stock: 'shadow-sm' },
  spacing: { prefix: 'p', stock: 'p-2' },
  text: { prefix: 'text', stock: 'text-sm' },
  'text-shadow': { prefix: 'text-shadow', stock: 'text-shadow-sm' },
};

describe('cn', () => {
  test('keeps a media text color when a media font size follows it', () => {
    expect(cn('bg-media-popover text-media-popover-foreground', 'py-1 text-media px-2')).toBe(
      'bg-media-popover text-media-popover-foreground py-1 text-media px-2'
    );
    expect(cn('text-media-sm', 'text-media-muted-foreground')).toBe('text-media-sm text-media-muted-foreground');
  });

  test('lets later color and size utilities override media ones', () => {
    expect(cn('text-media-popover-foreground text-media', 'text-white')).toBe('text-media text-white');
    expect(cn('text-media-popover-foreground text-media', 'text-sm')).toBe('text-media-popover-foreground text-sm');
  });

  test('merges every media theme key the Tailwind theme declares', async () => {
    const source = await readFile(resolve(import.meta.dirname, '../styles/tailwind.css'), 'utf8');
    const mergeGroups = new Set(Object.keys(defaultConfig().theme));
    const keys = [...source.matchAll(/^\s*--([a-z-]+?)-(media(?:-[a-z0-9-]+)?):/gm)]
      .map(([, group, key]) => [group!, key!] as const)
      .filter(([group]) => mergeGroups.has(group));

    expect(keys.length).toBeGreaterThan(40);

    for (const [group, key] of keys) {
      const { prefix, stock } = stockUtilities[group] ?? { prefix: group, stock: `missing stock utility for ${group}` };

      expect(cn(stock, `${prefix}-${key}`), `${group}: ${key}`).toBe(`${prefix}-${key}`);
    }
  });
});
