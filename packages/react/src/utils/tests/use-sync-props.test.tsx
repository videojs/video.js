import { act, cleanup, render, renderHook } from '@testing-library/react';
import { type ReactNode, startTransition, Suspense, useState } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { useSyncProps } from '../use-sync-props';

afterEach(cleanup);

interface TargetProps {
  src: string;
  volume: number | undefined;
}

const defaults: TargetProps = { src: '', volume: 1 };

describe('useSyncProps', () => {
  it('writes props onto the target and returns the rest', () => {
    const target: TargetProps = { ...defaults };

    const { result } = renderHook(({ props }) => useSyncProps(target, props, defaults), {
      initialProps: { props: { src: 'video.mp4', id: 'player' } },
    });

    expect(target.src).toBe('video.mp4');
    expect(result.current).toEqual({ id: 'player' });
  });

  it('resets props back to defaults when they change to undefined on a re-render', () => {
    const target: TargetProps = { ...defaults };

    const { rerender } = renderHook(({ props }) => useSyncProps(target, props, defaults), {
      initialProps: { props: { volume: 0.5 } as Partial<TargetProps> },
    });

    expect(target.volume).toBe(0.5);

    rerender({ props: { volume: undefined } });

    expect(target.volume).toBe(1);
  });

  it('treats undefined like an absent prop and never touches unsynced target values', () => {
    const target: TargetProps = { ...defaults, volume: 0.5 };

    renderHook(() => useSyncProps(target, { volume: undefined }, defaults));

    expect(target.volume).toBe(0.5);
  });

  it('does not let an undefined prop wipe a value derived from another prop', () => {
    // Mirrors MuxVideoAdapter: setting `source` derives `src`, resetting `src` clears `source`.
    const derivedDefaults: { src: string | undefined; source: { id: string } | null } = { src: '', source: null };
    const target = {
      _src: '' as string | undefined,
      _source: null as { id: string } | null,
      get src() {
        return this._src;
      },
      set src(value: string | undefined) {
        this._src = value;
        this._source = value ? { id: value } : null;
      },
      get source() {
        return this._source;
      },
      set source(value: { id: string } | null) {
        this._source = value;
        this._src = value ? value.id : '';
      },
    };

    // `source` before `src` in key order — the reset must not run after it applies.
    renderHook(() => useSyncProps(target, { source: { id: 'abc' }, src: undefined }, derivedDefaults));

    expect(target.source).toEqual({ id: 'abc' });
    expect(target.src).toBe('abc');
  });

  it('resets props back to defaults when they are omitted on a re-render', () => {
    const target: TargetProps = { ...defaults };

    const { rerender } = renderHook(({ props }) => useSyncProps(target, props, defaults), {
      initialProps: { props: { src: 'video.mp4', volume: 0.5 } as Partial<TargetProps> },
    });

    expect(target.volume).toBe(0.5);

    rerender({ props: { src: 'video.mp4' } });

    expect(target.volume).toBe(1);
    expect(target.src).toBe('video.mp4');
  });

  it('does not touch target values that were never passed as props', () => {
    const target: TargetProps = { ...defaults, volume: 0.5 };

    const { rerender } = renderHook(({ props }) => useSyncProps(target, props, defaults), {
      initialProps: { props: { src: 'video.mp4' } as Partial<TargetProps> },
    });

    rerender({ props: { src: 'video.mp4' } });

    // `volume` was set outside of props; omitting it from props never resets it.
    expect(target.volume).toBe(0.5);
  });

  it('configures the target on the first render, before ref callbacks attach it', () => {
    const target: TargetProps = { ...defaults };
    let srcAtAttach: string | undefined;

    function Media({ src }: { src: string }): ReactNode {
      useSyncProps(target, { src }, defaults);
      return <video ref={(el) => void (el && (srcAtAttach = target.src))} />;
    }

    render(<Media src="video.mp4" />);

    expect(srcAtAttach).toBe('video.mp4');
  });

  it('writes updated props when the render commits, not while it renders', () => {
    const target: TargetProps = { ...defaults };
    const srcDuringRender: string[] = [];
    let setSrc!: (src: string) => void;

    function Media(): ReactNode {
      const [src, set] = useState('a.mp4');

      setSrc = set;
      useSyncProps(target, { src }, defaults);
      srcDuringRender.push(target.src);

      return null;
    }

    render(<Media />);
    act(() => setSrc('b.mp4'));

    // The update rendered while the target still held the committed source.
    expect(srcDuringRender.at(-1)).toBe('a.mp4');
    expect(target.src).toBe('b.mp4');
  });

  it('leaves the target on its committed props when a transition never commits', async () => {
    const target: TargetProps = { ...defaults };
    const never = new Promise<never>(() => {});
    let rendered = '';
    let show!: (next: { src: string; suspend: boolean }) => void;

    function Suspend(): ReactNode {
      throw never;
    }

    function Media({ src }: { src: string }): ReactNode {
      useSyncProps(target, { src }, defaults);
      rendered = src;
      return null;
    }

    function Tree(): ReactNode {
      const [state, set] = useState({ src: 'a.mp4', suspend: false });

      show = set;

      return (
        <Suspense fallback={null}>
          <Media src={state.src} />
          {state.suspend && <Suspend />}
        </Suspense>
      );
    }

    render(<Tree />);

    // The transition renders the new source, then suspends, so React keeps showing the committed tree.
    await act(async () => startTransition(() => show({ src: 'b.mp4', suspend: true })));

    expect(rendered).toBe('b.mp4');
    expect(target.src).toBe('a.mp4');
  });
});
