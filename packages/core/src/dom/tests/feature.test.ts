import { createSelector, createStore } from '@videojs/store';
import { assertType, describe, expect, it } from 'vite-plus/test';

import { combinePlayerFeatureConfigs, definePlayerFeature, setPlayerConfigValue } from '../feature';
import type { PlayerFeatureConfig, PlayerTarget } from '../player';

describe('definePlayerFeature', () => {
  it('routes config inputs through private actions and derives detach persistence', () => {
    const USER_LABEL = Symbol('userLabel');
    const SET_USER_LABEL = Symbol('setUserLabel');

    interface SourceState {
      [USER_LABEL]: string | null | undefined;
      [SET_USER_LABEL](value: string | null | undefined): void;
    }

    const feature = definePlayerFeature({
      config: {
        label: {
          action: SET_USER_LABEL,
          state: USER_LABEL,
        },
      } satisfies PlayerFeatureConfig<SourceState>,
      state: ({ set }): SourceState => ({
        [USER_LABEL]: undefined,
        [SET_USER_LABEL]: (value) => set({ [USER_LABEL]: value }),
      }),
      derived: {
        label: ({ get }) => get()[USER_LABEL] ?? 'fallback',
      },
    });

    expect(feature.preserve).toEqual([USER_LABEL]);
    expect(combinePlayerFeatureConfigs([feature])).toEqual(feature.config);

    const store = createStore<PlayerTarget>()(feature);

    setPlayerConfigValue(store, feature.config!.label, 'provided');
    // SAFETY: This feature only updates store state and never reads the target.
    const detach = store.attach({} as PlayerTarget);

    detach();

    expect(store.label).toBe('provided');

    const UNKNOWN = Symbol('unknown');

    assertType<PlayerFeatureConfig<SourceState>>({
      label: {
        // @ts-expect-error Config actions must exist in the feature's source state.
        action: UNKNOWN,
        state: USER_LABEL,
      },
    });
    assertType<PlayerFeatureConfig<SourceState>>({
      label: {
        action: SET_USER_LABEL,
        // @ts-expect-error Config state must exist in the feature's source state.
        state: UNKNOWN,
      },
    });

    interface RequiredLabelState {
      [USER_LABEL]: string;
      [SET_USER_LABEL](value: string): void;
    }

    assertType<PlayerFeatureConfig<RequiredLabelState>>({
      label: {
        // @ts-expect-error Config actions must accept null and undefined when the input is absent.
        action: SET_USER_LABEL,
        state: USER_LABEL,
      },
    });
  });

  it('accepts config actions narrower than string', () => {
    type Size = 'small' | 'large';

    interface EnumState {
      size: Size;
      setSize(value: Size | null | undefined): void;
    }

    const feature = definePlayerFeature({
      name: 'enum',
      config: {
        size: {
          action: 'setSize',
          state: 'size',
        },
      } satisfies PlayerFeatureConfig<EnumState>,
      state: ({ set }): EnumState => ({
        size: 'small',
        setSize: (value) => set({ size: value ?? 'small' }),
      }),
    });

    const store = createStore<PlayerTarget>()(feature);

    setPlayerConfigValue(store, feature.config!.size, 'large');

    expect(store.size).toBe('large');
    expect(createSelector(feature).displayName).toBe('enum');

    interface WidenedState {
      size: Size;
      setSize(value: Size): void;
    }

    assertType<PlayerFeatureConfig<WidenedState>>({
      size: {
        // @ts-expect-error Config actions must still accept null and undefined.
        action: 'setSize',
        state: 'size',
      },
    });
  });
});
