import _ from 'lodash';
/**
 * Customizes _.merge behavior in `gruntOptions` to concatenate
 * arrays. This can be overridden on a per-call basis to
 *
 * @see https://lodash.com/docs#merge
 * @function GruntCustomizer
 * @private
 * @param  {Mixed} objectValue
 * @param  {Mixed} sourceValue
 * @return {Object}
 */
function gruntCustomizer(objectValue, sourceValue) {
  if (Array.isArray(objectValue)) {
    return objectValue.concat(sourceValue);
  }
}

/**
 * Creates a gruntOptions instance for the specific defaultOptions and gruntCustomizer
 *
 * @function browserifyGruntOptions
 * @private
 * @param  {Object} [options]
 * @param  {Function} [customizer=gruntCustomizer]
 *         If the default array-concatenation behavior is not desireable,
 *         pass _.noop or a unique customizer (https://lodash.com/docs#merge).
 *
 * @return {Function}
 */
function gruntOptionsMaker(defaultOptions, gruntCustomizer) {
  /**
   * Creates a unique object of Browserify Grunt task options.
   *
   * @function gruntOptions
   * @private
   * @param  {Object} [options]
   * @param  {Function} [customizer=browserifyGruntCustomizer]
   *         If the default array-concatenation behavior is not desireable,
   *         pass _.noop or a unique customizer (https://lodash.com/docs#merge).
   *
   * @return {Object}
   */
  return function gruntOptions(options = null, customizer = gruntCustomizer) {
    return _.merge({}, defaultOptions, options, customizer);
  }
};

export { gruntCustomizer, gruntOptionsMaker };
