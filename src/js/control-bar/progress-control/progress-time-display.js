/**
 * @file progress-time-display.js
 */
import Component from '../../component.js';
import { formatTime } from '../../utils/time.js';
import window from 'global/window';

/** @import Player from '../../player' */

// get the navigator from window
const navigator = window.navigator;

/**
 * Used by {@link SeekBar} to add a time tag element for screen-reader readability.
 *
 * @extends Component
 */
class ProgressTimeDisplay extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */

  constructor(player, options) {
    super(player, options);
    this.partEls_ = [];
  }

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const el = super.createEl('time', {className: 'vjs-progress-time-display'});

    el.setAttribute('datetime', '');
    el.setAttribute('tab-index', 0);
    el.setAttribute('id', 'vjs-current-time-display-label');
    el.style.display = 'none';
    return el;
  }
  /**
   * Update Time tag
   *
   * @param {Event} [event]
   *        The `update` event that caused this function to run.
   *
   */
  update(event) {
    const vjsTimeEl = this.el();

    const time = this.localize(
      'progress bar timing: currentTime={1} duration={2}',
      [this.getFormatTimeForScreenReader_(formatTime(this.player_.currentTime())),
        this.getFormatTimeForScreenReader_(formatTime(this.player_.duration()))],
      '{1} of {2}'
    );

    vjsTimeEl.textContent = time;
    vjsTimeEl.setAttribute('datetime', this._hhmmssToISO8601(this.player_.currentTime()));
  }

  /**
  * Formats a numerical value with a localized unit label based on the given locale.
  *
  * @param {number} value - The numerical value to be formatted.
  *  @param {string} unit - The unit of measurement (e.g., "second", "minute", "hour").
  * @param {string} [locale=navigator] - The locale to use for formatting (defaults to the browser's locale).
  * @return {string|null} - A formatted string with the localized number and unit, or null if the value is 0.
  *
  * @private
  *
  * @example
  * // Assuming `this.localize('time_units')` returns:
  * // { second: { one: "second", other: "seconds" } }
  * _formatLocalizedUnit(1, "second", "en-US"); // "1 second"
  * _formatLocalizedUnit(5, "second", "en-US"); // "5 seconds"
  * _formatLocalizedUnit(0, "second", "en-US"); // null
  */
  _formatLocalizedUnit(value, unit, locale = navigator.language) {
    const numberFormat = new Intl.NumberFormat(locale);
    const pluralRules = new Intl.PluralRules(locale);

    if (value === 0) {
      return null;
    }

    const pluralCategory = pluralRules.select(value);
    const unitLabels = this.localize('time_units', null, {
      hour: { one: 'hour', other: 'hours' },
      minute: { one: 'minute', other: 'minutes' },
      second: { one: 'second', other: 'seconds' }
    });

    if (typeof unitLabels === 'object') {
      const label = unitLabels[unit][pluralCategory] || unitLabels[unit].other;

      return `${numberFormat.format(value)} ${label}`;
    }
  }

  /**
  * Converts a time string (HH:MM:SS or MM:SS) into a screen-reader-friendly format.
  *
  * @param {string} isoDuration - The time string in "HH:MM:SS" or "MM:SS" format.
  * @return {string|null} - A human-readable, localized time string (e.g., "1 hour, 5 minutes, 30 seconds"),
  *                          or null if the input format is invalid.
  *
  * @example
  * // Assuming `_formatLocalizedUnit(1, 'hour')` returns "1 hour"
  * // and `_formatLocalizedUnit(5, 'minute')` returns "5 minutes":
  * getFormatTimeForScreenReader_("1:05:30"); // "1 hour, 5 minutes, 30 seconds"
  * getFormatTimeForScreenReader_("05:30");   // "5 minutes, 30 seconds"
  * getFormatTimeForScreenReader_("invalid"); // null
  */
  getFormatTimeForScreenReader_(isoDuration) {
    const regex = /^(?:(\d+):)?(\d+):(\d+)$/;

    const matches = isoDuration.match(regex);

    if (!matches) {
      return null;
    }

    const hours = matches[1] ? parseInt(matches[1], 10) : 0;
    const minutes = parseInt(matches[2], 10);
    const seconds = parseInt(matches[3], 10);
    const parts = [];

    if (hours) {
      parts.push(this._formatLocalizedUnit(hours, 'hour'));
    }
    if (minutes) {
      parts.push(this._formatLocalizedUnit(minutes, 'minute'));
    }
    if (seconds) {
      parts.push(this._formatLocalizedUnit(seconds, 'second'));
    }

    return parts.filter(Boolean).join(', ');
  }

  /**
   * Gets the time in ISO8601 for the datetime attribute of the time tag
   *
   * @param {string} totalSeconds - The time in hh:mm:ss forat
   * @return {string} - The time in ISO8601 format
   *
   * @private
   */
  _hhmmssToISO8601(totalSeconds) {
    totalSeconds = Math.floor(totalSeconds);

    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;

    let isoDuration = 'PT';

    if (hh > 0) {
      isoDuration += `${hh}H`;
    }

    if (mm > 0) {
      isoDuration += `${mm}M`;
    }
    if (ss > 0 || (hh === 0 && mm === 0)) {
      isoDuration += `${ss}S`;
    }
    return isoDuration;
  }

  dispose() {
    this.partEls_ = null;
    this.percentageEl_ = null;
    super.dispose();
  }

}
ProgressTimeDisplay.prototype.options_ = {
  children: []
};
Component.registerComponent('ProgressTimeDisplay', ProgressTimeDisplay);
export default ProgressTimeDisplay;
