// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_QUERY_LIMITS, queryReference } from '../query-reference';

const REFERENCE = JSON.stringify({
  components: [
    { name: 'PlayButton', dataAttributes: { 'data-paused': {} }, parts: {} },
    { name: 'TimeSlider', dataAttributes: {}, parts: { track: {}, fill: {} } },
  ],
});

describe('queryReference', () => {
  it('runs a function of ref and returns its JSON', async () => {
    expect(
      await queryReference(
        "ref => ref.components.filter((c) => 'data-paused' in c.dataAttributes).map((c) => c.name)",
        REFERENCE
      )
    ).toEqual({ ok: true, json: '["PlayButton"]', truncated: false, characters: 14 });
  });

  it('accepts an expression that uses ref', async () => {
    expect(await queryReference('ref.components.length', REFERENCE)).toMatchObject({ ok: true, json: '2' });
  });

  it('settles an async function', async () => {
    expect(
      await queryReference('async (ref) => { await null; return Object.keys(ref.components[1].parts); }', REFERENCE)
    ).toMatchObject({ ok: true, json: '["track","fill"]' });
  });

  it('returns null for undefined', async () => {
    expect(await queryReference('() => undefined', REFERENCE)).toMatchObject({ ok: true, json: 'null' });
  });

  it('explains keyed objects when code treats one as an array', async () => {
    const result = await queryReference('ref => ref.components[0].dataAttributes.map((a) => a)', REFERENCE);

    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('objects keyed by name') });
  });

  it('shows the expected form for a syntax error', async () => {
    expect(await queryReference('ref => {', REFERENCE)).toMatchObject({
      ok: false,
      error: expect.stringContaining('Pass one function of `ref`'),
    });
  });

  it('reports a rejected promise', async () => {
    expect(await queryReference('async () => { throw new Error("nope"); }', REFERENCE)).toEqual({
      ok: false,
      error: 'Error: nope',
    });
  });

  it('stops code that runs past the time limit', async () => {
    expect(
      await queryReference('() => { while (true) {} }', REFERENCE, { ...DEFAULT_QUERY_LIMITS, timeoutMs: 50 })
    ).toEqual({ ok: false, error: 'The query ran past its time limit. Narrow it.' });
  });

  it('has no network or host access', async () => {
    expect(await queryReference('() => [typeof fetch, typeof require, typeof process]', REFERENCE)).toMatchObject({
      json: '["undefined","undefined","undefined"]',
    });
  });

  it('truncates a large result and reports its full size', async () => {
    const result = await queryReference('() => "x".repeat(100)', REFERENCE, {
      ...DEFAULT_QUERY_LIMITS,
      outputCharacters: 10,
    });

    expect(result).toEqual({ ok: true, json: '"xxxxxxxxx', truncated: true, characters: 102 });
  });
});
