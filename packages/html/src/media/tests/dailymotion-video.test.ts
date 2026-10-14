import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DailymotionVideo } from '../dailymotion-video/adapter';

class TestDailymotionVideo extends DailymotionVideo {}

customElements.define('test-dailymotion-video', TestDailymotionVideo);

afterEach(() => {
  document.body.replaceChildren();
});

describe('DailymotionVideo', () => {
  it('builds the player in a light-DOM container, which the SDK can find by id from the document', async () => {
    const el = document.createElement('test-dailymotion-video') as TestDailymotionVideo;

    document.body.append(el);
    // `slotchange` is what hands the new container to the adapter.
    await new Promise((resolve) => setTimeout(resolve));

    const container = el.querySelector(':scope > [slot=media]');

    expect(container).toBeInstanceOf(HTMLDivElement);
    expect(el.adapter.target).toBe(container);
  });

  it('keeps a container the page already slotted', () => {
    const el = document.createElement('test-dailymotion-video') as TestDailymotionVideo;
    const container = document.createElement('div');

    container.slot = 'media';
    el.append(container);
    document.body.append(el);

    expect(el.querySelectorAll(':scope > [slot=media]')).toHaveLength(1);
    expect(el.adapter.target).toBe(container);
  });

  it('loads a source set before the element was in the page into a container given by then', async () => {
    const el = document.createElement('test-dailymotion-video') as TestDailymotionVideo;
    const container = document.createElement('div');

    container.slot = 'media';
    el.append(container);
    // A browser's `slotchange` attaches the container while the element is still out of the page; the test DOM fires
    // none until it is in, so the attach is made here.
    el.adapter.attach(container);
    el.adapter.source = {
      src: 'https://www.dailymotion.com/video/x84sh87',
      engine: { dailymotion: { player: 'x8lr5' } },
    };
    await new Promise((resolve) => setTimeout(resolve));

    expect(el.adapter.error).toBeNull();
    expect(container.children).toHaveLength(0);

    const load = vi.spyOn(el.adapter, 'load').mockResolvedValue();

    document.body.append(el);

    expect(load).toHaveBeenCalledOnce();
  });

  it('keeps one container when the element is moved', () => {
    const el = document.createElement('test-dailymotion-video') as TestDailymotionVideo;

    document.body.append(el);
    el.remove();
    document.body.append(el);

    expect(el.querySelectorAll(':scope > [slot=media]')).toHaveLength(1);
  });

  it('slots the container into the media slot', () => {
    expect(DailymotionVideo.getTemplateHTML()).toMatch(/<slot name="media"><\/slot>/);
  });

  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('keeps the player out of hit-testing without controls so the skin above it sees hover', () => {
    expect(DailymotionVideo.getTemplateHTML()).toMatch(/:host\(:not\(\[controls\]\)\)\s*\{\s*pointer-events:\s*none/);
  });
});
