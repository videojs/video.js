import { describe, expect, it } from 'vite-plus/test';

import type { Signal } from '../../signals/primitives';
import { createComposition } from '../create-composition';
import { defineBehavior } from '../define-behavior';
import { defineFeature, flattenFeatures } from '../define-feature';

const calls: string[] = [];

const counter = defineBehavior({
  stateKeys: ['count'],
  contextKeys: [],
  setup: ({ state, config }: { state: { count: Signal<number | undefined> }; config: { step: number } }) => {
    calls.push(`counter:${config.step}:${state.count.get()}`);
  },
});

const labeler = defineBehavior({
  stateKeys: ['label'],
  contextKeys: [],
  setup: ({ state }: { state: { label: Signal<string | undefined> } }) => {
    calls.push(`labeler:${state.label.get()}`);
  },
});

describe('flattenFeatures', () => {
  it('concatenates behaviors in feature order and composes each shared one once, at its first position', () => {
    const first = defineFeature({ behaviors: [labeler, counter] });
    const second = defineFeature({ behaviors: [counter] });

    expect(flattenFeatures([first, second]).behaviors).toEqual([labeler, counter]);
  });

  it('merges every feature’s defaults and initial state into what createComposition takes', () => {
    calls.length = 0;
    const counting = defineFeature({
      behaviors: [counter],
      defaultConfig: { step: 2 },
      initialState: { count: 1 },
    });
    const labeling = defineFeature({ behaviors: [labeler], initialState: { label: 'a' } });
    const { behaviors, defaultConfig, initialState } = flattenFeatures([counting, labeling]);

    const composition = createComposition(behaviors, { defaultConfig, initialState });

    expect(calls).toEqual(['counter:2:1', 'labeler:a']);
    composition.destroy();
  });

  it('takes the last feature’s value for a key several features give', () => {
    const plain = defineFeature({ behaviors: [counter], defaultConfig: { step: 1 } });
    const refined = defineFeature({ behaviors: [counter], defaultConfig: { step: 2 } });
    const a = defineFeature({ behaviors: [labeler], initialState: { label: 'a' } });
    const b = defineFeature({ behaviors: [labeler], initialState: { label: 'b' } });

    expect(flattenFeatures([plain, refined]).defaultConfig).toEqual({ step: 2 });
    expect(flattenFeatures([refined, plain]).defaultConfig).toEqual({ step: 1 });
    expect(flattenFeatures([a, b]).initialState).toEqual({ label: 'b' });
  });
});
