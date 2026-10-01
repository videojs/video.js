import * as coreI18n from '@videojs/core/i18n';
import { registerI18n, resetBrowserTranslationCacheForTesting, resetI18nRegistry } from '@videojs/core/i18n';
import { ReactiveElement } from '@videojs/element';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createI18n } from '../../i18n/create-i18n';
import { MediaI18nProviderElement, MediaTextElement } from '../../i18n/index';

describe('createI18n', () => {
  afterEach(async () => {
    resetI18nRegistry();
    resetBrowserTranslationCacheForTesting();
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('dir');
    await Promise.resolve();
    await Promise.resolve();
    vi.restoreAllMocks();
  });

  it('derives direction from the resolved locale', async () => {
    const provider = new MediaI18nProviderElement();

    provider.lang = 'ar';
    document.body.appendChild(provider);
    await provider.updateComplete;

    expect(provider.dir).toBe('rtl');

    provider.lang = 'en';
    await provider.updateComplete;
    expect(provider.dir).toBe('ltr');
  });

  it('preserves an explicit direction', async () => {
    const provider = new MediaI18nProviderElement();

    provider.lang = 'ar';
    provider.dir = 'ltr';
    document.body.appendChild(provider);
    await provider.updateComplete;

    expect(provider.dir).toBe('ltr');
  });

  it('inherits ambient language and direction without adding a direction', async () => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'ltr';
    const provider = new MediaI18nProviderElement();

    document.body.appendChild(provider);
    await provider.updateComplete;

    expect(provider.hasAttribute('lang')).toBe(false);
    expect(provider.hasAttribute('dir')).toBe(false);
  });

  it('clears a derived direction when its explicit language is removed', async () => {
    const provider = new MediaI18nProviderElement();

    provider.lang = 'ar';
    document.body.appendChild(provider);
    await provider.updateComplete;

    provider.lang = '';
    await provider.updateComplete;
    expect(provider.dir).toBe('');
  });

  it('media-text translates text content inside provider', async () => {
    registerI18n('de', { 'buttons.play': 'Los' });
    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'de');
    const text = new MediaTextElement();

    text.setAttribute('token', 'buttons.play');
    text.textContent = 'Play';
    provider.appendChild(text);
    document.body.appendChild(provider);
    await Promise.resolve();
    await Promise.resolve();
    expect(text.textContent).toBe('Los');
  });

  it('media-text stores source text before translating', async () => {
    registerI18n('de', { 'custom.authored': 'Los' });
    const { ProviderMixin } = createI18n({ loader: async () => undefined });

    class SourceProvider extends ProviderMixin(ReactiveElement) {}
    customElements.define('i18n-source-provider', SourceProvider);
    const provider = new SourceProvider();

    provider.setAttribute('lang', 'de');
    const text = new MediaTextElement();

    text.setAttribute('token', 'custom.authored');
    text.textContent = 'Start this presentation';
    provider.appendChild(text);
    document.body.appendChild(provider);
    await text.updateComplete;
    expect(text.textContent).toBe('Los');

    provider.lang = 'x-none';
    await vi.waitFor(() => expect(text.textContent).toBe('Start this presentation'));
  });

  it('media-text falls back to text content when phrase is missing', async () => {
    const { ProviderMixin } = createI18n({ loader: async () => undefined });

    class MissingTokenProvider extends ProviderMixin(ReactiveElement) {}
    customElements.define('i18n-missing-token-provider', MissingTokenProvider);
    const provider = new MissingTokenProvider();

    provider.setAttribute('lang', 'de');
    const text = new MediaTextElement();

    text.setAttribute('token', 'custom.missing');
    text.textContent = 'Fallback label';
    provider.appendChild(text);
    document.body.appendChild(provider);
    await text.updateComplete;
    expect(text.textContent).toBe('Fallback label');
  });

  it('media-text falls back to text content without a provider', async () => {
    const text = new MediaTextElement();

    text.textContent = 'Fallback label';
    document.body.appendChild(text);
    await text.updateComplete;
    expect(text.textContent).toBe('Fallback label');
  });

  it('media-text is empty without text content', async () => {
    const text = new MediaTextElement();

    document.body.appendChild(text);
    await text.updateComplete;
    expect(text.textContent).toBe('');
  });

  it('updates media-text when html lang changes', async () => {
    registerI18n('x-test-de', { 'buttons.play': 'Los' });
    registerI18n('x-test-fr', { 'buttons.play': 'Lire' });
    document.documentElement.lang = 'x-test-de';
    const provider = new MediaI18nProviderElement();
    const text = new MediaTextElement();

    text.setAttribute('token', 'buttons.play');
    text.textContent = 'Play';
    provider.appendChild(text);
    document.body.appendChild(provider);
    await vi.waitFor(() => {
      expect(text.textContent).toBe('Los');
    });
    document.documentElement.lang = 'x-test-fr';
    await vi.waitFor(() => {
      expect(text.textContent).toBe('Lire');
    });
  });

  it('reloads builtin lazy overlays when ambient html lang changes', async () => {
    const { ProviderMixin, TextMixin } = createI18n({
      loader: async (tag) => {
        if (tag === 'x-test-lazy-de') return { 'buttons.play': 'BuiltinDe' };

        if (tag === 'x-test-lazy-fr') return { 'buttons.play': 'BuiltinFr' };

        return undefined;
      },
    });

    class LazyAmbientProvider extends ProviderMixin(ReactiveElement) {}
    class LazyAmbientText extends TextMixin(ReactiveElement) {}
    customElements.define('i18n-lazy-ambient-provider', LazyAmbientProvider);
    customElements.define('i18n-lazy-ambient-text', LazyAmbientText);

    document.documentElement.lang = 'x-test-lazy-de';
    const provider = new LazyAmbientProvider();
    const text = new LazyAmbientText();

    text.setAttribute('token', 'buttons.play');
    text.textContent = 'Play';
    provider.appendChild(text);
    document.body.appendChild(provider);
    await vi.waitFor(() => {
      expect(text.textContent).toBe('BuiltinDe');
    });

    document.documentElement.lang = 'x-test-lazy-fr';
    await vi.waitFor(() => {
      expect(text.textContent).toBe('BuiltinFr');
    });
  });

  it('handles rejected locale loads while preserving English fallback', async () => {
    const unhandled: Error[] = [];
    const onUnhandled = (reason: Error) => unhandled.push(reason);
    const loader = vi.fn(async () => {
      throw new Error('locale chunk unavailable');
    });
    const { ProviderMixin } = createI18n({ loader });

    class RejectedLocaleProvider extends ProviderMixin(ReactiveElement) {}
    customElements.define('i18n-rejected-locale-provider', RejectedLocaleProvider);

    const provider = new RejectedLocaleProvider();

    provider.lang = 'de';
    const text = new MediaTextElement();

    text.setAttribute('token', 'buttons.play');
    text.textContent = 'Play';
    provider.appendChild(text);
    process.on('unhandledRejection', onUnhandled);

    try {
      document.body.appendChild(provider);
      await text.updateComplete;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(loader).toHaveBeenCalled();
      expect(text.textContent).toBe('Play');
      expect(unhandled).toEqual([]);
    } finally {
      provider.remove();
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('updates media-text when provider lang changes', async () => {
    registerI18n('de', { 'buttons.play': 'Los' });
    registerI18n('fr', { 'buttons.play': 'Lire' });
    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'de');
    const text = new MediaTextElement();

    text.setAttribute('token', 'buttons.play');
    text.textContent = 'Play';
    provider.appendChild(text);
    document.body.appendChild(provider);
    await vi.waitFor(() => {
      expect(text.textContent).toBe('Los');
    });
    provider.setAttribute('lang', 'fr');
    await vi.waitFor(() => {
      expect(text.textContent).toBe('Lire');
    });
  });

  it('discards stale builtin load when provider lang is set right after insert', async () => {
    const { ProviderMixin, TextMixin } = createI18n({
      loader: async (tag) => {
        if (tag === 'en') return { 'buttons.play': 'BuiltinEn' };

        if (tag === 'de') return { 'buttons.play': 'BuiltinDe' };

        return undefined;
      },
    });

    class DriftProvider extends ProviderMixin(ReactiveElement) {}
    class DriftText extends TextMixin(ReactiveElement) {}
    customElements.define('i18n-drift-p', DriftProvider);
    customElements.define('i18n-drift-t', DriftText);

    document.documentElement.lang = 'en';
    const provider = new DriftProvider();
    const text = new DriftText();

    text.setAttribute('token', 'buttons.play');
    text.textContent = 'Play';
    provider.appendChild(text);
    document.body.appendChild(provider);
    provider.setAttribute('lang', 'de');
    await vi.waitFor(() => {
      expect(text.textContent).toBe('BuiltinDe');
    });
  });

  it('shares Lit i18n context between createI18n() factories', async () => {
    registerI18n('de', { 'buttons.play': 'Los' });
    const { ProviderMixin: AProvider, TextMixin: AText } = createI18n();
    const { TextMixin: BText } = createI18n();

    class SharedProvider extends AProvider(ReactiveElement) {}
    class SharedTextA extends AText(ReactiveElement) {}
    class SharedTextB extends BText(ReactiveElement) {}
    customElements.define('i18n-shared-provider', SharedProvider);
    customElements.define('i18n-shared-text-a', SharedTextA);
    customElements.define('i18n-shared-text-b', SharedTextB);

    const provider = new SharedProvider();

    provider.setAttribute('lang', 'de');
    const textSame = new SharedTextA();
    const textOther = new SharedTextB();

    textSame.setAttribute('token', 'buttons.play');
    textOther.setAttribute('token', 'buttons.play');
    textSame.textContent = 'Play';
    textOther.textContent = 'Play';
    provider.appendChild(textSame);
    provider.appendChild(textOther);
    document.body.appendChild(provider);
    await Promise.resolve();
    await Promise.resolve();
    expect(textSame.textContent).toBe('Los');
    expect(textOther.textContent).toBe('Los');
  });

  it('I18nController refreshes fallback English when the registry changes', async () => {
    const { context, I18nController: Ctor } = createI18n();

    class Probe extends ReactiveElement {
      readonly #i18n = new Ctor(this, context);

      override connectedCallback(): void {
        super.connectedCallback();
        this.textContent = this.#i18n.value('buttons.play', { default: 'Play' });
      }

      protected override updated(): void {
        this.textContent = this.#i18n.value('buttons.play', { default: 'Play' });
      }
    }
    customElements.define('i18n-probe-fallback-registry', Probe);
    const el = new Probe();

    document.body.appendChild(el);
    expect(el.textContent).toBe('Play');

    await el.updateComplete;
    expect(el.textContent).toBe('Play');

    registerI18n('en', { 'buttons.play': 'RegistryPlay' });

    await vi.waitFor(() => {
      expect(el.textContent).toBe('RegistryPlay');
    });
  });

  it('I18nController keeps fallback translator stable until the registry changes', async () => {
    const { context, I18nController: Ctor } = createI18n();

    class Probe extends ReactiveElement {
      readonly i18n = new Ctor(this, context);
    }
    customElements.define('i18n-probe-fallback-stability', Probe);
    const el = new Probe();

    document.body.appendChild(el);
    await el.updateComplete;

    const first = el.i18n.value;
    const second = el.i18n.value;

    expect(second).toBe(first);

    registerI18n('en', { 'buttons.play': 'RegistryPlay' });
    await el.updateComplete;

    const third = el.i18n.value;

    expect(third).not.toBe(first);
    expect(third('buttons.play')).toBe('RegistryPlay');
  });

  it('provider keeps translator stable across unrelated updates', async () => {
    registerI18n('x-stable', { 'buttons.play': 'StablePlay' });
    const {
      context,
      I18nController: Ctor,
      ProviderMixin,
    } = createI18n({
      loader: async (tag) => (tag === 'x-stable' ? { 'buttons.pause': 'LazyPause' } : undefined),
    });

    class StableProvider extends ProviderMixin(ReactiveElement) {}
    class Probe extends ReactiveElement {
      readonly i18n = new Ctor(this, context);
    }
    customElements.define('i18n-stable-provider', StableProvider);
    customElements.define('i18n-stable-provider-probe', Probe);
    const provider = new StableProvider();
    const probe = new Probe();

    provider.setAttribute('lang', 'x-stable');
    provider.appendChild(probe);
    document.body.appendChild(provider);

    await vi.waitFor(() => {
      expect(probe.i18n.value('buttons.pause')).toBe('LazyPause');
    });

    const first = probe.i18n.value;

    provider.requestUpdate();
    await provider.updateComplete;
    await probe.updateComplete;

    expect(probe.i18n.value).toBe(first);

    registerI18n('x-stable', { 'buttons.replay': 'StableReplay' });

    await vi.waitFor(() => {
      expect(probe.i18n.value).not.toBe(first);
      expect(probe.i18n.value('buttons.replay')).toBe('StableReplay');
    });
  });

  it('keeps regional registry overrides above lazy parent packs and refreshes them after mount', async () => {
    registerI18n('de-DE', { 'buttons.play': 'CustomPlay' });
    const { ProviderMixin, TextMixin } = createI18n({
      loader: async (tag) =>
        tag === 'de' ? { 'buttons.play': 'BuiltinPlay', 'buttons.pause': 'BuiltinPause' } : undefined,
    });

    class RegionalProvider extends ProviderMixin(ReactiveElement) {}
    class RegionalText extends TextMixin(ReactiveElement) {}
    customElements.define('i18n-regional-provider', RegionalProvider);
    customElements.define('i18n-regional-text', RegionalText);

    const provider = new RegionalProvider();

    provider.lang = 'de-DE';
    const play = new RegionalText();

    play.setAttribute('token', 'buttons.play');
    play.textContent = 'Play';
    const pause = new RegionalText();

    pause.setAttribute('token', 'buttons.pause');
    pause.textContent = 'Pause';
    provider.append(play, pause);
    document.body.appendChild(provider);

    await vi.waitFor(() => {
      expect(play.textContent).toBe('CustomPlay');
      expect(pause.textContent).toBe('BuiltinPause');
    });

    registerI18n('de-DE', { 'buttons.pause': 'CustomPause' });

    await vi.waitFor(() => {
      expect(pause.textContent).toBe('CustomPause');
    });
  });

  it('keeps media-text fallback English without a provider when the registry changes', async () => {
    const text = new MediaTextElement();

    text.textContent = 'Play';
    document.body.appendChild(text);
    await text.updateComplete;
    expect(text.textContent).toBe('Play');

    registerI18n('en', { Play: 'RegistryPlay' });

    await text.updateComplete;
    expect(text.textContent).toBe('Play');
  });

  it('registers browser translations when no locale pack exists', async () => {
    vi.spyOn(coreI18n, 'getBrowserTranslations').mockResolvedValue({ 'buttons.play': 'BrowserPlay' });

    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'xx');
    const text = new MediaTextElement();

    text.setAttribute('token', 'buttons.play');
    text.textContent = 'Play';
    provider.appendChild(text);
    document.body.appendChild(provider);

    await vi.waitFor(() => {
      expect(text.textContent).toBe('BrowserPlay');
    });
  });

  it('skips browser translation when locale is already registered', async () => {
    registerI18n('fr', { 'buttons.play': 'Lire' });
    const getBrowserTranslations = vi.spyOn(coreI18n, 'getBrowserTranslations');

    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'fr');
    const text = new MediaTextElement();

    text.setAttribute('token', 'buttons.play');
    text.textContent = 'Play';
    provider.appendChild(text);
    document.body.appendChild(provider);

    await vi.waitFor(() => {
      expect(text.textContent).toBe('Lire');
    });
    expect(getBrowserTranslations).not.toHaveBeenCalled();
  });

  it('registers browser translations when a shipped locale pack is missing keys', async () => {
    const getBrowserTranslations = vi.spyOn(coreI18n, 'getBrowserTranslations').mockResolvedValue({
      'menu.settings': 'Paramètres',
    } satisfies Partial<coreI18n.FlatTranslations>);

    const { ProviderMixin, TextMixin } = createI18n({
      loader: async (tag) => (tag === 'fr' ? { 'buttons.play': 'Lire' } : undefined),
    });

    class PartialProvider extends ProviderMixin(ReactiveElement) {}
    class PartialText extends TextMixin(ReactiveElement) {}
    customElements.define('i18n-partial-provider', PartialProvider);
    customElements.define('i18n-partial-text', PartialText);

    const provider = new PartialProvider();

    provider.setAttribute('lang', 'fr');
    const text = new PartialText();

    text.setAttribute('token', 'menu.settings');
    text.textContent = 'Settings';
    provider.appendChild(text);
    document.body.appendChild(provider);

    await vi.waitFor(() => {
      expect(text.textContent).toBe('Paramètres');
    });
    expect(getBrowserTranslations).toHaveBeenCalledWith('fr');
  });

  it('does not register browser translations after locale changes', async () => {
    let resolveBrowser: ((value: Partial<coreI18n.FlatTranslations>) => void) | undefined;
    const getBrowserTranslations = vi.spyOn(coreI18n, 'getBrowserTranslations').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBrowser = resolve;
        })
    );
    const registerI18nSpy = vi.spyOn(coreI18n, 'registerI18n');

    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'xx');
    document.body.appendChild(provider);

    await vi.waitFor(() => {
      expect(getBrowserTranslations).toHaveBeenCalledWith('xx');
    });

    provider.setAttribute('lang', 'fr');
    await Promise.resolve();

    resolveBrowser?.({ 'buttons.play': 'StaleBrowserPlay' });
    await Promise.resolve();
    await Promise.resolve();

    expect(registerI18nSpy).not.toHaveBeenCalledWith('xx', { 'buttons.play': 'StaleBrowserPlay' });
  });
});
