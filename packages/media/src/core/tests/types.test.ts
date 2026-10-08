import { describe, expect, it } from 'vite-plus/test';

import { toMediaCrossOrigin } from '../types';

describe('toMediaCrossOrigin', () => {
  it('keeps use-credentials in any ASCII case', () => {
    expect(toMediaCrossOrigin('use-credentials')).toBe('use-credentials');
    expect(toMediaCrossOrigin('USE-CREDENTIALS')).toBe('use-credentials');
    expect(toMediaCrossOrigin('Use-Credentials')).toBe('use-credentials');
  });

  it('reads anonymous, the bare attribute, and unknown keywords as anonymous', () => {
    expect(toMediaCrossOrigin('anonymous')).toBe('anonymous');
    expect(toMediaCrossOrigin('ANONYMOUS')).toBe('anonymous');
    expect(toMediaCrossOrigin('')).toBe('anonymous');
    expect(toMediaCrossOrigin('bogus')).toBe('anonymous');
  });

  it('keeps no attribute as null', () => {
    expect(toMediaCrossOrigin(null)).toBeNull();
    expect(toMediaCrossOrigin(undefined)).toBeNull();
  });
});
