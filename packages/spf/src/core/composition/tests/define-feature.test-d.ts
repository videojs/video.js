import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { Signal } from '../../signals/primitives';
import { createComposition } from '../create-composition';
import { defineBehavior } from '../define-behavior';
import { defineFeature, flattenFeatures } from '../define-feature';

const counter = defineBehavior({
  stateKeys: ['count'],
  contextKeys: [],
  setup: (_deps: { state: { count: Signal<number | undefined> }; config: { step: number } }) => {},
});

const labeler = defineBehavior({
  stateKeys: ['label'],
  contextKeys: [],
  setup: (_deps: { state: { label: Signal<string | undefined> } }) => {},
});

describe('flattenFeatures', () => {
  it('composes into the state of every feature’s behaviors', () => {
    const { behaviors } = flattenFeatures([
      defineFeature({ behaviors: [counter] }),
      defineFeature({ behaviors: [labeler] }),
    ]);
    const composition = createComposition(behaviors, { config: { step: 1 } });

    expectTypeOf(composition.state.count.get()).toEqualTypeOf<number | undefined>();
    expectTypeOf(composition.state.label.get()).toEqualTypeOf<string | undefined>();
  });

  it('makes a config key optional once a feature defaults it', () => {
    const { behaviors, defaultConfig } = flattenFeatures([
      defineFeature({ behaviors: [counter], defaultConfig: { step: 2 } }),
    ]);

    createComposition(behaviors, { defaultConfig });
  });

  it('rejects a default of the wrong type for the behavior that reads it', () => {
    const { behaviors, defaultConfig } = flattenFeatures([
      defineFeature({ behaviors: [counter], defaultConfig: { step: 'two' } }),
    ]);

    // @ts-expect-error — `step` is a number
    createComposition(behaviors, { defaultConfig });
  });

  it('types a key several features give as the last feature’s value', () => {
    const { defaultConfig } = flattenFeatures([
      defineFeature({ behaviors: [counter], defaultConfig: { step: 1 as const } }),
      defineFeature({ behaviors: [counter], defaultConfig: { step: 2 as const } }),
    ]);

    expectTypeOf(defaultConfig.step).toEqualTypeOf<2>();
  });
});
