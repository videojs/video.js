import { type Context, type ContextCallback, ContextEvent, ContextConsumer as LitContextConsumer } from '@lit/context';

import type { ReactiveControllerHost } from './types';

export { type Context, ContextEvent, ContextProvider, ContextRoot, createContext } from '@lit/context';

type PendingCallback = ContextCallback<unknown>;

interface PendingRequest {
  element: WeakRef<Element>;
  callback: WeakRef<PendingCallback>;
}

/** `context-provider` event a Lit `ContextProvider` dispatches when it connects. */
interface ContextProviderEvent extends Event {
  readonly context: Context<unknown, unknown>;
}

const rootedDocuments = new WeakSet<Document>();

/**
 * Context consumer that also works when its provider is defined or connected after it.
 *
 * Before its first request it attaches one shared root to the host's document, which buffers subscribing requests that
 * no provider answered and replays them when a matching provider connects. Custom elements can upgrade in any order, so
 * a consumer cannot rely on its provider existing when it connects.
 */
export class ContextConsumer<
  C extends Context<unknown, unknown>,
  HostElement extends ReactiveControllerHost & HTMLElement,
> extends LitContextConsumer<C, HostElement> {
  override hostConnected(): void {
    attachDocumentContextRoot(this.host.ownerDocument);
    super.hostConnected();
  }
}

/**
 * Same buffering as Lit's `ContextRoot`, except replays skip consumers that left the document: a detached subtree can
 * still hold its old provider, and a consumer that reconnects requests again on its own.
 */
function attachDocumentContextRoot(document: Document): void {
  if (rootedDocuments.has(document)) return;

  rootedDocuments.add(document);

  const pending = new Map<unknown, PendingRequest[]>();

  document.addEventListener('context-request', (event) => {
    const request = event as ContextEvent<Context<unknown, unknown>>;
    if (request.subscribe !== true) return;

    const element = request.contextTarget ?? (request.composedPath()[0] as Element);
    const requests = pending.get(request.context) ?? [];

    if (requests.some((entry) => entry.element.deref() === element && entry.callback.deref() === request.callback)) {
      return;
    }

    requests.push({ element: new WeakRef(element), callback: new WeakRef(request.callback) });
    pending.set(request.context, requests);
  });

  document.addEventListener('context-provider', (event) => {
    const { context } = event as ContextProviderEvent;
    const requests = pending.get(context);
    if (!requests) return;

    // Unanswered requests re-buffer themselves as they are replayed.
    pending.delete(context);

    for (const entry of requests) {
      const element = entry.element.deref();
      const callback = entry.callback.deref();

      if (element?.isConnected && callback) {
        element.dispatchEvent(new ContextEvent(context, element, callback, true));
      }
    }
  });
}
