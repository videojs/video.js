import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { useSafeId } from '../use-safe-id';

// React 16 and 17 have no `useId`. Remove it so the fallback runs on the React 19 test renderer.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useId: undefined,
}));

function Probe({ prefix, onId }: { prefix?: string; onId: (id: string) => void }) {
  onId(useSafeId(prefix));
  return null;
}

afterEach(() => {
  cleanup();
});

describe('useSafeId', () => {
  it('falls back to a CSS-safe id without React useId', () => {
    const ids: string[] = [];

    render(<Probe prefix="anchor" onId={(id) => ids.push(id)} />);

    // React's own ids keep underscores after sanitizing (`_r_1_`); the fallback counter does not.
    expect(ids[0]).toMatch(/^anchor-r\d+$/);
  });

  it('keeps the fallback id stable per instance and distinct across instances', () => {
    const first: string[] = [];
    const second: string[] = [];

    const { rerender } = render(
      <>
        <Probe onId={(id) => first.push(id)} />
        <Probe onId={(id) => second.push(id)} />
      </>
    );

    rerender(
      <>
        <Probe onId={(id) => first.push(id)} />
        <Probe onId={(id) => second.push(id)} />
      </>
    );

    expect(new Set(first).size).toBe(1);
    expect(new Set(second).size).toBe(1);
    expect(first[0]).not.toBe(second[0]);
  });
});
