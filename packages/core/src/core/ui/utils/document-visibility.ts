/** Whether a browser page is hidden. Platforms without a `document` never are. */
export function isDocumentHidden(): boolean {
  // SAFETY: the platform-neutral lib declares no `document`, so read it structurally where a browser provides one.
  return (globalThis as { document?: { hidden?: boolean } }).document?.hidden === true;
}
