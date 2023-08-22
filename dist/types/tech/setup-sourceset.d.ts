export default setupSourceset;
/**
 * setup `sourceset` handling on the `Html5` tech. This function
 * patches the following element properties/functions:
 *
 * - `src` - to determine when `src` is set
 * - `setAttribute()` - to determine when `src` is set
 * - `load()` - this re-triggers the source selection algorithm, and can
 *              cause a sourceset.
 *
 * If there is no source when we are adding `sourceset` support or during a `load()`
 * we also patch the functions listed in `firstSourceWatch`.
 *
 * @param {Html5} tech
 *        The tech to patch
 */
declare function setupSourceset(tech: Html5): void;
//# sourceMappingURL=setup-sourceset.d.ts.map