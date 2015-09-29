import Player from '../../src/js/player.js';
import TechFaker from './tech/tech-faker.js';
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
    playerOptions['techOrder'] = playerOptions['techOrder'] || ['techFaker'];

    return player = new Player(videoTag, playerOptions);
  },

  getComputedStyle: function(el, rule){
    if (document.defaultView && document.defaultView.getComputedStyle) {
      return document.defaultView.getComputedStyle(el, null).getPropertyValue(rule);
    }

    // IE8
    if (el.currentStyle) {
      if (rule === 'width' || rule === 'height') {
        // return clientWidth or clientHeight instead for better accuracy
        rule = 'client' + rule.substr(0, 1).toUpperCase() + rule.substr(1);
        return el[rule] + 'px';
      } else {
        return el.currentStyle[rule];
      }
    }
  }
};

export default TestHelpers;
