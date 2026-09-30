/**
 * Zod schemas for feature API reference JSON files.
 *
 * FeatureStateDef and FeatureActionDef reuse StateDefSchema (identical shape) from component-reference.ts, following
 * the same pattern as util-reference.ts. FeatureConfigDef reuses PropDefSchema for the same reason: a config input is
 * rendered as a provider prop. Its HTML attribute name is derived from the key, unless the feature declares one, which
 * it does when the derived name would collide with a global attribute.
 */
import { z } from 'astro/zod';

import { PropDefSchema, StateDefSchema } from './component-reference';

export const FeatureStateDefSchema = StateDefSchema;

export const FeatureActionDefSchema = StateDefSchema;

export const FeatureConfigDefSchema = PropDefSchema.extend({
  /** Set only when the feature declares an attribute name instead of taking the kebab-cased key. */
  attribute: z.string().optional(),
});

export const FeatureReferenceSchema = z.object({
  name: z.string(),
  slug: z.string(),
  /** Docs page slug of the feature's reference page, e.g. `reference/api/feature-playback`. */
  docsSlug: z.string(),
  description: z.string().optional(),
  state: z.record(z.string(), FeatureStateDefSchema),
  actions: z.record(z.string(), FeatureActionDefSchema),
  /** Provider inputs the feature adds when selected. Empty for unconfigured features. */
  config: z.record(z.string(), FeatureConfigDefSchema).default({}),
});

export type FeatureStateDef = z.infer<typeof FeatureStateDefSchema>;
export type FeatureActionDef = z.infer<typeof FeatureActionDefSchema>;
export type FeatureConfigDef = z.infer<typeof FeatureConfigDefSchema>;
export type FeatureReference = z.infer<typeof FeatureReferenceSchema>;
