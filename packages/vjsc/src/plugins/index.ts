export { type VjscComponentSchemaOptions, vjscComponentSchemaPlugin } from './component-schema';
export { type VjscRegistryOptions, vjscRegistryPlugin } from './registry';
export type { CandidateManifestOptions } from '../styles/candidates';
export { renderComponentSchema, type RenderComponentSchemaOptions } from '../components/schema/generate';
export { defineVariants, type SourceEntry, type VariantCodec, type VariantModule } from './variants';
export {
  type EntriesOptions,
  type MetaOptions,
  type VjscPluginOptions,
  vjscPlugin,
  type TransformOptions,
} from './vjsc';
export type { TransformModule } from '../utils/module-id';
