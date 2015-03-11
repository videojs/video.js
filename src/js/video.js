import document from 'global/document';

import MediaLoader from './media/loader';
import Html5 from './media/html5';
import Flash from './media/flash';
import PosterImage from './poster';
import { TextTrackDisplay } from './tracks/text-track-controls';
import LoadingSpinner from './loading-spinner';
import BigPlayButton from './big-play-button';
import ControlBar from './control-bar/control-bar';
import ErrorDisplay from './error-display';

import videojs from './core';
import * as setup from './setup';
import Component from './component';
import * as VjsLib from './lib';

if (typeof HTMLVideoElement === 'undefined') {
  document.createElement('video');
  document.createElement('audio');
  document.createElement('track');
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your video in the DOM (weird behavior only with minified version)
setup.autoSetupTimeout(1, videojs);

videojs.getComponent = Component.getComponent;
videojs.registerComponent = Component.registerComponent;

// Expose but deprecate the window[componentName] method for accessing components
VjsLib.obj.each(Component.components, function(name, component){
  // A deprecation warning as the constuctor
  module.exports[name] = function(player, options, ready){
    VjsLib.log.warn('Using videojs.'+name+' to access the '+name+' component has been deprecated. Please use videojs.getComponent("componentName")');

    return new Component(player, options, ready);
  };

  // Allow the prototype and class methods to be accessible still this way
  // Though anything that attempts to override class methods will no longer work
  VjsLib.obj.merge(module.exports[name], component);
});

export default videojs;
