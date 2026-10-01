import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  createPostHogConfig,
  currentPrivateValues,
  getDocsContext,
  initAnalytics,
  maskPrivateEvent,
  maskPrivateParameters,
  withPageContext,
  type AnalyticsEvent,
} from '../analytics';
import { FRAMEWORK_COOKIE, STYLE_STORAGE_KEY_PREFIX } from '../docs/preferences';

const SOURCE = 'https%3A%2F%2Fcdn.example.com%2Fsecret.m3u8%3Ftoken%3Dabc';

function clearPreferences(): void {
  document.cookie = `${FRAMEWORK_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  localStorage.clear();
}

afterEach(() => {
  clearPreferences();
  delete window.posthog;
  vi.unstubAllGlobals();
  history.replaceState(null, '', '/');
});

describe('maskPrivateParameters', () => {
  it('masks the source URL and keeps the other installation picks', () => {
    expect(
      maskPrivateParameters(`https://videojs.org/docs/guides/installation/html?source-url=${SOURCE}&skin=minimal`)
    ).toBe('https://videojs.org/docs/guides/installation/html?source-url=<masked>&skin=minimal');
  });

  it('masks the source URL when it is the last parameter or precedes a hash', () => {
    expect(maskPrivateParameters(`/install?skin=video&source-url=${SOURCE}`)).toBe(
      '/install?skin=video&source-url=<masked>'
    );
    expect(maskPrivateParameters(`/install?source-url=${SOURCE}#usage`)).toBe('/install?source-url=<masked>#usage');
  });

  it('masks a link address inside an autocapture element chain', () => {
    const chain = `a:href="/docs/guides/installation/react?source-url=${SOURCE}"attr__href="/docs/guides/installation/react?source-url=${SOURCE}"`;

    expect(maskPrivateParameters(chain)).toBe(
      'a:href="/docs/guides/installation/react?source-url=<masked>"attr__href="/docs/guides/installation/react?source-url=<masked>"'
    );
  });

  it('leaves a value PostHog already masked, and an empty value, as they are', () => {
    expect(maskPrivateParameters('/install?source-url=<masked>&skin=video')).toBe(
      '/install?source-url=<masked>&skin=video'
    );
    expect(maskPrivateParameters('/install?source-url=&skin=video')).toBe('/install?source-url=&skin=video');
  });

  it('leaves text without a private parameter unchanged', () => {
    const url = 'https://www.mux.com?utm_source=videojs&utm_campaign=vjs10&resource-url=kept';

    expect(maskPrivateParameters(url)).toBe(url);
  });
});

describe('maskPrivateEvent', () => {
  it('masks URLs in properties, nested values, heatmap keys, and person properties', () => {
    const page = `https://videojs.org/docs/guides/installation/html?source-url=${SOURCE}`;
    const masked = 'https://videojs.org/docs/guides/installation/html?source-url=<masked>';

    const result = maskPrivateEvent({
      properties: {
        $current_url: page,
        $referrer: page,
        $elements: [{ attr__href: page }],
        $heatmap_data: { [page]: [{ x: 1 }] },
        $screen_width: 1280,
      },
      $set: { $current_url: page },
      $set_once: { $initial_current_url: page },
    });

    expect(result).toEqual({
      properties: {
        $current_url: masked,
        $referrer: masked,
        $elements: [{ attr__href: masked }],
        $heatmap_data: { [masked]: [{ x: 1 }] },
        $screen_width: 1280,
      },
      $set: { $current_url: masked },
      $set_once: { $initial_current_url: masked },
    });
  });

  it('masks the current source URL where the page renders it as text', () => {
    history.replaceState(null, '', `/docs/guides/installation/html?source-url=${SOURCE}`);

    const source = 'https://cdn.example.com/secret.m3u8?token=abc';
    const result = maskPrivateEvent({
      properties: {
        $el_text: source,
        $elements_chain: `code:text="src=&quot;${source}&quot;"nth-child="1"`,
      },
    });

    expect(JSON.stringify(result)).not.toContain('secret.m3u8');
    expect(result?.properties?.$el_text).toBe('<masked>');
  });

  it('passes a dropped event through', () => {
    expect(maskPrivateEvent(null)).toBeNull();
  });
});

describe('currentPrivateValues', () => {
  it('returns the source URL as entered and as the URL encodes it', () => {
    expect(currentPrivateValues(`?skin=video&source-url=${SOURCE}`)).toEqual([
      'https://cdn.example.com/secret.m3u8?token=abc',
      SOURCE,
    ]);
  });

  it('includes the HTML-escaped form the generated code renders', () => {
    const signed = 'https://cdn.example.com/secret.m3u8?token=abc&expires=1';

    expect(currentPrivateValues(`?source-url=${encodeURIComponent(signed)}`)).toContain(
      'https://cdn.example.com/secret.m3u8?token=abc&amp;expires=1'
    );
  });

  it('ignores a value short enough to match ordinary text', () => {
    expect(currentPrivateValues('?source-url=a.mp4')).toEqual([]);
    expect(currentPrivateValues('?skin=video')).toEqual([]);
  });
});

describe('getDocsContext', () => {
  it('falls back to the default framework and style before the reader picks one', () => {
    expect(getDocsContext()).toEqual({ docs_framework: 'react', docs_style: 'css' });
  });

  it('reports the saved framework and its saved style', () => {
    document.cookie = `${FRAMEWORK_COOKIE}=html; path=/`;
    localStorage.setItem(`${STYLE_STORAGE_KEY_PREFIX}html`, 'css');

    expect(getDocsContext()).toEqual({ docs_framework: 'html', docs_style: 'css' });
  });
});

describe('createPostHogConfig', () => {
  it('keeps cookieless mode and masks the private installation parameters', () => {
    const config = createPostHogConfig();

    expect(config).toMatchObject({
      cookieless_mode: 'always',
      mask_personal_data_properties: true,
      custom_personal_data_properties: ['source-url'],
      advanced_disable_feature_flags: true,
      disable_session_recording: true,
    });
  });

  it('stamps the docs context on each event as it is sent, then masks it', () => {
    history.replaceState(null, '', `/docs/guides/installation/html?source-url=${SOURCE}`);
    document.cookie = `${FRAMEWORK_COOKIE}=html; path=/`;

    const { before_send } = createPostHogConfig();
    const event = before_send({ properties: { $current_url: location.href, docs_framework: 'react' } });

    expect(event?.properties).toMatchObject({ docs_framework: 'html', docs_style: 'css' });
    expect(JSON.stringify(event)).not.toContain('secret.m3u8');
  });
});

describe('withPageContext', () => {
  it('reads the context when the event is sent, not when PostHog loaded', () => {
    const event: AnalyticsEvent = { properties: { $pathname: '/' } };

    expect(withPageContext(event)?.properties?.docs_framework).toBe('react');

    document.cookie = `${FRAMEWORK_COOKIE}=html; path=/`;

    expect(withPageContext(event)?.properties?.docs_framework).toBe('html');
  });

  it('carries the installation picks on an installation guide only', () => {
    history.replaceState(null, '', '/docs/guides/installation/html?skin=minimal');

    expect(withPageContext({ properties: {} })?.properties).toMatchObject({ installation_route: 'html' });

    history.replaceState(null, '', '/docs/framework/html/guides/why-videojs');

    expect(Object.keys(withPageContext({ properties: {} })?.properties ?? {})).not.toContain('installation_route');
  });

  it('passes a dropped event through', () => {
    expect(withPageContext(null)).toBeNull();
  });
});

describe('initAnalytics', () => {
  it('initializes PostHog once the browser is idle', () => {
    const callbacks: (() => void)[] = [];

    vi.stubGlobal('requestIdleCallback', (callback: () => void) => callbacks.push(callback));
    window.posthog = { init: vi.fn(), capture: vi.fn() };

    initAnalytics();

    expect(window.posthog.init).not.toHaveBeenCalled();

    callbacks.forEach((callback) => callback());

    expect(window.posthog.init).toHaveBeenCalledWith(
      expect.stringMatching(/^phc_/),
      expect.objectContaining({ api_host: '/ph' })
    );
  });

  it('does nothing when the snippet stub is missing', () => {
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => callback());

    expect(() => initAnalytics()).not.toThrow();
  });
});
