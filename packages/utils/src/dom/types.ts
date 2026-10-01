// Method syntax is required here for TypeScript's class inheritance checking.
// Using property syntax (e.g., `connectedCallback?: () => void`) causes TS2425
// when a class extends a generic mixin that defines lifecycle callbacks.
export interface CustomElementCallbacks {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
}

export interface CustomElement extends HTMLElement, CustomElementCallbacks {}

export interface CustomElementConstructor {
  new (): CustomElement;
}
