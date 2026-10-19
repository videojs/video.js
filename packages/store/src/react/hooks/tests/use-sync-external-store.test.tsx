import * as React from 'react';
import { describe, expect, it } from 'vite-plus/test';

import { useSyncExternalStore } from '../use-sync-external-store';

describe('useSyncExternalStore', () => {
  it("is React's own hook when React provides one", () => {
    expect(useSyncExternalStore).toBe(React.useSyncExternalStore);
  });
});
