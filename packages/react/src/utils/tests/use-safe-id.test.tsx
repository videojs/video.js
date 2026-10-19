import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { useSafeId } from '../use-safe-id';

function Probe({ prefix, onId }: { prefix?: string; onId: (id: string) => void }) {
  onId(useSafeId(prefix));
  return null;
}

afterEach(() => {
  cleanup();
});

describe('useSafeId', () => {
  it('strips characters that are invalid in CSS identifiers', () => {
    const ids: string[] = [];

    render(<Probe onId={(id) => ids.push(id)} />);

    expect(ids[0]).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it('prepends the prefix', () => {
    const ids: string[] = [];

    render(<Probe prefix="anchor" onId={(id) => ids.push(id)} />);

    expect(ids[0]).toMatch(/^anchor-[a-zA-Z0-9_-]+$/);
  });

  it('returns a stable id per instance and distinct ids across instances', () => {
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
