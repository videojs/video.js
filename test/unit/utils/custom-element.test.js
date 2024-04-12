/* eslint-env browser */
import videojs from '../../../src/js/video.js';

export class TestCustomElement extends HTMLElement {

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'closed' });

    const containerElem = document.createElement('div');

    containerElem.setAttribute('data-vjs-player', '');
    shadowRoot.appendChild(containerElem);

    const videoElem = document.createElement('video');

    videoElem.setAttribute('width', 640);
    videoElem.setAttribute('height', 260);
    containerElem.appendChild(videoElem);

    this.innerPlayer = videojs(videoElem);
  }
}

export class TestSlotElement extends HTMLElement {

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const wrapperEl = document.createElement('div');

    wrapperEl.style = this.dataset.style;
    const slot = document.createElement('slot');

    wrapperEl.appendChild(slot);
    shadowRoot.appendChild(wrapperEl);
  }
}

// Not supported on Chrome < 54
if ('customElements' in window) {
  window.customElements.define('test-custom-element', TestCustomElement);
  window.customElements.define('test-slot-element', TestSlotElement);
}
