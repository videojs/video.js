import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { loadDesignSystem } from '../design-system';
import { assertCompositionOrder } from '../precedence';
import type { ResolvedStyleRule } from '../resolved';

const designPath = resolve(import.meta.dirname, 'fixtures/tailwind.css');

describe('assertCompositionOrder', () => {
  const surface = rule('media-popup-surface', 'popups.css', ['bg-black', 'text-white']);
  const thumbnail = rule('media-thumbnail', 'sliders.css', ['bg-white', 'overflow-hidden']);
  const preview = rule('media-preview', 'sliders.css', ['absolute']);

  it('rejects a later composed rule emitted before the rule it overrides', async () => {
    const design = await loadDesignSystem(designPath);

    expect(() =>
      assertCompositionOrder({
        design,
        rules: [surface, thumbnail],
        compositions: [{ classNames: ['media-popup-surface', 'media-thumbnail'], pos: 12 }],
        order: ['sliders.css', 'popups.css'],
      })
    ).toThrow(/`\.media-thumbnail` is composed after `\.media-popup-surface`.*`background-color`/);
  });

  it('accepts overrides the declared order emits later', async () => {
    const design = await loadDesignSystem(designPath);

    expect(() =>
      assertCompositionOrder({
        design,
        rules: [surface, thumbnail],
        compositions: [{ classNames: ['media-popup-surface', 'media-thumbnail'], pos: 12 }],
        order: ['popups.css', 'sliders.css'],
      })
    ).not.toThrow();
  });

  it('accepts inverted compositions whose rules set different properties', async () => {
    const design = await loadDesignSystem(designPath);

    expect(() =>
      assertCompositionOrder({
        design,
        rules: [surface, preview],
        compositions: [{ classNames: ['media-popup-surface', 'media-preview'], pos: 0 }],
        order: ['sliders.css', 'popups.css'],
      })
    ).not.toThrow();
  });

  it('rejects overrides within one file that sort before the rule they override', async () => {
    const design = await loadDesignSystem(designPath);
    const later = rule('media-a', 'sliders.css', ['bg-red-500']);
    const earlier = rule('media-z', 'sliders.css', ['bg-blue-500']);

    expect(() =>
      assertCompositionOrder({
        design,
        rules: [earlier, later],
        compositions: [{ classNames: ['media-z', 'media-a'], pos: 0 }],
      })
    ).toThrow('both are emitted to `sliders.css`');
  });

  it('accepts compositions whose rules style attribute states no element can be in at once', async () => {
    const design = await loadDesignSystem(designPath);
    const closed = rule('media-z-closed', 'states.css', ['data-[state=closed]:bg-red-500']);
    const open = rule('media-a-open', 'states.css', ['data-[state=open]:bg-blue-500']);
    const pip = rule('media-z-pip', 'states.css', ['data-[pip]:bg-red-500']);
    const inline = rule('media-a-inline', 'states.css', ['not-data-[pip]:bg-blue-500']);
    const presentAfter = rule('media-z-closed-present', 'states.css', [
      '[&[data-state=closed][data-state]]:bg-red-500',
    ]);
    const presentBefore = rule('media-z-present-closed', 'states.css', [
      '[&[data-state][data-state=closed]]:bg-red-500',
    ]);

    expect(() =>
      assertCompositionOrder({
        design,
        rules: [closed, open, pip, inline, presentAfter, presentBefore],
        compositions: [
          { classNames: ['media-z-closed', 'media-a-open'], pos: 0 },
          { classNames: ['media-z-pip', 'media-a-inline'], pos: 0 },
          { classNames: ['media-z-closed-present', 'media-a-open'], pos: 0 },
          { classNames: ['media-z-present-closed', 'media-a-open'], pos: 0 },
        ],
      })
    ).not.toThrow();
  });

  it('rejects compositions whose attribute states can hold together', async () => {
    const design = await loadDesignSystem(designPath);
    const open = rule('media-z-open', 'states.css', ['data-[state=open]:bg-red-500']);
    const expanded = rule('media-a-expanded', 'states.css', ['aria-expanded:bg-blue-500']);

    expect(() =>
      assertCompositionOrder({
        design,
        rules: [open, expanded],
        compositions: [{ classNames: ['media-z-open', 'media-a-expanded'], pos: 0 }],
      })
    ).toThrow('both are emitted to `states.css`');
  });

  it('treats a shorthand as overlapping its longhands', async () => {
    const design = await loadDesignSystem(designPath);
    const padding = rule('media-padding', 'b.css', ['p-2']);
    const inline = rule('media-inline', 'a.css', ['px-4']);

    expect(() =>
      assertCompositionOrder({
        design,
        rules: [padding, inline],
        compositions: [{ classNames: ['media-padding', 'media-inline'], pos: 0 }],
      })
    ).toThrow('`padding');
  });
});

function rule(className: string, file: string, utilities: readonly string[]): ResolvedStyleRule {
  return {
    modulePath: 'test.styles.ts',
    tokenPath: [className],
    className,
    file,
    layer: 'components',
    scopeRoot: false,
    shadowHost: false,
    utilityGroups: utilities,
    utilities,
    variantGroups: {},
    variants: {},
  };
}
