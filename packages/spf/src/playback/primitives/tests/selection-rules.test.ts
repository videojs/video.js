/**
 * The rule-chain composers, tested pure — no signals, no behavior, no engine.
 *
 * The two differ in exactly three ways, and each is asserted here: a rule that matches nothing falls through while a
 * constraint's empty result stands, a rule chain bails at one survivor while every constraint always runs, and
 * constraint order can't change the outcome while rule order can.
 */
import { describe, expect, it, vi } from 'vite-plus/test';

import { applyConstraints, applyRules, excludeUnplayableTracks, type SelectionRule } from '../selection-rules';

// ============================================================================
// applyRules — the rule-chain composer (pure; no signals)
// ============================================================================

describe('applyRules', () => {
  const track = (id: string) => ({ id });
  const all = [track('a'), track('b'), track('c')];

  const noDeps = { state: {}, context: {}, config: {} };

  it('applies rules in order; the pick is the first survivor', () => {
    const reverse: SelectionRule<{ id: string }> = (tracks) => [...tracks].reverse();
    const takeTwo: SelectionRule<{ id: string }> = (tracks) => tracks.slice(0, 2);
    const result = applyRules([reverse, takeTwo], all, noDeps);

    expect(result.map((t) => t.id)).toEqual(['c', 'b']);
  });

  it('skips a rule that returns nothing (fall-through), keeping the prior set', () => {
    const matchNone: SelectionRule<{ id: string }> = () => [];
    const result = applyRules([matchNone], all, noDeps);

    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('stops at one survivor and does not run later rules (early-bail)', () => {
    const toA: SelectionRule<{ id: string }> = (tracks) => tracks.filter((t) => t.id === 'a');
    let laterCalled = false;
    const later: SelectionRule<{ id: string }> = (tracks) => {
      laterCalled = true;
      return tracks;
    };
    const result = applyRules([toA, later], all, noDeps);

    expect(result.map((t) => t.id)).toEqual(['a']);
    expect(laterCalled).toBe(false);
  });

  it('passes the candidate list and deps (state, context, config) through to each rule', () => {
    const deps = { state: { marker: 1 }, context: { other: 2 }, config: { tuning: 3 } };
    let received: unknown[] = [];
    const rule: SelectionRule<{ id: string }, typeof deps.state, typeof deps.context, typeof deps.config> = (
      tracks,
      ruleDeps
    ) => {
      received = [tracks, ruleDeps];
      return tracks;
    };

    applyRules([rule], all, deps);
    expect(received).toEqual([all, deps]);
  });
});

// ============================================================================
// applyConstraints — the hard-constraints pre-pass (pure; no signals)
// ============================================================================

describe('applyConstraints', () => {
  const track = (id: string) => ({ id });
  const all = [track('a'), track('b'), track('c')];
  const noDeps = { state: {}, context: {}, config: {} };

  const noA: SelectionRule<{ id: string }> = (tracks) => tracks.filter((t) => t.id !== 'a');
  const noC: SelectionRule<{ id: string }> = (tracks) => tracks.filter((t) => t.id !== 'c');

  it('removes what each constraint excludes (pooled)', () => {
    expect(applyConstraints([noA, noC], all, noDeps).map((t) => t.id)).toEqual(['b']);
  });

  it('is order-independent', () => {
    expect(applyConstraints([noA, noC], all, noDeps)).toEqual(applyConstraints([noC, noA], all, noDeps));
  });

  it('preserves an empty result — no fall-through, unlike applyRules', () => {
    const none: SelectionRule<{ id: string }> = () => [];

    expect(applyConstraints([none], all, noDeps)).toEqual([]);
  });

  it('runs every constraint — no early-bail at a single survivor', () => {
    const toA: SelectionRule<{ id: string }> = (tracks) => tracks.filter((t) => t.id === 'a');
    let laterCalled = false;
    const later: SelectionRule<{ id: string }> = (tracks) => {
      laterCalled = true;
      return tracks;
    };

    applyConstraints([toA, later], all, noDeps);
    expect(laterCalled).toBe(true);
  });
});

// ============================================================================
// excludeUnplayableTracks — the capability constraint (pure; no DOM probe)
// ============================================================================

describe('excludeUnplayableTracks', () => {
  const track = (id: string, codec: string) => ({ id, mimeType: 'video/mp4', codecs: [codec] });
  const all = [track('a', 'ok.1'), track('b', 'bad.1'), track('c', 'ok.2')];

  it('passes everything through when the config wires no probe', () => {
    expect(excludeUnplayableTracks(all, { state: {}, context: {}, config: {} })).toEqual([
      track('a', 'ok.1'),
      track('b', 'bad.1'),
      track('c', 'ok.2'),
    ]);
    expect(excludeUnplayableTracks(all, { state: {}, context: {}, config: undefined })).toEqual([
      track('a', 'ok.1'),
      track('b', 'bad.1'),
      track('c', 'ok.2'),
    ]);
  });

  it('keeps only the tracks the probe answers true for', () => {
    const canPlayTrack = (candidate: { codecs?: string[] }) => candidate.codecs?.[0]?.startsWith('ok') ?? true;

    expect(excludeUnplayableTracks(all, { state: {}, context: {}, config: { canPlayTrack } })).toEqual([
      all[0],
      all[2],
    ]);
  });

  it('hands the probe the whole config alongside each track', () => {
    // An extended probe reads its own props (e.g. `drm`) off the config rather
    // than closing over them, so the constraint must pass the config through.
    const canPlayTrack = vi.fn(() => true);
    const config = { canPlayTrack, drm: { 'com.example': { licenseUrl: 'https://license.example.com' } } };

    excludeUnplayableTracks(all, { state: {}, context: {}, config });

    expect(canPlayTrack).toHaveBeenCalledTimes(all.length);

    for (const [index, candidate] of all.entries()) {
      expect(canPlayTrack).toHaveBeenNthCalledWith(index + 1, candidate, config);
    }
  });
});
