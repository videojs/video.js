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

  it('explains itself with help in a shadow root while it is empty', async () => {
    const { PlayerElement } = createPlayer({ features: videoFeatures });
    const player = document.createElement(defineTestElement(PlayerElement));

    document.body.append(player);

    const help = player.shadowRoot?.querySelector<HTMLElement>('slot + .media-help');

    expect(help?.hidden).toBe(false);
    expect(help?.textContent).toContain('Add a Media to this player.');

    player.append(document.createElement('div'));
    await new Promise((resolve) => setTimeout(resolve));

    expect(help?.hidden).toBe(true);
  });

  it('gets no shadow root when it connects with children', () => {
    const { PlayerElement } = createPlayer({ features: videoFeatures });
    const player = document.createElement(defineTestElement(PlayerElement));

    player.append(document.createElement('div'));
    document.body.append(player);

    expect(player.shadowRoot).toBeNull();
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
