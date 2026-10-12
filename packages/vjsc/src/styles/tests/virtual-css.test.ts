import { describe, expect, it } from 'vite-plus/test';

import { createVirtualCssId, parseVirtualCssId } from '../virtual-css';

describe('createVirtualCssId', () => {
  it('round-trips kind and output file through the id', () => {
    const id = createVirtualCssId('asset', 'audio/buttons.css', '.a {}');

    expect(id).toMatch(/^virtual:vjsc\/css\/asset\/[0-9a-f]{12}\/audio%2Fbuttons\.css$/);
    expect(parseVirtualCssId(id)).toEqual({ kind: 'asset', fileName: 'audio/buttons.css' });
    expect(parseVirtualCssId(`\0${id}`)).toEqual({ kind: 'asset', fileName: 'audio/buttons.css' });
  });

  it('keeps an authored output named base.css distinct from the base import', () => {
    const asset = createVirtualCssId('asset', 'base.css', '.a {}');
    const base = createVirtualCssId('base', 'base.css', '.a {}');

    expect(asset).not.toBe(base);
    expect(parseVirtualCssId(asset)?.kind).toBe('asset');
    expect(parseVirtualCssId(base)?.kind).toBe('base');
  });

  it('changes when the stylesheet source changes', () => {
    expect(createVirtualCssId('asset', 'a.css', '.a {}')).not.toBe(createVirtualCssId('asset', 'a.css', '.b {}'));
  });
});

describe('parseVirtualCssId', () => {
  it('ignores other modules', () => {
    expect(parseVirtualCssId('virtual:other/css')).toBeUndefined();
    expect(parseVirtualCssId('virtual:vjsc/css/unknown/abc/a.css')).toBeUndefined();
  });
});
