/** OAuth popup utilities for the Mux uploader. */

export interface AuthPopupOptions {
  authorizationUrl: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Browsers automatically clamp popup dimensions to fit the OS work area (per MDN),
// so no guard is needed for small screens.
const POPUP_WIDTH = 1366;
const POPUP_HEIGHT = 768;

/**
 * Opens a centered OAuth popup and listens for completion.
 *
 * - Opens popup centered on screen
 * - Falls back to redirect if popup is blocked
 * - Validates message origin before calling onSuccess
 * - Returns cleanup function to remove listener
 */
export function initiateAuthPopup(options: AuthPopupOptions): () => void {
  const { authorizationUrl, onSuccess } = options;

  const left = (window.screen.width - POPUP_WIDTH) / 2;
  const top = (window.screen.height - POPUP_HEIGHT) / 2;

  const popup = window.open(
    authorizationUrl,
    'oauth-login',
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`
  );

  if (!popup) {
    // Popup blocked - fall back to redirect
    window.location.href = authorizationUrl;
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    // Validate origin for security
    if (event.origin !== window.location.origin) return;

    if (event.data?.type !== 'auth-complete') return;

    window.removeEventListener('message', handleMessage);
    onSuccess();
  };

  window.addEventListener('message', handleMessage);

  return () => {
    window.removeEventListener('message', handleMessage);
  };
}
