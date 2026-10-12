import type { RegistryItemsOptions, RegistryModuleItem } from 'vjsc/shadcn';

import type { SkinModuleMeta, SkinPreset, SkinTheme } from '../../src/meta.ts';
import type { SkinFramework, SkinStyling, SkinVariant } from '../variants.ts';

/** One registry item a skin graph module publishes. */
export type SkinRegistryItem = RegistryModuleItem<SkinModuleMeta, SkinVariant>;

/** How one registry catalog publishes the skin graph. */
export type SkinRegistryItems = RegistryItemsOptions<SkinModuleMeta, SkinVariant>;

/** Metadata every item of one catalog shares. The registry merges it into each item's own. */
export interface VideojsCatalogMeta {
  readonly framework: SkinFramework;
  readonly styling: SkinStyling;
  readonly theme: SkinTheme;
}

/** Metadata one item adds to its catalog's. */
export interface VideojsItemMeta {
  readonly role: 'component' | 'skin' | 'support';
  readonly preset?: SkinPreset | undefined;
  readonly media?: 'audio' | 'video' | undefined;
  readonly public: boolean;
}

/** The metadata of a published item: its catalog's and its own. */
export type VideojsRegistryMeta = VideojsCatalogMeta & VideojsItemMeta;
