import { useSyncExternalStore } from 'react';

import { selectionAtoms } from '@/stores/installation';
import { DEFAULT_SELECTION, type InstallationUiSelection } from '@/utils/installation/url-state';
import { useHydratedStore } from '@/utils/useHydratedStore';

/** Read one installation pick, hydrating with `serverValue` and then switching to the URL-backed store value. */
export function useSelection<K extends keyof InstallationUiSelection>(
  key: K,
  serverValue: InstallationUiSelection[K] = DEFAULT_SELECTION[key]
): InstallationUiSelection[K] {
  return useHydratedStore(selectionAtoms[key], serverValue);
}

/** Read every installation pick, for islands that pass the whole selection on, such as to build a guide's URL. */
export function useInstallationSelection(): InstallationUiSelection {
  return {
    framework: useSelection('framework'),
    template: useSelection('template'),
    project: useSelection('project'),
    useCase: useSelection('useCase'),
    skin: useSelection('skin'),
    media: useSelection('media'),
    extensions: useSelection('extensions'),
    sourceUrl: useSelection('sourceUrl'),
    installMethod: useSelection('installMethod'),
    styling: useSelection('styling'),
  };
}

function subscribeToNothing(): () => void {
  return () => {};
}

/**
 * Whether this render shows the stores' picks instead of the prerendered defaults. The stores read the URL when they
 * load, before any island renders, so only hydration renders the defaults. The value turns `true` in the same update
 * that replaces the server snapshots from {@link useSelection}.
 */
export function useInstallationSelectionReady(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
}
