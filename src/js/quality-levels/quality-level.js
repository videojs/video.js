/**
 * A single QualityLevel.
 *
 * interface QualityLevel {
 *   readonly attribute DOMString id;
 *            attribute DOMString label;
 *   readonly attribute long width;
 *   readonly attribute long height;
 *   readonly attribute long bitrate;
 *            attribute boolean enabled;
 * };
 *
 * @class QualityLevel
 */
class QualityLevel {

  /**
   * Creates a QualityLevel
   *
   * @param {Representation|Object} representation The representation of the quality level
   * @param {string}   representation.id        Unique id of the QualityLevel
   * @param {number=}  representation.width     Resolution width of the QualityLevel
   * @param {number=}  representation.height    Resolution height of the QualityLevel
   * @param {number}   representation.bandwidth Bitrate of the QualityLevel
   * @param {number=}  representation.frameRate Frame-rate of the QualityLevel
   * @param {Function} representation.enabled   Callback to enable/disable QualityLevel
   */
  constructor(representation) {

    let level = this; // eslint-disable-line

    level.id = representation.id;
    level.label = level.id;
    level.width = representation.width;
    level.height = representation.height;
    level.bitrate = representation.bandwidth;
    level.frameRate = representation.frameRate;
    level.enabled_ = representation.enabled;

    Object.defineProperty(level, 'enabled', {
      /**
       * Get whether the QualityLevel is enabled.
       *
       * @return {boolean} True if the QualityLevel is enabled.
       */
      get() {
        return level.enabled_();
      },

      /**
       * Enable or disable the QualityLevel.
       *
       * @param {boolean} enable true to enable QualityLevel, false to disable.
       */
      set(enable) {
        level.enabled_(enable);
      }
    });

    return level;
  }
}
export default QualityLevel;
