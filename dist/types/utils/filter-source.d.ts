export default filterSource;
/**
 * Filter out single bad source objects or multiple source objects in an
 * array. Also flattens nested source object arrays into a 1 dimensional
 * array of source objects.
 *
 * @param {Tech~SourceObject|Tech~SourceObject[]} src
 *        The src object to filter
 *
 * @return {Tech~SourceObject[]}
 *         An array of sourceobjects containing only valid sources
 *
 * @private
 */
declare function filterSource(src: any): Tech;
//# sourceMappingURL=filter-source.d.ts.map