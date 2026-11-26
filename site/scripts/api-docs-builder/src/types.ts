/**
 * Re-export types from the shared schema. The shared schema in src/types/component-reference.ts is the single source of
 * truth.
 */
import type { ComponentEventDef } from '../../../src/types/component-reference.js';

export type {
  ComponentReference,
  ComponentEventDef,
  CSSVarDef,
  DataAttrDef,
  PartReference,
  PropDef,
  StateDef,
} from '../../../src/types/component-reference.js';

export { ComponentReferenceSchema, PartReferenceSchema } from '../../../src/types/component-reference.js';

export type {
  FeatureActionDef,
  FeatureConfigDef,
  FeatureReference,
  FeatureStateDef,
} from '../../../src/types/feature-reference.js';
export { FeatureReferenceSchema } from '../../../src/types/feature-reference.js';
export type {
  EngineOptionDef,
  HostPropertyDef,
  HtmlMediaReference,
  MediaEventDef,
  MediaReference,
  MediaTargetTag,
  ReactMediaReference,
  SourceFieldDef,
} from '../../../src/types/media-reference.js';
export { MediaReferenceSchema } from '../../../src/types/media-reference.js';
export type { PresetFeatureRef, PresetReference, PresetSkinDef } from '../../../src/types/preset-reference.js';
export { PresetReferenceSchema } from '../../../src/types/preset-reference.js';

export type { UtilReference } from '../../../src/types/util-reference.js';
export { UtilReferenceSchema } from '../../../src/types/util-reference.js';

/** Discovered part within a multi-part component. */
export interface PartSource {
  /** PascalCase name (e.g., "Value", "Group", "Separator"). */
  name: string;
  /** Local symbol name in the source module (before any aliasing). */
  localName: string;
  /** Kebab-case segment (e.g., "value", "group", "separator"). */
  kebab: string;
  /** True if this part gets the shared core/data-attrs. */
  isPrimary: boolean;
  /** Path to HTML element file. */
  htmlPath?: string;
  /** Element class name inside `htmlPath` for non-primary parts (e.g., "SliderTrackElement"). */
  htmlElementName?: string;
  /** Path to React component file (for JSDoc description extraction). */
  reactPath?: string;
  /** Path to data.ts for shared data attributes (sub-parts only). */
  dataAttrsPath?: string;
  /** PascalCase component name for the data attribute export lookup (e.g., "Slider"). */
  dataAttrsComponentName?: string;
}

/** Source file locations for a component across packages. */
export interface ComponentSource {
  /** PascalCase component name (e.g., PlayButton) */
  name: string;
  /** Original kebab-case directory name (e.g., play-button). */
  kebab: string;
  /** Path to core file (e.g., packages/core/src/core/ui/play-button/core.ts) */
  corePath?: string;
  /** Path to data.ts */
  dataAttrsPath?: string;
  /** Path to vars.ts */
  cssVarsPath?: string;
  /** Path to HTML element file */
  htmlPath?: string;
  /** Path to index.parts.ts (if multi-part) */
  partsIndexPath?: string;
  /** Extra part-scoped data-attrs files (an exported `*DataAttrs` const with a `@parts` tag) */
  extraDataAttrs?: ExtraDataAttrsSource[];
}

export interface ExtraDataAttrsSource {
  path: string;
  /** Exported `*DataAttrs` const that carries the `@parts` tag */
  exportName: string;
  /** Part kebabs listed in the `@parts` JSDoc tag on the file's export */
  parts: string[];
}

/** Extracted property from TypeScript analysis. */
export interface ExtractedProp {
  name: string;
  type: string;
  detailedType?: string;
  description?: string;
  default?: string;
  required?: boolean;
}

/** Extraction result from core package. */
export interface CoreExtraction {
  description?: string;
  props: ExtractedProp[];
  state: ExtractedProp[];
  defaultProps: Record<string, string>;
}

/** Extraction result from data attributes file. */
export interface DataAttrsExtraction {
  attrs: Array<{ name: string; description: string; type?: string }>;
}

export interface CSSVarsExtraction {
  vars: Array<{ name: string; description: string }>;
}

export interface HtmlExtraction {
  tagName: string;
  properties: string[];
  /** Public instance fields and accessors, including property-only inputs that have no reactive declaration. */
  members: string[];
  events: ComponentEventDef[];
}
