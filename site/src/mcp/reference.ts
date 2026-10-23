import { installationCompatibility } from '@videojs/installation';

import type { ComponentReference } from '../types/component-reference';
import type { FeatureReference } from '../types/feature-reference';
import type { MediaReference } from '../types/media-reference';
import type { PresetReference } from '../types/preset-reference';
import type { UtilReference } from '../types/util-reference';

/** A generated reference entry and the content-collection id (file slug) it was loaded from. */
export interface ReferenceEntry<Data> {
  id: string;
  data: Data;
}

export interface ReferenceCollections {
  components: readonly ReferenceEntry<ComponentReference>[];
  media: readonly ReferenceEntry<MediaReference>[];
  presets: readonly ReferenceEntry<PresetReference>[];
  features: readonly ReferenceEntry<FeatureReference>[];
  utils: readonly ReferenceEntry<UtilReference>[];
}

/** Import specifiers and custom elements the published packages expose. */
export interface ReferenceSurface {
  modules: Record<string, string[]>;
  elements: Record<string, string[]>;
}

type Documented<Data> = Data & {
  slug: string;
  /** Framework-relative docs page, for `read_docs` with a `framework`. */
  docs: string;
};

/** The object `query_reference` code receives as `ref`. */
export interface ReferenceData {
  version: string;
  components: Documented<ComponentReference>[];
  media: Documented<MediaReference>[];
  presets: Documented<PresetReference>[];
  features: Documented<FeatureReference>[];
  utils: Documented<UtilReference>[];
  modules: Record<string, string[]>;
  elements: Record<string, string[]>;
  install: { compatibility: typeof installationCompatibility };
}

function documented<Data>(entries: readonly ReferenceEntry<Data>[], docs: (entry: ReferenceEntry<Data>) => string) {
  return entries.map((entry) => ({ ...entry.data, slug: entry.id, docs: docs(entry) }));
}

/** Assemble `ref` from the generated reference collections and package surface. */
export function buildReferenceData(
  collections: ReferenceCollections,
  surface: ReferenceSurface | undefined,
  version: string
): ReferenceData {
  return {
    version,
    components: documented(collections.components, ({ id }) => `reference/components/${id}`),
    media: documented(collections.media, ({ id }) => `reference/components/${id}`),
    presets: documented(collections.presets, ({ id }) => `reference/api/preset-${id}`),
    features: documented(collections.features, ({ data }) => data.docsSlug),
    utils: documented(collections.utils, ({ id }) => `reference/api/${id}`),
    modules: surface?.modules ?? {},
    elements: surface?.elements ?? {},
    install: { compatibility: installationCompatibility },
  };
}

/**
 * The shape of `ref` as the `query_reference` description shows it to agents. Keep it in step with `ReferenceData` and
 * the reference schemas; a test checks every schema field is named here.
 */
export const REFERENCE_DECLARATION = `type Def = { type: string; detailedType?: string; description?: string; default?: string; required?: boolean };
type Part = {
  name: string; description?: string;
  props: Record<string, Def & { frameworks?: ('html' | 'react')[] }>;   // React prop / HTML property names
  state: Record<string, Def>;
  dataAttributes: Record<string, Def>;                                 // styling hooks, e.g. "data-paused"
  cssCustomProperties: Record<string, { description: string }>;        // e.g. "--media-slider-fill"
  platforms: { html?: { tagName: string; description?: string; events?: { name: string; description?: string }[] }; react?: {} };
};
type HostProp = Def & { readonly: boolean; overridesNative?: boolean };
declare const ref: {
  version: string;
  // slug: reference id; docs: page for read_docs with a framework, e.g. "reference/components/time-slider"
  components: (Part & { slug: string; docs: string; parts?: Record<string, Part> })[];
  media: { slug: string; docs: string; name: string; tagName: string; mediaType: 'video' | 'audio';
    engineOptions?: Record<string, { name: string; type: string; description?: string }[]>;
    platforms: {
      html: { target: 'video' | 'audio' | 'iframe'; attributes: { standard: string[]; custom: Record<string, HostProp> };
        properties: { definitions: Record<string, HostProp>; native: string[] };
        events: { standard: string[]; custom: { name: string; description?: string }[] };
        methods: string[]; cssCustomProperties: Record<string, { description: string }> };
      react?: { target: string; acceptsNativeProps: boolean; props: Record<string, HostProp>; mediaRef?: { type: string; module?: string } };
    } }[];
  presets: { slug: string; docs: string; name: string; description?: string; featureBundle: string;
    features: { name: string; slug: string; hasReference: boolean }[];
    html: { skins: { name: string; tagName?: string; cssImport?: string }[]; mediaElement?: string };
    react: { skins: { name: string; tagName?: string; cssImport?: string }[]; mediaElement: string } }[];
  features: { slug: string; docs: string; name: string; docsSlug: string; description?: string;
    state: Record<string, Def>; actions: Record<string, Def>; config: Record<string, Def & { attribute?: string }> }[];
  utils: { slug: string; docs: string; name: string; description?: string; frameworks?: string[];
    overloads: { label?: string; construct?: boolean; description?: string; returnType?: string;
      typeParameters?: { name: string; constraint?: string; default?: string; const?: boolean }[];
      parameters: Record<string, Def & { rest?: boolean }>;
      returnValue: { type: string; detailedType?: string; description?: string; fields?: Record<string, Def> } }[] }[];
  modules: Record<string, string[]>;   // import specifier → exported names ("Slider.Buffer" for namespace members)
  elements: Record<string, string[]>;  // custom element tag → specifiers that define it
  install: { compatibility: {         // valid combinations for plan_install
    methodsByFramework: Record<string, string[]>; templatesByFramework: Record<string, string[]>;
    mediaByPreset: Record<string, string[]>;
    shadcn: { presets: string[]; skins: string[]; stylingsByFramework: Record<string, string[]> } } };
};`;
