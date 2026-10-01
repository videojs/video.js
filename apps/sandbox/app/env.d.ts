/**
 * True when `packages/skins` is checked out beside the sandbox, so authored skins can be compiled. Set by
 * `vite.config.ts`.
 */
declare const __WORKSPACE_SKINS__: boolean;
declare const __REGISTRY_SKINS__: boolean;

/** The checkout the sandbox was served from, for the copied report; `unknown` where there is no git metadata. */
declare const __SANDBOX_BRANCH__: string;
declare const __SANDBOX_COMMIT__: string;

declare module '*.css';

// Authored skin modules, addressed by the compiler query; their exports are checked at runtime by name.
declare module '*&skin=default-video';
declare module '*&skin=neutral-video';
declare module '*&skin=default-live-video';
declare module '*&skin=neutral-live-video';
declare module '*&skin=default-live-audio';
declare module '*&skin=neutral-live-audio';
declare module '*&skin=default-audio';
declare module '*&skin=neutral-audio';
