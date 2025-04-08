/**
 * @file text-track-display.js
 */
import Component from '../component';
import * as Fn from '../utils/fn.js';
import * as Dom from '../utils/dom.js';
import window from 'global/window';
import * as browser from '../utils/browser';

/** @import Player from '../player' */

const darkGray = '#222';
const lightGray = '#ccc';
const fontMap = {
  monospace: 'monospace',
  sansSerif: 'sans-serif',
  serif: 'serif',
  monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif: '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif: 'serif',
  casual: '"Comic Sans MS", Impact, fantasy',
  script: '"Monotype Corsiva", cursive',
  smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif'
};

/**
 * Construct an rgba color from a given hex color code.
 *
 * @param {number} color
 *        Hex number for color, like #f0e or #f604e2.
 *
 * @param {number} opacity
 *        Value for opacity, 0.0 - 1.0.
 *
 * @return {string}
 *         The rgba color that was created, like 'rgba(255, 0, 0, 0.3)'.
 */
export function constructColor(color, opacity) {
  let hex;

  if (color.length === 4) {
    // color looks like "#f0e"
    hex = color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  } else if (color.length === 7) {
    // color looks like "#f604e2"
    hex = color.slice(1);
  } else {
    throw new Error('Invalid color code provided, ' + color + '; must be formatted as e.g. #f0e or #f604e2.');
  }
  return 'rgba(' +
    parseInt(hex.slice(0, 2), 16) + ',' +
    parseInt(hex.slice(2, 4), 16) + ',' +
    parseInt(hex.slice(4, 6), 16) + ',' +
    opacity + ')';
}

/**
 * Try to update the style of a DOM element. Some style changes will throw an error,
 * particularly in IE8. Those should be noops.
 *
 * @param {Element} el
 *        The DOM element to be styled.
 *
 * @param {string} style
 *        The CSS property on the element that should be styled.
 *
 * @param {string} rule
 *        The style rule that should be applied to the property.
 *
 * @private
 */
function tryUpdateStyle(el, style, rule) {
  try {
    el.style[style] = rule;
  } catch (e) {

    // Satisfies linter.
    return;
  }
}

/**
 * Converts the CSS top/right/bottom/left property numeric value to string in pixels.
 *
 * @param {number} position
 *        The CSS top/right/bottom/left property value.
 *
 * @return {string}
 *          The CSS property value that was created, like '10px'.
 *
 * @private
 */
function getCSSPositionValue(position) {
  return position ? `${position}px` : '';
}

/**
 * The component for displaying text track cues.
 *
 * @extends Component
 */
class TextTrackDisplay extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Function} [ready]
   *        The function to call when `TextTrackDisplay` is ready.
   */
  constructor(player, options, ready) {
    super(player, options, ready);

    const updateDisplayTextHandler = (e) => this.updateDisplay(e);
    const updateDisplayHandler = (e) => {
      this.updateDisplayOverlay();
      this.updateDisplay(e);
    };

    player.on('loadstart', (e) => this.toggleDisplay(e));
    player.on('useractive', updateDisplayTextHandler);
    player.on('userinactive', updateDisplayTextHandler);
    player.on('texttrackchange', updateDisplayTextHandler);
    player.on('loadedmetadata', (e) => {
      this.updateDisplayOverlay();
      this.preselectTrack(e);
    });

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(Fn.bind_(this, function() {
      if (player.tech_ && player.tech_.featuresNativeTextTracks) {
        this.hide();
        return;
      }

      player.on('fullscreenchange', updateDisplayHandler);
      player.on('playerresize', updateDisplayHandler);

      const screenOrientation = window.screen.orientation || window;
      const changeOrientationEvent = window.screen.orientation ? 'change' : 'orientationchange';

      screenOrientation.addEventListener(changeOrientationEvent, updateDisplayHandler);
      player.on('dispose', () => screenOrientation.removeEventListener(changeOrientationEvent, updateDisplayHandler));

      const tracks = this.options_.playerOptions.tracks || [];

      for (let i = 0; i < tracks.length; i++) {
        this.player_.addRemoteTextTrack(tracks[i], true);
      }

      this.preselectTrack();
    }));
  }

  /**
  * Preselect a track following this precedence:
  * - matches the previously selected {@link TextTrack}'s language and kind
  * - matches the previously selected {@link TextTrack}'s language only
  * - is the first default captions track
  * - is the first default descriptions track
  *
  * @listens Player#loadstart
  */
  preselectTrack() {
    const modes = {captions: 1, subtitles: 1};
    const trackList = this.player_.textTracks();
    const userPref = this.player_.cache_.selectedLanguage;
    let firstDesc;
    let firstCaptions;
    let preferredTrack;

    for (let i = 0; i < trackList.length; i++) {
      const track = trackList[i];

      if (
        userPref && userPref.enabled &&
        userPref.language && userPref.language === track.language &&
        track.kind in modes
      ) {
        // Always choose the track that matches both language and kind
        if (track.kind === userPref.kind) {
          preferredTrack = track;
        // or choose the first track that matches language
        } else if (!preferredTrack) {
          preferredTrack = track;
        }

      // clear everything if offTextTrackMenuItem was clicked
      } else if (userPref && !userPref.enabled) {
        preferredTrack = null;
        firstDesc = null;
        firstCaptions = null;

      } else if (track.default) {
        if (track.kind === 'descriptions' && !firstDesc) {
          firstDesc = track;
        } else if (track.kind in modes && !firstCaptions) {
          firstCaptions = track;
        }
      }
    }

    // The preferredTrack matches the user preference and takes
    // precedence over all the other tracks.
    // So, display the preferredTrack before the first default track
    // and the subtitles/captions track before the descriptions track
    if (preferredTrack) {
      preferredTrack.mode = 'showing';
    } else if (firstCaptions) {
      firstCaptions.mode = 'showing';
    } else if (firstDesc) {
      firstDesc.mode = 'showing';
    }
  }

  /**
   * Turn display of {@link TextTrack}'s from the current state into the other state.
   * There are only two states:
   * - 'shown'
   * - 'hidden'
   *
   * @listens Player#loadstart
   */
  toggleDisplay() {
    if (this.player_.tech_ && this.player_.tech_.featuresNativeTextTracks) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Create the {@link Component}'s DOM element.
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-text-track-display'
    }, {
      'translate': 'yes',
      'aria-live': 'off',
      'aria-atomic': 'true'
    });
  }

  /**
   * Clear all displayed {@link TextTrack}s.
   */
  clearDisplay() {
    if (typeof window.WebVTT === 'function') {
      window.WebVTT.processCues(window, [], this.el_);
    }
  }

  /**
   * Update the displayed {@link TextTrack} when either a {@link Player#texttrackchange},
   * a {@link Player#fullscreenchange}, a {@link Player#useractive}, or a
   * {@link Player#userinactive} is fired.
   *
   * @listens Player#texttrackchange
   * @listens Player#fullscreenchange
   * @listens Player#useractive
   * @listens Player#userinactive
   */
  updateDisplay() {
    const tracks = this.player_.textTracks();
    const allowMultipleShowingTracks = this.options_.allowMultipleShowingTracks;

    this.clearDisplay();

    if (allowMultipleShowingTracks) {
      const showingTracks = [];

      for (let i = 0; i < tracks.length; ++i) {
        const track = tracks[i];

        if (track.mode !== 'showing') {
          continue;
        }
        showingTracks.push(track);
      }
      this.updateForTrack(showingTracks);
      return;
    }

    //  Track display prioritization model: if multiple tracks are 'showing',
    //  display the first 'subtitles' or 'captions' track which is 'showing',
    //  otherwise display the first 'descriptions' track which is 'showing'

    let descriptionsTrack = null;
    let captionsSubtitlesTrack = null;
    let i = tracks.length;

    while (i--) {
      const track = tracks[i];

      if (track.mode === 'showing') {
        if (track.kind === 'descriptions') {
          descriptionsTrack = track;
        } else {
          captionsSubtitlesTrack = track;
        }
      }
    }

    if (captionsSubtitlesTrack) {
      if (this.getAttribute('aria-live') !== 'off') {
        this.setAttribute('aria-live', 'off');
      }
      this.updateForTrack(captionsSubtitlesTrack);
    } else if (descriptionsTrack) {
      if (this.getAttribute('aria-live') !== 'assertive') {
        this.setAttribute('aria-live', 'assertive');
      }
      this.updateForTrack(descriptionsTrack);
    }

    if (!window.CSS.supports('inset', '10px')) {
      const textTrackDisplay = this.el_;
      const vjsTextTrackCues = textTrackDisplay.querySelectorAll('.vjs-text-track-cue');
      const controlBarHeight = this.player_.controlBar.el_.getBoundingClientRect().height;
      const playerHeight = this.player_.el_.getBoundingClientRect().height;

      // Clear inline style before getting actual height of textTrackDisplay
      textTrackDisplay.style = '';

      // textrack style updates, this styles are required to be inline
      tryUpdateStyle(textTrackDisplay, 'position', 'relative');
      tryUpdateStyle(textTrackDisplay, 'height', (playerHeight - controlBarHeight) + 'px');
      tryUpdateStyle(textTrackDisplay, 'top', 'unset');

      if (browser.IS_SMART_TV) {
        tryUpdateStyle(textTrackDisplay, 'bottom', playerHeight + 'px');
      } else {
        tryUpdateStyle(textTrackDisplay, 'bottom', '0px');
      }

      // vjsTextTrackCue style updates
      if (vjsTextTrackCues.length > 0) {
        vjsTextTrackCues.forEach((vjsTextTrackCue) => {
          // verify if inset styles are inline
          if (vjsTextTrackCue.style.inset) {
            const insetStyles = vjsTextTrackCue.style.inset.split(' ');

            // expected value is always 3
            if (insetStyles.length === 3) {
              Object.assign(vjsTextTrackCue.style, { top: insetStyles[0], right: insetStyles[1], bottom: insetStyles[2], left: 'unset' });
            }
          }
        });
      }
    }
  }

  /**
   * Updates the displayed TextTrack to be sure it overlays the video when a either
   * a {@link Player#texttrackchange} or a {@link Player#fullscreenchange} is fired.
   */
  updateDisplayOverlay() {
    // inset-inline and inset-block are not supprted on old chrome, but these are
    // only likely to be used on TV devices
    if (!this.player_.videoHeight() || !window.CSS.supports('inset-inline: 10px')) {
      return;
    }

    const playerWidth = this.player_.currentWidth();
    const playerHeight = this.player_.currentHeight();
    const playerAspectRatio = playerWidth / playerHeight;
    const videoAspectRatio = this.player_.videoWidth() / this.player_.videoHeight();
    let insetInlineMatch = 0;
    let insetBlockMatch = 0;

    if (Math.abs(playerAspectRatio - videoAspectRatio) > 0.1) {
      if (playerAspectRatio > videoAspectRatio) {
        insetInlineMatch = Math.round((playerWidth - playerHeight * videoAspectRatio) / 2);
      } else {
        insetBlockMatch = Math.round((playerHeight - playerWidth / videoAspectRatio) / 2);
      }
    }

    tryUpdateStyle(this.el_, 'insetInline', getCSSPositionValue(insetInlineMatch));
    tryUpdateStyle(this.el_, 'insetBlock', getCSSPositionValue(insetBlockMatch));
  }

  /**
   * Style {@Link TextTrack} activeCues according to {@Link TextTrackSettings}.
   *
   * @param {TextTrack} track
   *        Text track object containing active cues to style.
   */
  updateDisplayState(track) {
    const overrides = this.player_.textTrackSettings.getValues();
    const cues = track.activeCues;

    let i = cues.length;

    while (i--) {
      const cue = cues[i];

      if (!cue) {
        continue;
      }

      const cueDiv = cue.displayState;

      if (overrides.color) {
        cueDiv.firstChild.style.color = overrides.color;
      }
      if (overrides.textOpacity) {
        tryUpdateStyle(
          cueDiv.firstChild,
          'color',
          constructColor(
            overrides.color || '#fff',
            overrides.textOpacity
          )
        );
      }
      if (overrides.backgroundColor) {
        cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
      }
      if (overrides.backgroundOpacity) {
        tryUpdateStyle(
          cueDiv.firstChild,
          'backgroundColor',
          constructColor(
            overrides.backgroundColor || '#000',
            overrides.backgroundOpacity
          )
        );
      }
      if (overrides.windowColor) {
        if (overrides.windowOpacity) {
          tryUpdateStyle(
            cueDiv,
            'backgroundColor',
            constructColor(overrides.windowColor, overrides.windowOpacity)
          );
        } else {
          cueDiv.style.backgroundColor = overrides.windowColor;
        }
      }
      if (overrides.edgeStyle) {
        if (overrides.edgeStyle === 'dropshadow') {
          cueDiv.firstChild.style.textShadow = `2px 2px 3px ${darkGray}, 2px 2px 4px ${darkGray}, 2px 2px 5px ${darkGray}`;
        } else if (overrides.edgeStyle === 'raised') {
          cueDiv.firstChild.style.textShadow = `1px 1px ${darkGray}, 2px 2px ${darkGray}, 3px 3px ${darkGray}`;
        } else if (overrides.edgeStyle === 'depressed') {
          cueDiv.firstChild.style.textShadow = `1px 1px ${lightGray}, 0 1px ${lightGray}, -1px -1px ${darkGray}, 0 -1px ${darkGray}`;
        } else if (overrides.edgeStyle === 'uniform') {
          cueDiv.firstChild.style.textShadow = `0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}`;
        }
      }
      if (overrides.fontPercent && overrides.fontPercent !== 1) {
        const fontSize = window.parseFloat(cueDiv.style.fontSize);

        cueDiv.style.fontSize = (fontSize * overrides.fontPercent) + 'px';
        cueDiv.style.height = 'auto';
        cueDiv.style.top = 'auto';
      }
      if (overrides.fontFamily && overrides.fontFamily !== 'default') {
        if (overrides.fontFamily === 'small-caps') {
          cueDiv.firstChild.style.fontVariant = 'small-caps';
        } else {
          cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily];
        }
      }
    }
  }

  /**
   * Add an {@link TextTrack} to to the {@link Tech}s {@link TextTrackList}.
   *
   * @param {TextTrack|TextTrack[]} tracks
   *        Text track object or text track array to be added to the list.
   */
  updateForTrack(tracks) {
    if (!Array.isArray(tracks)) {
      tracks = [tracks];
    }
    if (typeof window.WebVTT !== 'function' ||
      tracks.every((track)=> {
        return !track.activeCues;
      })) {
      return;
    }

    const cues = [];

    // push all active track cues
    for (let i = 0; i < tracks.length; ++i) {
      const track = tracks[i];

      for (let j = 0; j < track.activeCues.length; ++j) {
        cues.push(track.activeCues[j]);
      }
    }

    // removes all cues before it processes new ones
    window.WebVTT.processCues(window, cues, this.el_);

    // add unique class to each language text track & add settings styling if necessary
    for (let i = 0; i < tracks.length; ++i) {
      const track = tracks[i];

      for (let j = 0; j < track.activeCues.length; ++j) {
        const cueEl = track.activeCues[j].displayState;

        Dom.addClass(cueEl, 'vjs-text-track-cue', 'vjs-text-track-cue-' + ((track.language) ? track.language : i));
        if (track.language) {
          Dom.setAttribute(cueEl, 'lang', track.language);
        }
      }
      if (this.player_.textTrackSettings) {
        this.updateDisplayState(track);
      }
    }
  }

}

Component.registerComponent('TextTrackDisplay', TextTrackDisplay);
export default TextTrackDisplay;
