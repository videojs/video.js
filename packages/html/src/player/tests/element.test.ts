import { videoFeatures } from '@videojs/core/dom';
import { ContextConsumer, ContextProvider, createContext } from '@videojs/element/context';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { UIElement } from '../../ui/ui-element';
import { createPlayer } from '../create-player';

const partContext = createContext<string>(Symbol('test-player-part'));

let tagCounter = 0;

function defineTestElement<Element extends CustomElementConstructor>(Base: Element): string {
  const tagName = `test-player-element-${tagCounter++}`;

  customElements.define(tagName, Base);
  return tagName;
}

class PartConsumer extends UIElement {
  value: string | undefined;

  constructor() {
    super();
    new ContextConsumer(this, {
      context: partContext,
      subscribe: true,
      callback: (value) => {
        this.value = value;
      },
    });
  }
}

/** Stands in for a part container whose definition arrives after its parts, as in a CDN-registered ejected layout. */
class LateProvider extends UIElement {
  provide(): void {
    new ContextProvider(this, { context: partContext, initialValue: 'provided' });
  }
}

describe('createPlayerElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('delivers part context from a provider that appears after its consumers', async () => {
    const { PlayerElement } = createPlayer({ features: videoFeatures });
    const player = document.createElement(defineTestElement(PlayerElement));
    const provider = document.createElement(defineTestElement(LateProvider)) as LateProvider;
    const consumer = document.createElement(defineTestElement(PartConsumer)) as PartConsumer;

    document.body.append(player);
    provider.append(consumer);
    player.append(provider);
    await Promise.all([provider.updateComplete, consumer.updateComplete]);

    expect(consumer.value).toBeUndefined();

    provider.provide();

    expect(consumer.value).toBe('provided');
  });
});
