// `mux-embed` declares its types only in an ambient file that its package metadata doesn't expose. The build replaces
// this file in `dist/dev` so consumers resolve them without loading a second ambient copy; see `vite.config.ts`.
/// <reference path="../node_modules/mux-embed/dist/types/mux-embed.d.ts" />
export type { Mux, Options } from 'mux-embed';
