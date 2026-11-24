import type { TransitionBeforePreparationEvent, TransitionBeforeSwapEvent } from 'astro:transitions/client';

import { currentFramework } from '@/stores/preferences';
import type { SupportedFramework } from '@/types/docs';
import { isShadcnInstallationUrl } from '@/utils/installation/routes';

import { getWebFrameworkPreferenceClient, setFrameworkPreferenceClient } from './preferences';
import { getFrameworkFromDocsUrl } from './routing';

const DOCS_SIDEBAR_ID = 'docs-sidebar';
const SIDEBAR_STORAGE_KEY = 'vjs-sidebar-state';
const PAGE_SCROLL_STORAGE_KEY = 'vjs-page-scroll';
const FRAMEWORK_NAVIGATION_ATTRIBUTE = 'data-docs-framework-navigation';

export const DOCS_FRAMEWORK_NAVIGATION_INFO = { docsNavigation: 'framework' } as const;

declare global {
  interface Window {
    __videojsDocsNavigationController?: AbortController;
  }

  interface DocumentEventMap {
    'astro:before-preparation': TransitionBeforePreparationEvent;
    'astro:before-swap': TransitionBeforeSwapEvent;
  }
}

type SidebarState = {
  sidebarScroll?: number;
};

type SavedPageScroll = {
  anchorSelector?: string;
  anchorTop?: number;
  url?: string;
  scrollY?: number;
};

type DocumentScrollPosition = {
  left: number;
  top: number;
};

function isFrameworkNavigation(info?: { docsNavigation?: string } | null): boolean {
  return info?.docsNavigation === 'framework';
}

function setFrameworkTransitionSuppressed(target: Document, suppressed: boolean): void {
  target.documentElement.toggleAttribute(FRAMEWORK_NAVIGATION_ATTRIBUTE, suppressed);
}

function getDocumentScrollPosition() {
  if (document.documentElement.hasAttribute('data-base-ui-scroll-locked')) {
    return { scrollX: document.body.scrollLeft, scrollY: document.body.scrollTop };
  }

  return { scrollX: window.scrollX, scrollY: window.scrollY };
}

function getReloadScrollPosition(): DocumentScrollPosition | null {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type !== 'reload') return null;

  const state = window.history.state;
  if (!state || typeof state !== 'object' || !Number.isFinite(state.index)) return null;

  if (!Number.isFinite(state.scrollX) || !Number.isFinite(state.scrollY)) return null;

  return { left: state.scrollX, top: state.scrollY };
}

function savePageScrollToHistory(): void {
  const state = window.history.state;
  if (!state || typeof state !== 'object' || !Number.isFinite(state.index)) return;

  const { scrollX, scrollY } = getDocumentScrollPosition();
  if (state.scrollX === scrollX && state.scrollY === scrollY) return;

  try {
    window.history.replaceState({ ...state, scrollX, scrollY }, '');
  } catch {
    // Scroll tracking should not interrupt navigation when history state is unavailable.
  }
}

function publishFramework(framework: SupportedFramework): void {
  currentFramework.set(framework);
  setFrameworkPreferenceClient(framework);
}

/** Publish the route framework before client islands render, then persist that authoritative value for future visits. */
export async function syncFrameworkPreferenceFromUrl(url: URL): Promise<void> {
  if (isShadcnInstallationUrl(url)) {
    // The Shadcn guide reads its framework from the query with rules that only installation pages need to load.
    const { resolveShadcnFramework } = await import('@/utils/installation/framework-navigation');
    const framework = resolveShadcnFramework(url, getWebFrameworkPreferenceClient() ?? 'react');

    if (framework) publishFramework(framework);

    return;
  }

  const framework = getFrameworkFromDocsUrl(url);

  if (framework) publishFramework(framework);
}

/** Preserve the reading position for a framework switch that replaces the current guide with its equivalent. */
export function savePageScrollForNavigation(url: string, anchorSelector?: string): void {
  try {
    const anchor = anchorSelector ? document.querySelector(anchorSelector) : null;
    const anchorTop = anchor?.getBoundingClientRect().top;

    window.sessionStorage.setItem(
      PAGE_SCROLL_STORAGE_KEY,
      JSON.stringify({
        ...(anchorSelector && Number.isFinite(anchorTop) ? { anchorSelector, anchorTop } : {}),
        url: new URL(url, window.location.origin).pathname,
        scrollY: getDocumentScrollPosition().scrollY,
      })
    );
  } catch {
    // Navigation should still work when storage is unavailable.
  }
}

function restoreSavedPageScroll(removeAfterRestore = true): boolean {
  try {
    const stored = window.sessionStorage.getItem(PAGE_SCROLL_STORAGE_KEY);
    if (!stored) return false;

    const { anchorSelector, anchorTop, url, scrollY }: SavedPageScroll = JSON.parse(stored);
    const matchesCurrentPath = url?.replace(/\/$/, '') === window.location.pathname.replace(/\/$/, '');

    if (!matchesCurrentPath || !Number.isFinite(scrollY ?? Number.NaN)) {
      window.sessionStorage.removeItem(PAGE_SCROLL_STORAGE_KEY);

      return false;
    }

    const anchor = anchorSelector ? document.querySelector(anchorSelector) : null;
    const destinationAnchorTop = anchor?.getBoundingClientRect().top;
    const top =
      Number.isFinite(anchorTop ?? Number.NaN) && Number.isFinite(destinationAnchorTop ?? Number.NaN)
        ? getDocumentScrollPosition().scrollY + (destinationAnchorTop! - anchorTop!)
        : scrollY!;

    window.scrollTo({ left: 0, top });
    savePageScrollToHistory();

    if (removeAfterRestore) {
      window.sessionStorage.removeItem(PAGE_SCROLL_STORAGE_KEY);
    }

    return true;
  } catch {
    return false;
  }
}

function readSidebarState(): SidebarState {
  try {
    const stored = sessionStorage.getItem(SIDEBAR_STORAGE_KEY);

    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('[Sidebar] Failed to restore state', error);

    return {};
  }
}

function saveSidebarState(): void {
  const aside = document.getElementById(DOCS_SIDEBAR_ID);
  if (!aside) return;

  try {
    sessionStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({ sidebarScroll: aside.scrollTop }));
  } catch (error) {
    console.error('[Sidebar] Failed to save state', error);
  }
}

/** Find the active link in the sidebar tree that is currently rendered. */
export function findVisibleActiveSidebarLink(aside: HTMLElement): HTMLElement | undefined {
  return Array.from(aside.querySelectorAll<HTMLElement>('a[aria-current="page"]')).find(
    (link) => link.getClientRects().length > 0
  );
}

function restoreSidebarState(): void {
  const state = readSidebarState();
  const aside = document.getElementById(DOCS_SIDEBAR_ID);
  if (!aside) return;

  const sidebarScroll = state.sidebarScroll;

  if (Number.isFinite(sidebarScroll ?? Number.NaN)) {
    aside.scrollTop = sidebarScroll ?? 0;
  }

  // Keep the active link in view when arriving from a different section. Scroll the sidebar alone because
  // scrollIntoView would also move the document. Multi-framework pages render one hidden sidebar per inactive
  // framework, so select the active link that participates in layout rather than the first match in DOM order.
  const activeLink = findVisibleActiveSidebarLink(aside);
  if (!activeLink) return;

  const asideRect = aside.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();

  if (linkRect.top < asideRect.top || linkRect.bottom > asideRect.bottom) {
    const linkCentre = linkRect.top + linkRect.height / 2;
    const asideCentre = asideRect.top + asideRect.height / 2;

    aside.scrollTop += linkCentre - asideCentre;
  }
}

export function initializeDocsNavigation(): void {
  window.__videojsDocsNavigationController?.abort();

  const controller = new AbortController();
  const { signal } = controller;
  let reloadScroll = getReloadScrollPosition();

  window.__videojsDocsNavigationController = controller;

  void syncFrameworkPreferenceFromUrl(new URL(window.location.href));

  const prepareNavigation = (navigationEvent: TransitionBeforePreparationEvent) => {
    // A client navigation supersedes the post-layout retry captured for the initial document reload.
    reloadScroll = null;
    setFrameworkTransitionSuppressed(document, isFrameworkNavigation(navigationEvent.info));
  };

  const prepareSwap = (navigationEvent: TransitionBeforeSwapEvent) => {
    // Astro has already chosen the destination by this boundary, but push/replace navigation still owns the departing
    // history entry. Repair it here in case an open Base UI popup moved the document offset onto the body.
    if (navigationEvent.navigationType !== 'traverse') {
      savePageScrollToHistory();
    }

    void syncFrameworkPreferenceFromUrl(navigationEvent.to);
    saveSidebarState();
    setFrameworkTransitionSuppressed(navigationEvent.newDocument, isFrameworkNavigation(navigationEvent.info));
  };

  const saveDocumentState = () => {
    savePageScrollToHistory();
    saveSidebarState();
  };

  const restoreReloadScroll = () => {
    if (!reloadScroll) return false;

    window.scrollTo(reloadScroll);

    return true;
  };

  document.addEventListener('astro:before-preparation', prepareNavigation, { signal });
  document.addEventListener('astro:before-swap', prepareSwap, { signal });
  document.addEventListener(
    'astro:after-swap',
    () => {
      restoreSidebarState();
      restoreSavedPageScroll(false);
    },
    { signal }
  );
  document.addEventListener(
    'astro:page-load',
    () =>
      requestAnimationFrame(() => {
        if (!restoreSavedPageScroll()) restoreReloadScroll();

        reloadScroll = null;
        setFrameworkTransitionSuppressed(document, false);
      }),
    { signal }
  );
  window.addEventListener('pageshow', restoreSidebarState, { signal });
  window.addEventListener('pagehide', saveDocumentState, { signal });

  restoreSidebarState();

  if (!restoreSavedPageScroll()) restoreReloadScroll();
}
