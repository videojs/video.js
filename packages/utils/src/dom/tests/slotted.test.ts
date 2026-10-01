import { afterEach, describe, expect, it } from 'vite-plus/test';

import { getSlottedElement } from '../slotted';

describe('getSlottedElement', () => {
  let tagCounter = 0;

  function uniqueTag(base: string): string {
    return `${base}-${Date.now()}-${tagCounter++}`;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('default slot', () => {
    function createHost(slotHtml = '<slot></slot>'): HTMLElement {
      const tagName = uniqueTag('test-host');

      class TestHost extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.shadowRoot!.innerHTML = slotHtml;
        }
      }

      customElements.define(tagName, TestHost);
      const host = document.createElement(tagName);

      document.body.appendChild(host);
      return host;
    }

    it('finds slotted element matching predicate', () => {
      const host = createHost();
      const video = document.createElement('video');

      host.appendChild(video);

      const result = getSlottedElement(host.shadowRoot!, '', (el) => (el instanceof HTMLVideoElement ? el : null));

      expect(result).toBe(video);
    });

    it('returns first match when multiple elements exist', () => {
      const host = createHost();
      const video1 = document.createElement('video');
      const video2 = document.createElement('video');

      host.appendChild(video1);
      host.appendChild(video2);

      const result = getSlottedElement(host.shadowRoot!, '', (el) => (el instanceof HTMLVideoElement ? el : null));

      expect(result).toBe(video1);
    });

    it('returns null when no match found', () => {
      const host = createHost();
      const span = document.createElement('span');

      host.appendChild(span);

      const result = getSlottedElement(host.shadowRoot!, '', (el) => (el instanceof HTMLVideoElement ? el : null));

      expect(result).toBeNull();
    });

    it('returns null when slot is empty', () => {
      const host = createHost();

      const result = getSlottedElement(host.shadowRoot!, '', (el) => (el instanceof HTMLVideoElement ? el : null));

      expect(result).toBeNull();
    });

    it('supports predicates returning false', () => {
      const host = createHost();
      const div = document.createElement('div');

      host.appendChild(div);

      const result = getSlottedElement(host.shadowRoot!, '', (el) => (el instanceof HTMLVideoElement ? el : false));

      expect(result).toBeNull();
    });

    it('works with type guard predicates', () => {
      const host = createHost();
      const video = document.createElement('video');

      host.appendChild(video);

      const isMedia = (el: Element): el is HTMLMediaElement => el instanceof HTMLMediaElement;

      const result = getSlottedElement(host.shadowRoot!, '', (el) => (isMedia(el) ? el : null));

      expect(result).toBe(video);
      expect(result?.play).toBeDefined();
    });
  });

  describe('named slot', () => {
    function createHostWithNamedSlot(): HTMLElement {
      const tagName = uniqueTag('test-named');

      class TestHost extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.shadowRoot!.innerHTML = '<slot name="media"></slot><slot></slot>';
        }
      }

      customElements.define(tagName, TestHost);
      const host = document.createElement(tagName);

      document.body.appendChild(host);
      return host;
    }

    it('finds element in named slot', () => {
      const host = createHostWithNamedSlot();
      const video = document.createElement('video');

      video.slot = 'media';
      host.appendChild(video);

      const result = getSlottedElement(host.shadowRoot!, 'media', (el) => (el instanceof HTMLVideoElement ? el : null));

      expect(result).toBe(video);
    });

    it('ignores elements in other slots', () => {
      const host = createHostWithNamedSlot();
      const video = document.createElement('video');

      // No slot attribute - goes to default slot
      host.appendChild(video);

      const result = getSlottedElement(host.shadowRoot!, 'media', (el) => (el instanceof HTMLVideoElement ? el : null));

      expect(result).toBeNull();
    });

    it('returns null when named slot does not exist', () => {
      const host = createHostWithNamedSlot();
      const video = document.createElement('video');

      video.slot = 'media';
      host.appendChild(video);

      expect(getSlottedElement(host.shadowRoot!, 'media', (el) => (el instanceof HTMLVideoElement ? el : null))).toBe(
        video
      );

      const result = getSlottedElement(host.shadowRoot!, 'nonexistent', (el) =>
        el instanceof HTMLVideoElement ? el : null
      );

      expect(result).toBeNull();
    });
  });

  describe('no slot in shadow root', () => {
    it('returns null when shadow root has no matching slot', () => {
      const tagName = uniqueTag('test-no-slot');

      class TestHost extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.shadowRoot!.innerHTML = '<div>No slot here</div>';
        }
      }

      customElements.define(tagName, TestHost);
      const host = document.createElement(tagName);

      document.body.appendChild(host);

      const video = document.createElement('video');

      host.appendChild(video);

      const result = getSlottedElement(host.shadowRoot!, '', (el) => (el instanceof HTMLVideoElement ? el : null));

      expect(result).toBeNull();
    });
  });
});
