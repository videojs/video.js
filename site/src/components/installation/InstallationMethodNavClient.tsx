import {
  installationMethodsForFramework,
  resolveInstallationTemplate,
  sourceFrameworkFor,
  type InstallationFramework,
  type InstallationMethod,
} from '@videojs/installation';
import { navigate } from 'astro:transitions/client';
import clsx from 'clsx';
import type { ComponentType, MouseEvent, SVGProps } from 'react';

import Check from '@/assets/icons/check.svg?react';
import JsdelivrLogo from '@/assets/logos/brands/jsdelivr.svg?react';
import NpmLogo from '@/assets/logos/brands/npm.svg?react';
import ShadcnLogo from '@/assets/logos/brands/shadcn.svg?react';
import { DOCS_FRAMEWORK_NAVIGATION_INFO, savePageScrollForNavigation } from '@/utils/docs/navigation';
import {
  installationMethodBaseHref,
  isInstallationMethodAvailable,
  resolveInstallationMethodHref,
} from '@/utils/installation/method-navigation';
import { INSTALLATION_METHOD_OPTIONS } from '@/utils/installation/method-options';
import type { InstallationRouteSegment } from '@/utils/installation/routes';

import { useRegistryFramework } from './useRegistryFramework';
import { useInstallationSelection, useInstallationSelectionReady } from './useSelection';
import { withSelectionMarker } from './withSelectionMarker';

const ICONS = {
  packaged: NpmLogo,
  shadcn: ShadcnLogo,
  cdn: JsdelivrLogo,
} satisfies Record<InstallationMethod, ComponentType<SVGProps<SVGSVGElement>>>;

interface Props {
  currentFramework: InstallationFramework;
  route: InstallationRouteSegment;
}

function getActiveMethod(route: InstallationRouteSegment): InstallationMethod {
  if (route === 'shadcn' || route === 'cdn') return route;

  return 'packaged';
}

function InstallationMethodNavClient({ currentFramework, route }: Props) {
  const selection = useInstallationSelection();
  const registryFramework = useRegistryFramework(sourceFrameworkFor(currentFramework));
  const isSelectionReady = useInstallationSelectionReady();
  const framework = route === 'shadcn' ? registryFramework : currentFramework;
  const active = getActiveMethod(route);
  const items = INSTALLATION_METHOD_OPTIONS.filter(({ id }) => installationMethodsForFramework(framework).includes(id));

  const getMethodHref = (method: InstallationMethod) => {
    const baseHref = installationMethodBaseHref(method, framework);

    // The prerendered links name only the destination; the reader's picks join them once the stores hold them.
    if (!isSelectionReady) return baseHref;

    return resolveInstallationMethodHref(
      new URL(window.location.href),
      baseHref,
      method,
      { ...selection, framework, template: resolveInstallationTemplate(framework, selection.template) },
      route === 'shadcn' ? registryFramework : undefined
    );
  };

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>, href: string, available: boolean) => {
    if (!available) {
      event.preventDefault();
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const current = new URL(window.location.href);
    const target = new URL(href, current);

    event.preventDefault();

    if (target.href === current.href) return;

    const targetPath = `${target.pathname}${target.search}${target.hash}`;

    savePageScrollForNavigation(targetPath, '[data-installation-method-nav]');
    queueMicrotask(() => {
      void navigate(targetPath, {
        history: 'push',
        info: DOCS_FRAMEWORK_NAVIGATION_INFO,
      });
    });
  };

  return (
    <nav
      aria-label="Installation method"
      data-installation-method-nav
      data-ph-capture-attribute-location="installation-method-nav"
      data-shadcn-installation-method-nav={route === 'shadcn' ? '' : undefined}
      className="mx-auto mt-5 mb-12 grid w-full max-w-3xl auto-rows-fr gap-3 sm:grid-cols-3"
    >
      {items.map(({ id, label, description }) => {
        const Icon = ICONS[id];
        const href = getMethodHref(id);
        const available = isInstallationMethodAvailable(id, active, selection);
        const isActive = active === id;

        return (
          <a
            key={id}
            href={href}
            onClick={(event) => handleNavigation(event, href, available)}
            data-installation-method={id}
            aria-current={isActive ? 'page' : undefined}
            aria-disabled={available ? undefined : true}
            className={clsx(
              'group relative flex min-w-0 items-center gap-3 rounded-xl corner-squircle border bg-surface p-3 no-underline transition duration-150 ease-out select-none',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
              available
                ? 'intent:-translate-y-0.5 intent:shadow-md motion-reduce:intent:translate-y-0'
                : 'cursor-not-allowed opacity-50',
              isActive
                ? 'border-accent bg-surface-raised shadow-sm ring-1 ring-accent'
                : 'border-line ring-1 ring-transparent intent:border-line-strong'
            )}
          >
            <span
              aria-hidden="true"
              className="corner-squircle border-line bg-surface-raised text-faded-black dark:bg-faded-black dark:text-manila-light flex size-11 shrink-0 items-center justify-center rounded-lg border"
            >
              <Icon className="size-7" />
            </span>
            <span className="min-w-0 flex-1 pr-8">
              <span className="block font-semibold">{label}</span>
              <span className="text-p4 dark:text-muted mt-0.5 block">{description}</span>
            </span>
            <span
              aria-hidden="true"
              className={clsx(
                'absolute top-3 right-3 flex size-5 items-center justify-center rounded-full border transition',
                isActive
                  ? 'scale-100 border-accent bg-accent text-manila-light opacity-100'
                  : 'scale-75 border-line-strong bg-transparent text-transparent opacity-0 group-intent:opacity-100'
              )}
            >
              <Check className="size-4" />
            </span>
          </a>
        );
      })}
    </nav>
  );
}

export default withSelectionMarker(InstallationMethodNavClient);
