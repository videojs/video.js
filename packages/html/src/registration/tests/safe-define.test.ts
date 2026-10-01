import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { safeDefine } from '../safe-define';

describe('safeDefine', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers a custom element', () => {
    class TestElement extends HTMLElement {
      static tagName = 'test-sd-register';
    }

    expect(customElements.get('test-sd-register')).toBeUndefined();
    safeDefine(TestElement);
    expect(customElements.get('test-sd-register')).toBe(TestElement);
  });

  it('does not replace an existing registration', () => {
    class Original extends HTMLElement {
      static tagName = 'test-sd-no-replace';
    }
    class Replacement extends HTMLElement {
      static tagName = 'test-sd-no-replace';
    }

    safeDefine(Original);
    safeDefine(Replacement);
    expect(customElements.get('test-sd-no-replace')).toBe(Original);
  });

  it('does nothing when customElements is unavailable', () => {
    vi.stubGlobal('customElements', undefined);

    class TestElement extends HTMLElement {
      static tagName = 'test-sd-ssr';
    }

    expect(() => safeDefine(TestElement)).not.toThrow();
  });

  describe('tag-name override', () => {
    it('registers under the given name instead of the element own', () => {
      class TestElement extends HTMLElement {
        static tagName = 'test-sd-own';
      }

      safeDefine(TestElement, 'test-sd-override');

      expect(customElements.get('test-sd-override')).toBe(TestElement);
      expect(customElements.get('test-sd-own')).toBeUndefined();
      // The class keeps its own name: the override is where it was registered, not
      // what it calls itself.
      expect(TestElement.tagName).toBe('test-sd-own');
    });

    it('reaches a second name for an element whose own is taken', () => {
      class Incumbent extends HTMLElement {
        static tagName = 'test-sd-shared';
      }
      class Flavor extends HTMLElement {
        static tagName = 'test-sd-shared';
      }

      safeDefine(Incumbent);
      safeDefine(Flavor);
      safeDefine(Flavor, 'test-sd-shared-alt');

      // Without the override the second registration is simply dropped.
      expect(customElements.get('test-sd-shared')).toBe(Incumbent);
      expect(customElements.get('test-sd-shared-alt')).toBe(Flavor);
    });

    it('does not replace an existing registration under the given name', () => {
      class Original extends HTMLElement {
        static tagName = 'test-sd-override-taken';
      }
      class Other extends HTMLElement {
        static tagName = 'test-sd-other';
      }

      safeDefine(Original);
      safeDefine(Other, 'test-sd-override-taken');

      expect(customElements.get('test-sd-override-taken')).toBe(Original);
    });
  });
});
