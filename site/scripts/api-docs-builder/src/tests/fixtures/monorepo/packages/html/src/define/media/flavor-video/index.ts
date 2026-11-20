/**
 * Mock define directory with two engine flavors — mirrors `define/media/mux-video`.
 *
 * The index re-exports the primary flavor; `lite.ts` registers the same tag over another engine. Both are documented
 * on one reference, with rows only one flavor has marked by `flavors`.
 */
export * from './primary';
