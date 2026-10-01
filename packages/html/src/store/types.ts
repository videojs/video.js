import type { InferPlayerHtmlConfig, PlayerStore } from '@videojs/core/dom';

import type { UIElement } from '@/ui/ui-element';

// ----------------------------------------
// PlayerElement
// ----------------------------------------

type PlayerProperties<Store extends PlayerStore> = {
  -readonly [Key in keyof InferPlayerHtmlConfig<Store>]?: InferPlayerHtmlConfig<Store>[Key] | undefined;
};

export type PlayerElement<Store extends PlayerStore> = UIElement &
  PlayerProperties<Store> & {
    readonly store: Store;
  };

export type PlayerElementConstructor<Store extends PlayerStore> = typeof UIElement &
  (new (...args: any[]) => PlayerElement<Store>);
