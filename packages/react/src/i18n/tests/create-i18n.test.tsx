import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import * as coreI18n from '@videojs/core/i18n';
import { type FlatTranslations, registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { createRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createI18n, I18nProvider as DefaultI18nProvider } from '../create-i18n';

describe('createI18n', () => {
  afterEach(() => {
    cleanup();
    resetI18nRegistry();
    document.documentElement.removeAttribute('lang');
    vi.restoreAllMocks();
  });

  it('uses explicit locale for translations', async () => {
    registerI18n('fr', { Play: 'Lire' });
    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider locale="fr">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });
  });

  it('merges translations prop above registry and lazy built-ins', async () => {
    registerI18n('en', { Play: 'Registry', Pause: 'RegistryPause' });
    const { I18nProvider, useTranslator } = createI18n({
      loader: async (tag) =>
        tag === 'en'
          ? {
              Play: 'Lazy',
              Replay: 'LazyReplay',
            }
          : undefined,
    });

    function Probe(): ReactElement {
      const t = useTranslator();

      return (
        <span>
          {t('Play')}:{t('Pause')}:{t('Replay')}
        </span>
      );
    }

    render(
      <I18nProvider locale="en" translations={{ Play: 'Prop' }}>
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Prop:RegistryPause:LazyReplay')).not.toBeNull();
    });
  });

  it('preserves parent translations in langRootRef providers', async () => {
    registerI18n('en', { Play: 'Registry' });
    const rootRef = createRef<HTMLDivElement>();
    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider translations={{ Play: 'Override' }}>
        <I18nProvider langRootRef={rootRef}>
          <div ref={rootRef}>
            <Probe />
          </div>
        </I18nProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Override')).not.toBeNull();
    });
    expect(screen.queryByText('Registry')).toBeNull();
  });

  it('updates ambient locale when subtree moves change which ancestor supplies lang', async () => {
    registerI18n('de', { Play: 'Los' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.setAttribute('lang', 'fr');

    const rootRef = createRef<HTMLDivElement>();
    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    const { rerender } = render(
      <div ref={rootRef}>
        <I18nProvider langRootRef={rootRef}>
          <Probe />
        </I18nProvider>
      </div>
    );

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });

    rerender(
      <section lang="de">
        <div ref={rootRef}>
          <I18nProvider langRootRef={rootRef}>
            <Probe />
          </I18nProvider>
        </div>
      </section>
    );

    await waitFor(() => {
      expect(screen.queryByText('Los')).not.toBeNull();
    });
  });

  it('does not read html lang while langRootRef is missing', async () => {
    registerI18n('de', { Play: 'Los' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.setAttribute('lang', 'de');

    const rootRef = createRef<HTMLDivElement>();
    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    const { rerender } = render(
      <section lang="fr">
        <I18nProvider langRootRef={rootRef}>
          <Probe />
        </I18nProvider>
      </section>
    );

    expect(screen.queryByText('Play')).not.toBeNull();
    expect(screen.queryByText('Los')).toBeNull();

    rerender(
      <section lang="fr">
        <I18nProvider langRootRef={rootRef}>
          <div ref={rootRef}>
            <Probe />
          </div>
        </I18nProvider>
      </section>
    );

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });
    expect(screen.queryByText('Los')).toBeNull();
  });

  it('inherits parent locale while nested langRootRef is missing', async () => {
    registerI18n('de', { Play: 'Los' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.setAttribute('lang', 'de');

    const rootRef = createRef<HTMLDivElement>();
    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    const { rerender } = render(
      <I18nProvider>
        <section lang="fr">
          <I18nProvider langRootRef={rootRef}>
            <Probe />
          </I18nProvider>
        </section>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Los')).not.toBeNull();
    });
    expect(screen.queryByText('Play')).toBeNull();

    rerender(
      <I18nProvider>
        <section lang="fr">
          <I18nProvider langRootRef={rootRef}>
            <div ref={rootRef}>
              <Probe />
            </div>
          </I18nProvider>
        </section>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });
    expect(screen.queryByText('Los')).toBeNull();
  });

  it('prefers the closest lang attribute over html lang', async () => {
    registerI18n('de', { Play: 'Los' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.setAttribute('lang', 'de');

    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    const sectionRef = createRef<HTMLElement>();

    render(
      <section ref={sectionRef} lang="fr">
        <I18nProvider langRootRef={sectionRef}>
          <Probe />
        </I18nProvider>
      </section>
    );

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });
  });

  it('updates when html lang changes', async () => {
    registerI18n('de', { Play: 'Los' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.lang = 'de';

    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Los')).not.toBeNull();
    });

    document.documentElement.setAttribute('lang', 'fr');

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });
  });

  it('updates langRootRef provider when html lang property changes', async () => {
    registerI18n('de', { Play: 'Los' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.lang = 'de';

    const rootRef = createRef<HTMLDivElement>();
    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider langRootRef={rootRef}>
        <div ref={rootRef}>
          <Probe />
        </div>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Los')).not.toBeNull();
    });

    document.documentElement.lang = 'fr';

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });
  });

  it('refreshes merged translations when the registry updates after mount', async () => {
    registerI18n('en', { Play: 'First' });
    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider locale="en">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('First')).not.toBeNull();
    });

    registerI18n('en', { Play: 'Second' });

    await waitFor(() => {
      expect(screen.queryByText('Second')).not.toBeNull();
    });
  });

  it('keeps regional registry overrides above lazy parent packs and refreshes them after mount', async () => {
    registerI18n('de-DE', { Play: 'CustomPlay' });
    const { I18nProvider, useTranslator } = createI18n({
      loader: async (tag) => (tag === 'de' ? { Play: 'BuiltinPlay', Pause: 'BuiltinPause' } : undefined),
    });

    function Probe(): ReactElement {
      const t = useTranslator();

      return (
        <span>
          {t('Play')}:{t('Pause')}
        </span>
      );
    }

    render(
      <I18nProvider locale="de-DE">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('CustomPlay:BuiltinPause')).not.toBeNull();
    });

    registerI18n('de-DE', { Pause: 'CustomPause' });

    await waitFor(() => {
      expect(screen.queryByText('CustomPlay:CustomPause')).not.toBeNull();
    });
  });

  it('drops lazy builtin overlay from the prior locale while the next locale is loading', async () => {
    registerI18n('fr', { Play: 'FrReg' });

    let unblockFr!: () => void;
    const frBlocked = new Promise<void>((resolve) => {
      unblockFr = resolve;
    });

    const { I18nProvider, useTranslator } = createI18n({
      loader: async (tag) => {
        if (tag === 'en') {
          return { Play: 'EnLazy', Pause: 'EnLazyPause' };
        }

        if (tag === 'fr') {
          await frBlocked;
          return { Play: 'FrLazy', Pause: 'FrLazyPause' };
        }

        return undefined;
      },
    });

    function Probe(): ReactElement {
      const t = useTranslator();

      return (
        <span>
          {t('Play')}:{t('Pause')}
        </span>
      );
    }

    const { rerender } = render(
      <I18nProvider locale="en">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('EnLazy:EnLazyPause')).not.toBeNull();
    });

    rerender(
      <I18nProvider locale="fr">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('FrReg:Pause')).not.toBeNull();
    });
    expect(screen.queryByText('FrReg:EnLazyPause')).toBeNull();

    unblockFr();

    await waitFor(() => {
      expect(screen.queryByText('FrReg:FrLazyPause')).not.toBeNull();
    });
  });

  it('loads built-ins for unregistered locales via lazy loader', async () => {
    const { I18nProvider, useTranslator } = createI18n({
      loader: async (tag) => (tag === 'xx' ? { Play: 'BuiltinXX' } : undefined),
    });

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider locale="xx">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('BuiltinXX')).not.toBeNull();
    });
  });

  it('useLocale reflects resolved locale', async () => {
    const { I18nProvider, useLocale } = createI18n();

    document.documentElement.lang = 'es-MX';

    function Probe(): ReactElement {
      return <span>{useLocale()}</span>;
    }

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('es-MX')).not.toBeNull();
    });
  });

  it('does not apply stale lazy locale overlays after locale switch', async () => {
    let resolveDe: ((value: Partial<FlatTranslations>) => void) | undefined;
    const deLoad = new Promise<Partial<FlatTranslations>>((resolve) => {
      resolveDe = resolve;
    });

    const { I18nProvider, useTranslator } = createI18n({
      loader: async (tag) => {
        if (tag === 'de') {
          return deLoad;
        }

        if (tag === 'fr') {
          return { Play: 'Lecture' };
        }

        return undefined;
      },
    });

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    const { rerender } = render(
      <I18nProvider locale="de">
        <Probe />
      </I18nProvider>
    );

    rerender(
      <I18nProvider locale="fr">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Lecture')).not.toBeNull();
    });

    await act(async () => {
      resolveDe?.({ Play: 'Abspielen' });
      await deLoad;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.queryByText('Abspielen')).toBeNull();
    expect(screen.queryByText('Lecture')).not.toBeNull();
  });

  it('does not re-notify onActiveLocaleChange when the handler identity changes', async () => {
    registerI18n('de', { Play: 'Los' });
    document.documentElement.lang = 'de';

    const onActiveLocaleChange = vi.fn();
    const rootRef = createRef<HTMLDivElement>();
    const { I18nProvider } = createI18n();

    function Probe(): ReactElement {
      return <span>x</span>;
    }

    const { rerender } = render(
      <I18nProvider langRootRef={rootRef} onActiveLocaleChange={onActiveLocaleChange}>
        <div ref={rootRef}>
          <Probe />
        </div>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(onActiveLocaleChange).toHaveBeenCalledWith('de');
    });

    const callCountAfterMount = onActiveLocaleChange.mock.calls.length;
    const nextHandler = vi.fn();

    rerender(
      <I18nProvider langRootRef={rootRef} onActiveLocaleChange={nextHandler}>
        <div ref={rootRef}>
          <Probe />
        </div>
      </I18nProvider>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(nextHandler).not.toHaveBeenCalled();
    expect(onActiveLocaleChange).toHaveBeenCalledTimes(callCountAfterMount);
  });

  it('notifies onActiveLocaleChange when resolved locale changes', async () => {
    const onActiveLocaleChange = vi.fn();

    registerI18n('de', { Play: 'Los' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.lang = 'de';

    const rootRef = createRef<HTMLDivElement>();
    const { I18nProvider } = createI18n();

    function Probe(): ReactElement {
      return <span>x</span>;
    }

    render(
      <I18nProvider langRootRef={rootRef} onActiveLocaleChange={onActiveLocaleChange}>
        <div ref={rootRef}>
          <Probe />
        </div>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(onActiveLocaleChange.mock.calls.some((c) => c[0] === 'de')).toBe(true);
    });

    document.documentElement.setAttribute('lang', 'fr');

    await waitFor(() => {
      expect(onActiveLocaleChange.mock.calls.some((c) => c[0] === 'fr')).toBe(true);
    });
  });

  it('resolves ambient locale for a callback-only provider', async () => {
    const onActiveLocaleChange = vi.fn();

    registerI18n('de', { Play: 'Los' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.lang = 'de';

    const { I18nProvider, useLocale, useTranslator } = createI18n();

    function Probe(): ReactElement {
      return (
        <span>
          {useLocale()}:{useTranslator()('Play')}
        </span>
      );
    }

    render(
      <I18nProvider onActiveLocaleChange={onActiveLocaleChange}>
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('de:Los')).not.toBeNull();
      expect(onActiveLocaleChange).toHaveBeenCalledWith('de');
    });

    document.documentElement.setAttribute('lang', 'fr');

    await waitFor(() => {
      expect(screen.queryByText('fr:Lire')).not.toBeNull();
      expect(onActiveLocaleChange).toHaveBeenCalledWith('fr');
    });
  });

  it('refreshes fallback translator when the registry updates outside a provider', async () => {
    const { useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(<Probe />);
    expect(screen.queryByText('Play')).not.toBeNull();

    registerI18n('en', { Play: 'RegistryPlay' });

    await waitFor(() => {
      expect(screen.queryByText('RegistryPlay')).not.toBeNull();
    });
  });

  it('ignores rejected built-in locale loads', async () => {
    registerI18n('de', { Play: 'RegistryPlay' });
    const { I18nProvider, useTranslator } = createI18n({
      loader: async () => {
        throw new Error('load failed');
      },
    });

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider locale="de">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('RegistryPlay')).not.toBeNull();
    });
  });

  it('does not loop when langRootRef identity changes each render', async () => {
    registerI18n('fr', { Play: 'Lire' });
    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    function Shell(): ReactElement {
      const rootRef = createRef<HTMLDivElement>();

      return (
        <section lang="fr">
          <I18nProvider langRootRef={rootRef}>
            <div ref={rootRef}>
              <Probe />
            </div>
          </I18nProvider>
        </section>
      );
    }

    const { rerender } = render(<Shell />);

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });

    for (let i = 0; i < 20; i++) {
      rerender(<Shell />);
    }

    expect(screen.queryByText('Lire')).not.toBeNull();
  });

  it('registers browser translations when no locale pack exists', async () => {
    const getBrowserTranslations = vi.spyOn(coreI18n, 'getBrowserTranslations').mockResolvedValue({
      Play: 'BrowserPlay',
    } satisfies Partial<FlatTranslations>);

    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider locale="xx">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('BrowserPlay')).not.toBeNull();
    });
    expect(getBrowserTranslations).toHaveBeenCalledWith('xx');
  });

  it('registers browser translations when a shipped locale pack is missing keys', async () => {
    const getBrowserTranslations = vi.spyOn(coreI18n, 'getBrowserTranslations').mockResolvedValue({
      Settings: 'Paramètres',
    } satisfies Partial<FlatTranslations>);

    const { I18nProvider, useTranslator } = createI18n({
      loader: async (tag) => (tag === 'fr' ? { Play: 'Lire' } : undefined),
    });

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Settings')}</span>;
    }

    render(
      <I18nProvider locale="fr">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Paramètres')).not.toBeNull();
    });
    expect(getBrowserTranslations).toHaveBeenCalledWith('fr');
  });

  it('skips browser translation when locale is already registered', async () => {
    registerI18n('fr', { Play: 'Lire' });
    const getBrowserTranslations = vi.spyOn(coreI18n, 'getBrowserTranslations');

    const { I18nProvider, useTranslator } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();

      return <span>{t('Play')}</span>;
    }

    render(
      <I18nProvider locale="fr">
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Lire')).not.toBeNull();
    });
    expect(getBrowserTranslations).not.toHaveBeenCalled();
  });

  it('does not register browser translations after locale changes', async () => {
    let resolveBrowser: ((value: Partial<FlatTranslations>) => void) | undefined;
    const getBrowserTranslations = vi.spyOn(coreI18n, 'getBrowserTranslations').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBrowser = resolve;
        })
    );
    const registerI18nSpy = vi.spyOn(coreI18n, 'registerI18n');

    const { I18nProvider } = createI18n();

    const { rerender } = render(<I18nProvider locale="xx">{null}</I18nProvider>);

    await waitFor(() => {
      expect(getBrowserTranslations).toHaveBeenCalledWith('xx');
    });

    rerender(<I18nProvider locale="fr">{null}</I18nProvider>);
    await Promise.resolve();

    resolveBrowser?.({ Play: 'StaleBrowserPlay' });
    await Promise.resolve();
    await Promise.resolve();

    expect(registerI18nSpy).not.toHaveBeenCalledWith('xx', { Play: 'StaleBrowserPlay' });
  });

  it('does not register browser translations after unmount', async () => {
    let resolveBrowser: ((value: Partial<FlatTranslations>) => void) | undefined;
    const getBrowserTranslations = vi.spyOn(coreI18n, 'getBrowserTranslations').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBrowser = resolve;
        })
    );
    const registerI18nSpy = vi.spyOn(coreI18n, 'registerI18n');

    const { I18nProvider } = createI18n();

    const { unmount } = render(<I18nProvider locale="xx">{null}</I18nProvider>);

    await waitFor(() => {
      expect(getBrowserTranslations).toHaveBeenCalledWith('xx');
    });

    unmount();

    resolveBrowser?.({ Play: 'UnmountedBrowserPlay' });
    await Promise.resolve();
    await Promise.resolve();

    expect(registerI18nSpy).not.toHaveBeenCalledWith('xx', { Play: 'UnmountedBrowserPlay' });
  });

  it('inherits ancestor locale and translations when a nested provider only overrides translations', async () => {
    registerI18n('de', { Play: 'Abspielen', Pause: 'Pause', Replay: 'Wiederholen' });

    const { I18nProvider, useTranslator, useLocale } = createI18n();

    function Probe(): ReactElement {
      const t = useTranslator();
      const locale = useLocale();

      return (
        <span>
          {locale}:{t('Play')}:{t('Pause')}:{t('Replay')}
        </span>
      );
    }

    render(
      <I18nProvider locale="de" translations={{ Pause: 'ParentPause', Replay: 'ParentReplay' }}>
        <I18nProvider translations={{ Play: 'Override' }}>
          <Probe />
        </I18nProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('de:Override:ParentPause:ParentReplay')).not.toBeNull();
    });
  });

  it('resolves langRootRef below an inherited translations provider', async () => {
    registerI18n('de', { Play: 'Abspielen', Pause: 'Pause' });
    registerI18n('fr', { Play: 'Lire', Pause: 'Pause' });

    const { I18nProvider, useTranslator, useLocale } = createI18n();
    const rootRef = createRef<HTMLDivElement>();

    function Probe(): ReactElement {
      const t = useTranslator();

      return (
        <span>
          {useLocale()}:{t('Play')}:{t('Pause')}
        </span>
      );
    }

    render(
      <I18nProvider locale="de">
        <I18nProvider translations={{ Pause: 'Override' }}>
          <section lang="fr">
            <I18nProvider langRootRef={rootRef}>
              <div ref={rootRef}>
                <Probe />
              </div>
            </I18nProvider>
          </section>
        </I18nProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('fr:Lire:Override')).not.toBeNull();
    });
    expect(screen.queryByText('de:Abspielen:Override')).toBeNull();
  });

  it('reports nested langRootRef locale from a callback-only ancestor', async () => {
    registerI18n('de', { Play: 'Abspielen' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.lang = 'de';

    const onActiveLocaleChange = vi.fn();
    const { I18nProvider, useLocale, useTranslator } = createI18n();
    const rootRef = createRef<HTMLDivElement>();

    function Probe(): ReactElement {
      return (
        <span>
          {useLocale()}:{useTranslator()('Play')}
        </span>
      );
    }

    render(
      <I18nProvider onActiveLocaleChange={onActiveLocaleChange}>
        <section lang="fr">
          <I18nProvider langRootRef={rootRef}>
            <div ref={rootRef}>
              <Probe />
            </div>
          </I18nProvider>
        </section>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('fr:Lire')).not.toBeNull();
      expect(onActiveLocaleChange).toHaveBeenCalledWith('fr');
    });
    expect(onActiveLocaleChange).not.toHaveBeenCalledWith('de');
  });

  it('shares locale root registration across createI18n providers', async () => {
    registerI18n('de', { Play: 'Abspielen' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.lang = 'de';

    const onActiveLocaleChange = vi.fn();
    const { I18nProvider, useLocale, useTranslator } = createI18n();
    const rootRef = createRef<HTMLDivElement>();

    function Probe(): ReactElement {
      return (
        <span>
          {useLocale()}:{useTranslator()('Play')}
        </span>
      );
    }

    render(
      <DefaultI18nProvider onActiveLocaleChange={onActiveLocaleChange}>
        <section lang="fr">
          <I18nProvider langRootRef={rootRef}>
            <div ref={rootRef}>
              <Probe />
            </div>
          </I18nProvider>
        </section>
      </DefaultI18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('fr:Lire')).not.toBeNull();
      expect(onActiveLocaleChange).toHaveBeenCalledWith('fr');
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onActiveLocaleChange).not.toHaveBeenCalledWith('de');
  });

  it('reports ancestor locale when nested langRootRef unmounts', async () => {
    registerI18n('de', { Play: 'Abspielen' });
    registerI18n('fr', { Play: 'Lire' });
    document.documentElement.lang = 'de';

    const onActiveLocaleChange = vi.fn();
    const { I18nProvider, useLocale, useTranslator } = createI18n();
    const rootRef = createRef<HTMLDivElement>();

    function Probe(): ReactElement {
      return (
        <span>
          {useLocale()}:{useTranslator()('Play')}
        </span>
      );
    }

    const { rerender } = render(
      <I18nProvider onActiveLocaleChange={onActiveLocaleChange}>
        <section lang="fr">
          <I18nProvider langRootRef={rootRef}>
            <div ref={rootRef}>
              <Probe />
            </div>
          </I18nProvider>
        </section>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('fr:Lire')).not.toBeNull();
      expect(onActiveLocaleChange).toHaveBeenCalledWith('fr');
    });

    rerender(
      <I18nProvider onActiveLocaleChange={onActiveLocaleChange}>
        <Probe />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('de:Abspielen')).not.toBeNull();
      expect(onActiveLocaleChange).toHaveBeenCalledWith('de');
    });
  });

  it('passes through when a nested provider only supplies langRootRef under an explicit locale', async () => {
    registerI18n('de', { Play: 'Abspielen' });

    const { I18nProvider, useTranslator } = createI18n();
    const rootRef = createRef<HTMLDivElement>();

    function Probe(): ReactElement {
      return <span>{useTranslator()('Play')}</span>;
    }

    render(
      <I18nProvider locale="de">
        <I18nProvider langRootRef={rootRef}>
          <div ref={rootRef}>
            <Probe />
          </div>
        </I18nProvider>
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Abspielen')).not.toBeNull();
    });
  });
});
