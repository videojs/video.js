/** What a page renders in place of a skin when the shell selects none: the media alone, framed as a skin would be. */
export const NO_SKIN_TAG = 'sandbox-no-skin';

// Its shadow root renders only unslotted children, so the media shows and a skin's slotted parts, such as a poster
// image, don't.
class SandboxNoSkin extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' }).innerHTML =
      '<style>:host { display: block; position: relative; width: 100%; }</style><slot></slot>';
  }
}

/** Registers the stand-in once and returns its tag. */
export function defineNoSkin(): string {
  if (!customElements.get(NO_SKIN_TAG)) customElements.define(NO_SKIN_TAG, SandboxNoSkin);

  return NO_SKIN_TAG;
}
