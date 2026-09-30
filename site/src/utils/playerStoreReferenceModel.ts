/**
 * Whole-store overview built from the generated feature and preset references.
 *
 * Produces the data and heading ids consumed by both PlayerStoreReference.astro and satteriConditionalHeadings, so the
 * page and its table of contents come from the same source as each feature's own reference page.
 *
 * Structure:
 *
 * ## State and actions (H2) — every member in one table, in feature order
 *
 * ## Features by preset (H2) — which preset feature bundles include each feature
 */

import type { FeatureReference, FeatureStateDef } from '@/types/feature-reference';
import type { PresetReference } from '@/types/preset-reference';

import type { TocHeading } from './componentReferenceModel';

/** Presets listed first, in this order; the rest follow by name. Matches PresetReference.astro. */
const PINNED_PRESETS = ['video', 'audio'];

/**
 * Features in the order a custom player UI most likely needs them: core playback controls first, then presentation,
 * content, and track selection, with live-only and opt-in features last. A feature missing from this list follows the
 * listed ones by name, so a new feature still appears before anyone places it.
 */
const FEATURE_ORDER = [
  'playback',
  'time',
  'volume',
  'fullscreen',
  'controls',
  'buffer',
  'textTrack',
  'playbackRate',
  'pip',
  'error',
  'metadata',
  'source',
  'quality',
  'audioTrack',
  'remotePlayback',
  'live',
  'streamType',
  'orientationLock',
];

export interface PlayerStorePreset {
  name: string;
  featureBundle: string;
}

export interface PlayerStoreFeature {
  name: string;
  exportName: string;
  docsSlug: string;
  /** Names of the presets whose feature bundle includes the feature, in preset column order. */
  presets: string[];
}

export interface PlayerStoreMember {
  name: string;
  kind: 'state' | 'action';
  /** Display type. Actions show their full signature instead of the abbreviated `function`. */
  type: string;
  description?: string;
  /** Row id, matching the row id on the feature's own reference page. */
  id: string;
  feature: PlayerStoreFeature;
}

interface PlayerStoreHeading {
  id: string;
  depth: number;
  text: string;
}

export interface PlayerStoreReferenceModel {
  headings: {
    members: PlayerStoreHeading;
    presets: PlayerStoreHeading;
  };
  presets: PlayerStorePreset[];
  features: PlayerStoreFeature[];
  members: PlayerStoreMember[];
}

function comparePresets(a: PresetReference, b: PresetReference): number {
  const aPin = PINNED_PRESETS.indexOf(a.name);
  const bPin = PINNED_PRESETS.indexOf(b.name);
  if (aPin !== -1 && bPin !== -1) return aPin - bPin;

  if (aPin !== -1) return -1;

  if (bPin !== -1) return 1;

  return a.name.localeCompare(b.name);
}

function compareFeatures(a: FeatureReference, b: FeatureReference): number {
  const aRank = FEATURE_ORDER.indexOf(a.name);
  const bRank = FEATURE_ORDER.indexOf(b.name);
  if (aRank !== -1 && bRank !== -1) return aRank - bRank;

  if (aRank !== -1) return -1;

  if (bRank !== -1) return 1;

  return a.name.localeCompare(b.name);
}

function toMembers(
  feature: PlayerStoreFeature,
  kind: PlayerStoreMember['kind'],
  defs: Record<string, FeatureStateDef>
): PlayerStoreMember[] {
  return Object.entries(defs).map(([name, def]) => {
    const member: PlayerStoreMember = {
      name,
      kind,
      type: kind === 'action' ? (def.detailedType ?? def.type) : def.type,
      id: `${feature.name}-${kind}-${name}`,
      feature,
    };

    if (def.description) member.description = def.description;

    return member;
  });
}

export function createPlayerStoreReferenceModel(
  featureRefs: FeatureReference[],
  presetRefs: PresetReference[]
): PlayerStoreReferenceModel {
  // A preset with an empty bundle contributes nothing to the store, so it gets no column.
  const presetColumns = presetRefs.filter((preset) => preset.features.length > 0).sort(comparePresets);
  const sortedRefs = [...featureRefs].sort(compareFeatures);
  const features: PlayerStoreFeature[] = [];
  const members: PlayerStoreMember[] = [];

  for (const ref of sortedRefs) {
    const feature: PlayerStoreFeature = {
      name: ref.name,
      exportName: `${ref.name}Feature`,
      docsSlug: ref.docsSlug,
      presets: presetColumns
        .filter((preset) => preset.features.some((included) => included.name === ref.name))
        .map((preset) => preset.name),
    };

    features.push(feature);
    members.push(...toMembers(feature, 'state', ref.state), ...toMembers(feature, 'action', ref.actions));
  }

  return {
    headings: {
      members: { id: 'state-and-actions', depth: 2, text: 'State and actions' },
      presets: { id: 'features-by-preset', depth: 2, text: 'Features by preset' },
    },
    presets: presetColumns.map(({ name, featureBundle }) => ({ name, featureBundle })),
    features,
    members,
  };
}

export function buildPlayerStoreReferenceTocHeadings(model: PlayerStoreReferenceModel): TocHeading[] {
  const { members, presets } = model.headings;

  return [members, presets].map(({ depth, text, id }) => ({ depth, text, slug: id }));
}
