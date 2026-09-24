import { describe, expect, it, vi } from 'vite-plus/test';

import { parseModuleId } from '../../utils/module-id';
import { createVariantReader, defineVariants } from '../variants';

interface Variant {
  readonly target: 'html' | 'react';
}

const codec = defineVariants<Variant>({
  encode: (variant) => ({ target: variant.target }),
  decode(params) {
    const target = params.get('target');
    if (target === null) return null;

    if (target !== 'html' && target !== 'react') throw new Error(`Unknown target \`${target}\`.`);

    return { target };
  },
});

describe('createVariantReader', () => {
  it('decodes each module query once', () => {
    const decode = vi.spyOn(codec, 'decode');
    const read = createVariantReader(codec);

    expect(read(parseModuleId('/a.tsx?target=react')).variant).toEqual({ target: 'react' });
    expect(read(parseModuleId('/a.tsx?target=react')).variant).toEqual({ target: 'react' });
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it('reads plain modules and foreign queries as no variant', () => {
    const read = createVariantReader(codec);

    expect(read(parseModuleId('/a.tsx')).variant).toBeNull();
    expect(read(parseModuleId('/a.svg?raw')).variant).toBeNull();
    expect(createVariantReader(undefined)(parseModuleId('/a.tsx?target=react')).variant).toBeNull();
  });

  it('lets the codec reject a query that names an invalid variant', () => {
    expect(() => createVariantReader(codec)(parseModuleId('/a.tsx?target=vue'))).toThrow('Unknown target `vue`.');
  });
});
