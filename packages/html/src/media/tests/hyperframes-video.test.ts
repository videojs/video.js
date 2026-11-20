import type { HyperFramesTimeline } from '@videojs/hyperframes-video';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { HyperFramesVideo } from '../hyperframes-video/adapter';

const TAG = 'test-hyperframes-video';

if (!customElements.get(TAG)) customElements.define(TAG, class extends HyperFramesVideo {});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

/** Render, then let the child observer see children parsed after the element connected. */
async function render(markup: string): Promise<HyperFramesVideo> {
  document.body.innerHTML = markup;
  await Promise.resolve();
  return document.querySelector(TAG) as HyperFramesVideo;
}

const timeline = (): HyperFramesTimeline => ({ duration: () => 1, seek: () => {}, pause: () => {} });

describe('HyperFramesVideo', () => {
  it('plays its template child', async () => {
    const media = await render(`<${TAG}><template><div data-start="0"></div></template></${TAG}>`);

    expect(media.adapter.source?.content).toBe(media.querySelector('template'));
    expect(media.src).toBe('hyperframes:main');
  });

  it('plays a src over its template', async () => {
    const media = await render(
      `<${TAG} src="https://example.com/intro.html"><template><div></div></template></${TAG}>`
    );

    expect(media.adapter.source).toEqual({ src: 'https://example.com/intro.html' });
  });

  it('leaves a source the page set alone when its children change', async () => {
    const media = await render(`<${TAG}></${TAG}>`);

    media.adapter.source = { html: '<html></html>' };
    media.append(document.createElement('template'));
    await Promise.resolve();

    expect(media.adapter.source).toEqual({ html: '<html></html>' });
  });

  it('builds the template with the timeline set on it, reloading to apply one set later', async () => {
    const media = await render(`<${TAG}><template><div></div></template></${TAG}>`);
    const load = vi.spyOn(media.adapter, 'load');

    media.timeline = timeline;

    expect(media.adapter.source?.timeline).toBe(timeline);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('takes a timeline set before its template is parsed without a second load', async () => {
    document.body.innerHTML = `<${TAG}></${TAG}>`;

    const media = document.querySelector(TAG) as HyperFramesVideo;
    const load = vi.spyOn(media.adapter, 'load');

    media.timeline = timeline;
    media.innerHTML = '<template><div></div></template>';
    await Promise.resolve();

    expect(media.adapter.source?.timeline).toBe(timeline);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reloads when the template content is edited, since the template stays the same element', async () => {
    const media = await render(`<${TAG}><template><p>1</p></template></${TAG}>`);
    const load = vi.spyOn(media.adapter, 'load');

    media.querySelector('template')!.content.firstElementChild!.textContent = '2';
    await vi.waitFor(() => expect(load).toHaveBeenCalled());
  });

  // Asserted against the template because no DOM implementation the tests run in resolves shadow styles for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('keeps the composition out of hit-testing so the skin above it takes every pointer event', () => {
    expect(HyperFramesVideo.getTemplateHTML()).toMatch(/iframe\s*\{\s*pointer-events:\s*none/);
  });
});
