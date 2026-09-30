import { describe, expect, it } from 'vite-plus/test';

import type { FeatureReference } from '@/types/feature-reference';
import type { PresetReference } from '@/types/preset-reference';

import { buildPlayerStoreReferenceTocHeadings, createPlayerStoreReferenceModel } from '../playerStoreReferenceModel';

function makeFeature(name: string, overrides: Partial<FeatureReference> = {}): FeatureReference {
  return {
    name,
    slug: name,
    docsSlug: `reference/api/feature-${name}`,
    state: {},
    actions: {},
    config: {},
    ...overrides,
  };
}

function makePreset(name: string, featureBundle: string, features: string[]): PresetReference {
  return {
    name,
    featureBundle,
    features: features.map((feature) => ({
      name: feature,
      slug: `reference/api/feature-${feature}`,
      hasReference: true,
    })),
    html: { skins: [] },
    react: { skins: [], mediaElement: 'Video' },
  };
}

const FEATURES = [
  makeFeature('volume', {
    state: { volume: { type: 'number', description: 'Volume level.' } },
    actions: { setVolume: { type: 'function', detailedType: '(volume: number) => number' } },
  }),
  makeFeature('streamType', { state: { streamType: { type: "'live' | 'on-demand' | 'unknown'" } } }),
  makeFeature('playback', {
    state: { paused: { type: 'boolean' } },
    actions: { play: { type: 'function', detailedType: '() => Promise<void>' } },
  }),
];

const PRESETS = [
  makePreset('live-video', 'liveVideoFeatures', ['playback', 'volume']),
  makePreset('background', 'backgroundFeatures', []),
  makePreset('audio', 'audioFeatures', ['playback', 'volume']),
  makePreset('video', 'videoFeatures', ['playback', 'volume']),
];

describe('createPlayerStoreReferenceModel', () => {
  it('orders features most used first and names their exports', () => {
    const model = createPlayerStoreReferenceModel(FEATURES, PRESETS);

    expect(model.features.map((feature) => feature.exportName)).toEqual([
      'playbackFeature',
      'volumeFeature',
      'streamTypeFeature',
    ]);
  });

  it('places unranked features after the ranked ones, by name', () => {
    const model = createPlayerStoreReferenceModel(
      [makeFeature('zoom'), makeFeature('streamType'), makeFeature('annotations'), makeFeature('playback')],
      PRESETS
    );

    expect(model.features.map((feature) => feature.name)).toEqual(['playback', 'streamType', 'annotations', 'zoom']);
  });

  it('pins video and audio before the other presets and drops presets with empty bundles', () => {
    const model = createPlayerStoreReferenceModel(FEATURES, PRESETS);

    expect(model.presets).toEqual([
      { name: 'video', featureBundle: 'videoFeatures' },
      { name: 'audio', featureBundle: 'audioFeatures' },
      { name: 'live-video', featureBundle: 'liveVideoFeatures' },
    ]);
  });

  it('lists the presets that include each feature, leaving opt-in features with none', () => {
    const model = createPlayerStoreReferenceModel(FEATURES, PRESETS);
    const presetsByFeature = Object.fromEntries(model.features.map((feature) => [feature.name, feature.presets]));

    expect(presetsByFeature).toEqual({
      playback: ['video', 'audio', 'live-video'],
      streamType: [],
      volume: ['video', 'audio', 'live-video'],
    });
  });

  it('flattens every feature into one member list, state before actions', () => {
    const model = createPlayerStoreReferenceModel(FEATURES, PRESETS);

    expect(model.members.map(({ name, kind, id }) => ({ name, kind, id }))).toEqual([
      { name: 'paused', kind: 'state', id: 'playback-state-paused' },
      { name: 'play', kind: 'action', id: 'playback-action-play' },
      { name: 'volume', kind: 'state', id: 'volume-state-volume' },
      { name: 'setVolume', kind: 'action', id: 'volume-action-setVolume' },
      { name: 'streamType', kind: 'state', id: 'streamType-state-streamType' },
    ]);
  });

  it('shows action signatures instead of the abbreviated function type', () => {
    const model = createPlayerStoreReferenceModel(FEATURES, PRESETS);
    const types = Object.fromEntries(model.members.map((member) => [member.name, member.type]));

    expect(types.play).toBe('() => Promise<void>');
    expect(types.setVolume).toBe('(volume: number) => number');
    expect(types.volume).toBe('number');
  });

  it('keeps descriptions and links each member back to its feature', () => {
    const model = createPlayerStoreReferenceModel(FEATURES, PRESETS);
    const volume = model.members.find((member) => member.name === 'volume')!;

    expect(volume.description).toBe('Volume level.');
    expect(volume.feature.docsSlug).toBe('reference/api/feature-volume');
  });
});

describe('buildPlayerStoreReferenceTocHeadings', () => {
  it('lists the member table and preset sections', () => {
    const headings = buildPlayerStoreReferenceTocHeadings(createPlayerStoreReferenceModel(FEATURES, PRESETS));

    expect(headings).toEqual([
      { depth: 2, text: 'State and actions', slug: 'state-and-actions' },
      { depth: 2, text: 'Features by preset', slug: 'features-by-preset' },
    ]);
  });
});
