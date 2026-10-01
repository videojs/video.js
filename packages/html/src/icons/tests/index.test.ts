import { Window } from 'happy-dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

describe('@videojs/html/icons', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('exports SVG strings without registering media-icon', async () => {
    const testWindow = new Window();

    vi.stubGlobal('window', testWindow);
    vi.stubGlobal('document', testWindow.document);
    vi.stubGlobal('customElements', testWindow.customElements);
    vi.stubGlobal('HTMLElement', testWindow.HTMLElement);

    const { playIcon } = await import('../index');

    expect(playIcon).toContain('<svg');
    expect(customElements.get('media-icon')).toBeUndefined();
  });

  it('renders icons that exist before the registry module loads', async () => {
    const testWindow = new Window();

    vi.stubGlobal('window', testWindow);
    vi.stubGlobal('document', testWindow.document);
    vi.stubGlobal('customElements', testWindow.customElements);
    vi.stubGlobal('HTMLElement', testWindow.HTMLElement);

    document.body.innerHTML = '<media-icon name="play"></media-icon>';

    await import('../element');
    await customElements.whenDefined('media-icon');

    await vi.waitFor(() => {
      expect(document.querySelector('media-icon')?.innerHTML).toContain('<svg');
    });
  });

  it('renders neutral icons from the lazy family loader', async () => {
    const testWindow = new Window();

    vi.stubGlobal('window', testWindow);
    vi.stubGlobal('document', testWindow.document);
    vi.stubGlobal('customElements', testWindow.customElements);
    vi.stubGlobal('HTMLElement', testWindow.HTMLElement);

    document.body.innerHTML = '<media-icon family="neutral" name="play"></media-icon>';

    await import('../element');
    await customElements.whenDefined('media-icon');

    await vi.waitFor(() => {
      expect(document.querySelector('media-icon')?.innerHTML).toContain('<svg');
    });
  });

  it('renders icons from a family-specific import', async () => {
    const testWindow = new Window();

    vi.stubGlobal('window', testWindow);
    vi.stubGlobal('document', testWindow.document);
    vi.stubGlobal('customElements', testWindow.customElements);
    vi.stubGlobal('HTMLElement', testWindow.HTMLElement);

    document.body.innerHTML = '<media-icon family="neutral" name="play"></media-icon>';

    await import('../element/neutral');
    await customElements.whenDefined('media-icon');

    expect(document.querySelector('media-icon')?.innerHTML).toContain('<svg');
  });
});
