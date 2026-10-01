import {
  type AudioPlayerStore,
  audioFeatures,
  definePlayerFeature,
  features,
  metadataFeature,
  type PlayerStore,
  type PlayerTarget,
  type VideoPlayerStore,
  videoFeatures,
} from '@videojs/core/dom';
import type { Slice } from '@videojs/store';
import { assertType, describe, it } from 'vite-plus/test';

import type { PlayerContextValue } from '../../index';
import { type CreatePlayerResult, createPlayer } from '../create-player';

// @ts-expect-error Popup coordination is not player context.
type PlayerContextPopupGroup = PlayerContextValue['popupGroup'];

void (0 as unknown as PlayerContextPopupGroup);

describe('createPlayer', () => {
  it('resolves video features to VideoPlayerStore', () => {
    const result = createPlayer({ features: videoFeatures });

    assertType<CreatePlayerResult<VideoPlayerStore>>(result);
    // @ts-expect-error Container is imported from the package root, not created per player.
    result.Container;
  });

  it('resolves audio features to AudioPlayerStore', () => {
    const result = createPlayer({ features: audioFeatures });

    assertType<CreatePlayerResult<AudioPlayerStore>>(result);
  });

  it('resolves spread video features to VideoPlayerStore', () => {
    const result = createPlayer({ features: videoFeatures });

    assertType<CreatePlayerResult<VideoPlayerStore>>(result);
  });

  it('resolves custom features to generic PlayerStore', () => {
    interface CustomState {
      custom: boolean;
    }

    const customFeature = definePlayerFeature({
      state: (): CustomState => ({ custom: true }),
    });

    const result = createPlayer({ features: [customFeature] });

    assertType<CreatePlayerResult<PlayerStore<[Slice<PlayerTarget, CustomState>]>>>(result);
  });

  it('infers config props from selected features', () => {
    const withMetadata = createPlayer({ features: [metadataFeature] });
    const withoutMetadata = createPlayer({ features: [features.playback] });

    <withMetadata.Player title="Title">
      <div />
    </withMetadata.Player>;

    // @ts-expect-error metadata props are absent when the feature is absent.
    <withoutMetadata.Player title="Title">
      <div />
    </withoutMetadata.Player>;
  });

  it('exposes orientation lock configuration as a player prop', () => {
    const withOrientationLock = createPlayer({ features: [features.orientationLock] });
    const withoutOrientationLock = createPlayer({ features: [features.playback] });

    assertType<CreatePlayerResult<PlayerStore<[typeof features.orientationLock]>>>(withOrientationLock);

    <withOrientationLock.Player orientationLockType="portrait">
      <div />
    </withOrientationLock.Player>;

    <withOrientationLock.Player orientationLockType={null}>
      <div />
    </withOrientationLock.Player>;

    // @ts-expect-error orientation lock props reject values outside the enum.
    <withOrientationLock.Player orientationLockType="sideways">
      <div />
    </withOrientationLock.Player>;

    // @ts-expect-error orientation lock props are absent when the feature is absent.
    <withoutOrientationLock.Player orientationLockType="portrait">
      <div />
    </withoutOrientationLock.Player>;
  });

  it('resolves extended video features to generic PlayerStore', () => {
    interface AnalyticsState {
      events: string[];
    }

    const analyticsFeature = definePlayerFeature({
      state: (): AnalyticsState => ({ events: [] }),
    });

    const result = createPlayer({
      features: [...videoFeatures, analyticsFeature],
    });

    // Extended features fall through to the generic overload
    assertType<CreatePlayerResult<PlayerStore<[...typeof videoFeatures, typeof analyticsFeature]>>>(result);
  });

  it('resolves extended audio features to generic PlayerStore', () => {
    interface AnalyticsState {
      events: string[];
    }

    const analyticsFeature = definePlayerFeature({
      state: (): AnalyticsState => ({ events: [] }),
    });

    const result = createPlayer({
      features: [...audioFeatures, analyticsFeature],
    });

    assertType<CreatePlayerResult<PlayerStore<[...typeof audioFeatures, typeof analyticsFeature]>>>(result);
  });
});
