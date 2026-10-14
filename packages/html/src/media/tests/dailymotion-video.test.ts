import { afterEach, describe, expect, it } from 'vite-plus/test';

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

  it('slots the container into the media slot', () => {
    expect(DailymotionVideo.getTemplateHTML()).toMatch(/<slot name="media"><\/slot>/);
  });

  // Asserted against the template because no DOM implementation the tests run in resolves `:host` for a computed
  // style, which is also how the sibling embed hosts check theirs.
  it('keeps the player out of hit-testing without controls so the skin above it sees hover', () => {
    expect(DailymotionVideo.getTemplateHTML()).toMatch(/:host\(:not\(\[controls\]\)\)\s*\{\s*pointer-events:\s*none/);
  });
});
