import { afterEach, describe, expect, it } from 'vite-plus/test';

import { BackgroundVideo } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

let tagCounter = 0;

function defineElement() {
  const tag = `test-background-video-${++tagCounter}`;

  customElements.define(tag, class extends BackgroundVideo {});
  return tag;
}

// innerHTML on a connected container so attributes are present when the constructor runs.
function create(tag: string, attrs: Record<string, string> = {}): Element {
  const container = document.createElement('div');

  document.body.appendChild(container);
  const attrStr = Object.entries(attrs)
    .map(
      ([k, v]) =>
        ` ${k}="${v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}"`
    )
    .join('');

  container.innerHTML = `<${tag}${attrStr}></${tag}>`;
  return container.querySelector(tag)!;
}

// Attributes set after construction, as on an element created by script. happy-dom also constructs parsed elements
// before setting their attributes, so this is how opt-outs reach these tests either way.
function createWith<T extends HTMLElement>(Base: new () => T, attrs: Record<string, string>): T {
  const tag = `test-created-${++tagCounter}`;

  customElements.define(tag, class extends (Base as new () => HTMLElement) {});

  const element = document.createElement(tag) as T;

  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);

  document.body.appendChild(element);

  return element;
}

describe('BackgroundVideo', () => {
  describe('playback defaults', () => {
    it('lets an explicit muted win over nomuted', () => {
      const el = createWith(BackgroundVideo, { nomuted: '', muted: '' });

      expect(el.target!.muted).toBe(true);
    });

    it('unmutes with nomuted alone', () => {
      const el = createWith(BackgroundVideo, { nomuted: '' });

      expect(el.target!.muted).toBe(false);
    });
  });

  it('observes src, the playback defaults and their opt-outs, and the passthrough attributes', () => {
    expect(BackgroundVideo.observedAttributes).toEqual([
      'src',
      'muted',
      'loop',
      'autoplay',
      'nomuted',
      'noloop',
      'noautoplay',
      'controls',
      'controlslist',
      'crossorigin',
      'preload',
    ]);
  });

  describe('passthrough attributes', () => {
    it('mirrors changes onto the inner video', () => {
      const el = create(defineElement()) as BackgroundVideo;

      el.setAttribute('preload', 'metadata');
      el.setAttribute('crossorigin', 'anonymous');

      expect(el.target!.getAttribute('preload')).toBe('metadata');
      expect(el.target!.getAttribute('crossorigin')).toBe('anonymous');

      el.removeAttribute('crossorigin');

      expect(el.target!.hasAttribute('crossorigin')).toBe(false);
    });
  });

  describe('src', () => {
    it('assigns the inner video when set as a property', () => {
      const el = create(defineElement()) as BackgroundVideo;

      el.src = 'https://example.com/v.mp4';

      expect(el.src).toBe('https://example.com/v.mp4');
      expect(el.target!.src).toBe('https://example.com/v.mp4');
    });
  });

  describe('error', () => {
    it('re-fires the inner video error from the element', () => {
      const el = create(defineElement()) as BackgroundVideo;
      let fired = 0;

      el.addEventListener('error', () => fired++);
      el.target!.dispatchEvent(new Event('error'));

      expect(fired).toBe(1);
    });
  });

  describe('target', () => {
    it('is the shadow video even when the element has a light-DOM video', () => {
      const tag = defineElement();
      const container = document.createElement('div');

      document.body.appendChild(container);
      container.innerHTML = `<${tag} src="https://example.com/v.mp4"><video slot="media"></video><video></video></${tag}>`;

      const el = container.querySelector(tag) as BackgroundVideo;
      const shadowVideo = el.shadowRoot!.querySelector('video')!;

      expect(el.target).toBe(shadowVideo);
      expect(el.getMediaTarget()).toBe(shadowVideo);
      expect(shadowVideo.muted).toBe(true);
      expect(shadowVideo.getAttribute('src') ?? shadowVideo.src).toBe('https://example.com/v.mp4');
    });
  });

  describe('XSS prevention', () => {
    it('does not inject nodes when a whitelisted attribute value contains a quote breakout', () => {
      const tag = defineElement();
      const el = create(tag, { crossorigin: '" onerror="window.__xss=1' });
      const shadow = el.shadowRoot!;

      expect(shadow.querySelectorAll('[onerror]')).toHaveLength(0);
      expect(shadow.querySelectorAll('[onload]')).toHaveLength(0);
      expect((globalThis as any).__xss).toBeUndefined();
    });

    it('does not inject script elements when a whitelisted attribute contains angle brackets', () => {
      const tag = defineElement();
      const el = create(tag, { preload: '"><script>window.__xss=1</script><video x="' });
      const shadow = el.shadowRoot!;

      expect(shadow.querySelectorAll('script')).toHaveLength(0);
      expect((globalThis as any).__xss).toBeUndefined();
    });

    it('does not inject img elements via controlslist value', () => {
      const tag = defineElement();
      const el = create(tag, { controlslist: '"><img src=x onerror="window.__xss=1">' });
      const shadow = el.shadowRoot!;

      expect(shadow.querySelectorAll('img')).toHaveLength(0);
      expect((globalThis as any).__xss).toBeUndefined();
    });

    it('does not forward non-whitelisted attributes into the shadow template', () => {
      const tag = defineElement();
      const el = create(tag, { 'data-x': '" onerror="window.__xss=1' });
      const shadow = el.shadowRoot!;
      const video = shadow.querySelector('video')!;

      expect(video.hasAttribute('data-x')).toBe(false);
      expect(shadow.querySelectorAll('[onerror]')).toHaveLength(0);
    });

    it('preserves safe whitelisted attribute values correctly', () => {
      const tag = defineElement();
      // Test template generation directly — happy-dom may return null for IDL attrs (crossorigin) on shadow DOM elements.
      const Ctor = customElements.get(tag) as typeof BackgroundVideo;
      const attrs = {
        crossorigin: 'anonymous',
        preload: 'metadata',
        muted: '',
        loop: '',
        autoplay: '',
        playsinline: '',
        disableremoteplayback: '',
        disablepictureinpicture: '',
      };
      const container = document.createElement('div');

      container.innerHTML = (Ctor as any).getTemplateHTML(attrs);

      const video = container.querySelector('video')!;

      expect(video.getAttribute('crossorigin')).toBe('anonymous');
      expect(video.getAttribute('preload')).toBe('metadata');
    });

    it('serializes boolean (empty-string) attributes without a value', () => {
      const tag = defineElement();
      const el = create(tag);
      const video = el.shadowRoot!.querySelector('video')!;

      // muted/loop/autoplay/playsinline are set as booleans by the constructor.
      expect(video.hasAttribute('muted')).toBe(true);
      expect(video.hasAttribute('loop')).toBe(true);
      expect(video.hasAttribute('autoplay')).toBe(true);
      expect(video.hasAttribute('playsinline')).toBe(true);
    });
  });
});
