/**
 * @file global-options.js
 */
import document from 'global/document';
import window from 'global/window';
let navigator = window.navigator;

/*
 * Global Player instance options, surfaced from Player.prototype.options_
 * options = Player.prototype.options_
 * All options should use string keys so they avoid
 * renaming by closure compiler
 *
 * @type {Object}
 */
export default {
  // Default order of fallback technology
  'techOrder': ['html5','flash'],
  // techOrder: ['flash','html5'],

  'html5': {},
  'flash': {},

  // defaultVolume: 0.85,
  'defaultVolume': 0.00, // The freakin seaguls are driving me crazy!

  // default inactivity timeout
  'inactivityTimeout': 2000,

  // default playback rates
  'playbackRates': [],
  // Add playback rate selection by adding rates
  // 'playbackRates': [0.5, 1, 1.5, 2],

  // Included control sets
  'children': {
    'mediaLoader': {},
    'posterImage': {},
    'textTrackDisplay': {},
    'loadingSpinner': {},
    'bigPlayButton': {},
    'controlBar': {},
    'errorDisplay': {},
    'textTrackSettings': {}
  },

  'language': document.getElementsByTagName('html')[0].getAttribute('lang') || navigator.languages && navigator.languages[0] || navigator.userLanguage || navigator.language || 'en',

  // locales and their language translations
  'languages': {},

  // Default message to show when a video cannot be played.
  'notSupportedMessage': 'No compatible source was found for this video.'
};
