import Player from '../../src/js/player.js';
import MediaFaker from './mediafaker.js';
import window from 'global/window';
import document from 'global/document';

var TestHelpers = {
  makeTag: function(){
    var videoTag = document.createElement('video');
    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';
    return videoTag;
  },

  makePlayer: function(playerOptions, videoTag){
    var player;

    videoTag = videoTag || TestHelpers.makeTag();

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    playerOptions = playerOptions || {};
    playerOptions['techOrder'] = playerOptions['techOrder'] || ['mediaFaker'];

    return player = new Player(videoTag, playerOptions);
  },

  getComputedStyle: function(el, rule){
    var val;

    if(window.getComputedStyle){
      val = window.getComputedStyle(el, null).getPropertyValue(rule);
    // IE8
    } else if(el.currentStyle){
      val = el.currentStyle[rule];
    }

    return val;
  }
};

export default TestHelpers;