import { describe, expect, it } from 'vite-plus/test';

import { crossOriginToRequestCredentials } from '../request-credentials';

describe('crossOriginToRequestCredentials', () => {
  it('maps use-credentials to include', () => {
    expect(crossOriginToRequestCredentials('use-credentials')).toBe('include');
  });

  it('leaves the platform default for anonymous', () => {
    expect(crossOriginToRequestCredentials('anonymous')).toBeUndefined();
  });

  it('leaves the platform default when the element is not in CORS mode', () => {
    expect(crossOriginToRequestCredentials(null)).toBeUndefined();
    expect(crossOriginToRequestCredentials(undefined)).toBeUndefined();
  });
});
