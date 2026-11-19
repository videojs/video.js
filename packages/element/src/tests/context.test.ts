import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ContextConsumer, ContextProvider, createContext } from '../context';
import { ReactiveElement } from '../reactive-element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ContextConsumer', () => {
  it('receives a value from a provider defined after it connected', async () => {
    const context = createContext<string>(Symbol('test'));

    class ConsumerElement extends ReactiveElement {
      readonly consumer = new ContextConsumer(this, { context, subscribe: true });
    }

    class ProviderElement extends ReactiveElement {
      readonly provider = new ContextProvider(this, { context, initialValue: 'provided' });
    }

    const providerTag = uniqueTag('test-provider');
    const consumerTag = uniqueTag('test-consumer');

    customElements.define(consumerTag, ConsumerElement);

    const provider = document.createElement(providerTag);
    const consumer = document.createElement(consumerTag) as ConsumerElement;

    provider.append(consumer);
    document.body.append(provider);
    expect(consumer.consumer.value).toBeUndefined();

    customElements.define(providerTag, ProviderElement);
    expect(consumer.consumer.value).toBe('provided');
  });
});
