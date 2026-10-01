import { type PlayerExtension, PlayerExtensionCoordinator } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';

import { extensionContext } from '../../player/context';
import { UIElement } from '../../ui/ui-element';

/** Stands in for the player element: provides the extension context backed by a real coordinator. */
export class TestExtensionProvider extends UIElement {
  readonly extensions = new PlayerExtensionCoordinator(() => {});

  constructor() {
    super();
    new ContextProvider(this, {
      context: extensionContext,
      initialValue: { registerExtension: (extension: PlayerExtension) => this.extensions.register(extension) },
    });
  }
}
