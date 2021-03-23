/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import window from 'global/window';
import document from 'global/document';
import * as Fn from '../../src/js/utils/fn';

QUnit.module('videojs-integration');

/**
 * This test is very important for dom-data memory checking
 * as it runs through a basic player lifecycle for real.
 */
QUnit.test('create a real player and dispose', function(assert) {
  assert.timeout(30000);
  const done = assert.async();
  const fixture = document.getElementById('qunit-fixture');
  const old = {};

  // TODO: remove this code when we have a videojs debug build
  // see https://github.com/videojs/video.js/issues/5858
  old.bind = Fn.bind;

  Fn.stub_bind(function(context, fn, uid) {
    const retval = old.bind(context, fn, uid);

    retval.og_ = fn.og_ || fn;
    retval.cx_ = fn.cx_ || context;

    return retval;
  });

  old.throttle = Fn.throttle;
  Fn.stub_throttle(function(fn, wait) {
    const retval = old.throttle(fn, wait);

    retval.og_ = fn.og_ || fn;
    retval.cx_ = fn.cx_;

    return retval;
  });

  old.debounce = Fn.debounce;

  Fn.stub_debounce(function(func, wait, immediate, context = window) {
    const retval = old.debounce(func, wait, immediate, context);

    retval.og_ = func.og_ || func;
    retval.cx_ = func.cx_;

    return retval;
  });

  // TODO: use a local source rather than a remote one
  fixture.innerHTML = `
    <video-js
      id="vid1"
      controls
      preload="auto"
      width="640"
      height="264"
      poster="http://vjs.zencdn.net/v/oceans.png">
      <source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
      <source src="http://vjs.zencdn.net/v/oceans.webm" type="video/webm">
      <source src="http://vjs.zencdn.net/v/oceans.ogv" type="video/ogg">
      <track kind="captions" src="../docs/examples/shared/example-captions.vtt" srclang="en" label="English">
      <p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p>
    </video-js>
  `.trim();

  const player = videojs('vid1', {techOrder: ['html5']});

  player.muted(true);

  player.addTextTrack('captions', 'foo', 'en');
  player.ready(function() {
    assert.ok(player.tech_, 'tech exists');
    assert.equal(player.textTracks().length, 1, 'should have one text track');

    // only dispose after a timeout
    player.setTimeout(() => {
      player.dispose();

      Object.keys(old).forEach(function(k) {
        Fn[`stub_${k}`](old[k]);
      });
      done();
    }, 100);
  }, true);
});
