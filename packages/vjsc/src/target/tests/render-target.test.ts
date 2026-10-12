import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vite-plus/test';

import { consumeRenderTarget, isRenderTargetMarker, renderTargetMarker } from '../render-target';
import { createSourceChildren, createSourceProps } from '../source';

describe('consumeRenderTarget', () => {
  it('consumes whichever render marker the props carry', () => {
    const props = sourceProps(`<Trigger ${renderTargetMarker('PlaybackRateButton')} className="a" />`);
    const consumed = consumeRenderTarget(props);

    expect(renderTargetMarker('PlaybackRateButton')).toBe('data-vjsc-render-playback-rate-button');
    expect(isRenderTargetMarker('data-vjsc-render-button')).toBe(true);
    expect(consumed?.has('className')).toBe(true);
    expect(consumed?.has(renderTargetMarker('PlaybackRateButton') as never)).toBe(false);
    expect(consumed && consumeRenderTarget(consumed)).toBeUndefined();
  });

  it('returns nothing for props without a marker', () => {
    expect(consumeRenderTarget(sourceProps(`<Trigger className="a" />`))).toBeUndefined();
  });
});

function sourceProps(code: string) {
  const statement = parseSync('fixture.tsx', code).program.body[0];
  if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'JSXElement') throw new Error();

  const node = statement.expression;

  return createSourceProps<Record<string, unknown>>(code, node.openingElement, createSourceChildren(code, node));
}
