import Component from '../component';
import Menu from '../menu/menu.js';
import MenuItem from '../menu/menu-item.js';
import MenuButton from '../menu/menu-button.js';
import * as Fn from '../utils/fn.js';
import document from 'global/document';
import window from 'global/window';

const darkGray = '#222';
const lightGray = '#ccc';
const fontMap = {
  monospace:             'monospace',
  sansSerif:             'sans-serif',
  serif:                 'serif',
  monospaceSansSerif:    '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif:        '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif:     'serif',
  casual:                '"Comic Sans MS", Impact, fantasy',
  script:                '"Monotype Corsiva", cursive',
  smallcaps:             '"Andale Mono", "Lucida Console", monospace, sans-serif'
};

/**
 * The component for displaying text track cues
 *
 * @constructor
 */
class TextTrackDisplay extends Component {

  constructor(player, options, ready){
    super(player, options, ready);

    player.on('loadstart', Fn.bind(this, this.toggleDisplay));
    player.on('texttrackchange', Fn.bind(this, this.toggleDisplay));

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(Fn.bind(this, function() {
      if (player.tech && player.tech['featuresNativeTextTracks']) {
        this.hide();
        return;
      }

      player.on('fullscreenchange', Fn.bind(this, this.updateDisplay));

      let tracks = this.options_.playerOptions['tracks'] || [];
      for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i];
        this.player_.addRemoteTextTrack(track);
      }
    }));
  }

  toggleDisplay() {
    if (this.player_.tech && this.player_.tech['featuresNativeTextTracks']) {
      this.hide();
    } else {
      this.show();
    }
  }

  createEl() {
    return super.createEl('div', {
      className: 'vjs-text-track-display'
    });
  }

  clearDisplay() {
    if (typeof window['WebVTT'] === 'function') {
      window['WebVTT']['processCues'](window, [], this.el_);
    }
  }

  updateDisplay() {
    var tracks = this.player_.textTracks();

    this.clearDisplay();

    if (!tracks) {
      return;
    }

    for (let i=0; i < tracks.length; i++) {
      let track = tracks[i];
      if (track['mode'] === 'showing') {
        this.updateForTrack(track);
      }
    }
  }

  updateForTrack(track) {
    if (typeof window['WebVTT'] !== 'function' || !track['activeCues']) {
      return;
    }

    let overrides = this.player_['textTrackSettings'].getValues();

    let cues = [];
    for (let i = 0; i < track['activeCues'].length; i++) {
      cues.push(track['activeCues'][i]);
    }

    window['WebVTT']['processCues'](window, track['activeCues'], this.el_);

    let i = cues.length;
    while (i--) {
      let cueDiv = cues[i].displayState;
      if (overrides.color) {
        cueDiv.firstChild.style.color = overrides.color;
      }
      if (overrides.textOpacity) {
        tryUpdateStyle(cueDiv.firstChild,
                       'color',
                       constructColor(overrides.color || '#fff',
                                      overrides.textOpacity));
      }
      if (overrides.backgroundColor) {
        cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
      }
      if (overrides.backgroundOpacity) {
        tryUpdateStyle(cueDiv.firstChild,
                       'backgroundColor',
                       constructColor(overrides.backgroundColor || '#000',
                                      overrides.backgroundOpacity));
      }
      if (overrides.windowColor) {
        if (overrides.windowOpacity) {
          tryUpdateStyle(cueDiv,
                         'backgroundColor',
                         constructColor(overrides.windowColor, overrides.windowOpacity));
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
        cueDiv.style.bottom = '2px';
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

}

// Add cue HTML to display
function constructColor(color, opacity) {
  return 'rgba(' +
    // color looks like "#f0e"
    parseInt(color[1] + color[1], 16) + ',' +
    parseInt(color[2] + color[2], 16) + ',' +
    parseInt(color[3] + color[3], 16) + ',' +
    opacity + ')';
}

function tryUpdateStyle(el, style, rule) {
  // some style changes will throw an error, particularly in IE8. Those should be noops.
  try {
    el.style[style] = rule;
  } catch (e) {}
}

Component.registerComponent('TextTrackDisplay', TextTrackDisplay);
export default TextTrackDisplay;
