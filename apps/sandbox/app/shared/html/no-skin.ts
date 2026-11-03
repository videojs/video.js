/**
 * What a page renders in place of a skin when the shell selects none: the media alone with its native controls, framed
 * as a skin would be.
 */
export const NO_SKIN_TAG = 'sandbox-no-skin';

// Its shadow root renders only unslotted children, so the media shows and a skin's slotted parts, such as a poster
// image, don't.
class SandboxNoSkin extends HTMLElement {
  constructor() {
    super();

    const root = this.attachShadow({ mode: 'open' });

    root.innerHTML = '<style>:host { display: block; position: relative; width: 100%; }</style><slot></slot>';

    const slot = root.querySelector('slot')!;

    slot.addEventListener('slotchange', () => {
      for (const media of slot.assignedElements()) media.toggleAttribute('controls', true);
    });
  }
}

/** Registers the stand-in once and returns its tag. */
export function defineNoSkin(): string {
  if (!customElements.get(NO_SKIN_TAG)) customElements.define(NO_SKIN_TAG, SandboxNoSkin);

  return NO_SKIN_TAG;
}
