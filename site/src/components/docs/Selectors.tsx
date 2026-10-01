import { useStore } from '@nanostores/react';
import { navigate } from 'astro:transitions/client';
import type { ReactNode } from 'react';

import Css3Logo from '@/assets/logos/brands/css3.svg?react';
import Html5Logo from '@/assets/logos/brands/html5.svg?react';
import ReactLogo from '@/assets/logos/brands/react.svg?react';
import TailwindLogo from '@/assets/logos/brands/tailwindcss.svg?react';
import { Select, type SelectOption } from '@/components/Select';
import { currentFramework as frameworkStore, currentStyle as styleStore } from '@/stores/preferences';
import type { AnySupportedStyle, SupportedFramework } from '@/types/docs';
import {
  FRAMEWORK_LABELS,
  FRAMEWORK_STYLES,
  getDefaultStyle,
  isValidFramework,
  isValidStyleForFramework,
  STYLE_LABELS,
  SUPPORTED_FRAMEWORKS,
} from '@/types/docs';
import { ANALYTICS_EVENTS, trackEvent } from '@/utils/analytics-events';
import { DOCS_FRAMEWORK_NAVIGATION_INFO, savePageScrollForNavigation } from '@/utils/docs/navigation';
import { setStylePreferenceClient, updateStyleAttribute } from '@/utils/docs/preferences';
import { resolveFrameworkChange } from '@/utils/docs/routing';
import { useHydratedStore } from '@/utils/useHydratedStore';
import useIsHydrated from '@/utils/useIsHydrated';

const FRAMEWORK_ICONS = {
  react: <ReactLogo className="size-4" />,
  html: <Html5Logo className="size-4" />,
} satisfies Record<SupportedFramework, ReactNode>;

const STYLE_ICONS = {
  css: <Css3Logo className="size-4" />,
} satisfies Record<AnySupportedStyle, ReactNode>;

function focusVisibleFrameworkSelector() {
  requestAnimationFrame(() => {
    const selector = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="select-framework"]')).find(
      (element) => element.getClientRects().length > 0
    );

    selector?.focus({ preventScroll: true });
  });
}

interface SelectorProps {
  currentFramework: SupportedFramework;
  currentSlug: string;
  registryFrameworkSelection?: boolean;
  className?: string;
}

export function Selectors({
  currentFramework,
  currentSlug,
  registryFrameworkSelection = false,
  className,
}: SelectorProps) {
  // The Shadcn guide publishes its query-backed framework as the site-wide preference.
  const selectedFramework = useHydratedStore(frameworkStore, currentFramework);
  const currentStyle = useStore(styleStore);
  const isHydrated = useIsHydrated();
  const displayedFramework = registryFrameworkSelection ? (selectedFramework ?? currentFramework) : currentFramework;

  // The store is empty on the server and on the client's first render alike, so both fall back to the framework's
  // default style. That keeps the markup identical through hydration and stops the trigger flashing empty on every
  // page load; PreferenceUpdater then swaps in the stored choice if it differs.
  const displayedStyle = isHydrated
    ? (currentStyle ?? getDefaultStyle(currentFramework))
    : getDefaultStyle(currentFramework);

  const handleFrameworkChange = (newFramework: SupportedFramework) => {
    if (!isValidFramework(newFramework) || newFramework === displayedFramework) return;

    trackEvent(ANALYTICS_EVENTS.docsPreferenceChanged, {
      preference: 'framework',
      value: newFramework,
      previous: displayedFramework,
    });

    if (registryFrameworkSelection) {
      // The installation stores are already loaded on the Shadcn guide; importing them here keeps them off other pages.
      void import('@/stores/registry').then(({ selectRegistryFramework }) => {
        selectRegistryFramework(newFramework);
        focusVisibleFrameworkSelector();
      });
      return;
    }

    const { url, shouldReplace } = resolveFrameworkChange({
      currentFramework,
      currentSlug,
      newFramework,
    });

    // Same page, other framework: keep the query so installation picks survive the switch.
    const target = shouldReplace ? url + window.location.search : url;

    if (shouldReplace) {
      savePageScrollForNavigation(url);
    }

    void navigate(target, {
      history: shouldReplace ? 'replace' : 'push',
      info: DOCS_FRAMEWORK_NAVIGATION_INFO,
    });
  };

  const handleStyleChange = (newStyle: AnySupportedStyle) => {
    if (!isValidStyleForFramework(currentFramework, newStyle)) return;

    if (newStyle !== displayedStyle) {
      trackEvent(ANALYTICS_EVENTS.docsPreferenceChanged, {
        preference: 'style',
        value: newStyle,
        previous: displayedStyle,
      });
    }

    // Update localStorage for this framework
    setStylePreferenceClient(currentFramework, newStyle);
    // Update DOM attribute
    updateStyleAttribute(newStyle);
    // Update nanostore for React components
    styleStore.set(newStyle);
  };

  const frameworkOptions = SUPPORTED_FRAMEWORKS.map((fw) => ({
    value: fw,
    label: FRAMEWORK_LABELS[fw],
    icon: FRAMEWORK_ICONS[fw],
  }));

  // Tailwind skins are on the roadmap; the disabled entry tells readers the styling axis exists without linking anywhere.
  const styleOptions: SelectOption<AnySupportedStyle | 'tailwind'>[] = [
    ...FRAMEWORK_STYLES[currentFramework].map((st) => ({
      value: st,
      label: STYLE_LABELS[st],
      icon: STYLE_ICONS[st],
    })),
    { value: 'tailwind', label: 'Tailwind (coming soon)', icon: <TailwindLogo className="size-4" />, disabled: true },
  ];

  return (
    <div className={className ?? 'border-line border-b px-6 py-5'}>
      <div className="mx-auto grid w-full max-w-3xl gap-4 sm:grid-cols-2 md:grid-cols-1">
        <div className="grid gap-1.5">
          <Select
            value={displayedFramework}
            onChange={(next) => next && handleFrameworkChange(next)}
            options={frameworkOptions}
            aria-label="Select framework"
            data-testid="select-framework"
            className="w-full"
          />
        </div>
        <div className="grid gap-1.5">
          <Select
            value={displayedStyle}
            onChange={(next) => next && next !== 'tailwind' && handleStyleChange(next)}
            options={styleOptions}
            aria-label="Select style"
            data-testid="select-style"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
