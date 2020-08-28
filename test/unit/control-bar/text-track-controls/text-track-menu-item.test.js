/* eslint-env qunit */
import TextTrackMenuItem from '../../../../src/js/control-bar/text-track-controls/text-track-menu-item.js';
import TestHelpers from '../../test-helpers.js';

QUnit.module('TextTrackMenuItem', {
  beforeEach(assert) {
    this.player = TestHelpers.makePlayer();
  },
  afterEach(assert) {
    this.player.dispose();
  }
});

QUnit.test('clicking should enable the selected track', function(assert) {
  assert.expect(2);

  const foo = this.player.addTextTrack('captions', 'foo', 'en');

  const fooItem = new TextTrackMenuItem(this.player, {
    track: foo
  });

  assert.strictEqual(foo.mode, 'disabled', 'track "foo" begins "disabled"');

  fooItem.trigger('click');

  assert.strictEqual(foo.mode, 'showing', 'clicking set track "foo" to "showing"');

  fooItem.dispose();
});

QUnit.test('clicking should disable non-selected tracks of the relevant kind(s)', function(assert) {
  assert.expect(16);

  const foo = this.player.addTextTrack('captions', 'foo', 'en');
  const bar = this.player.addTextTrack('captions', 'bar', 'es');
  const bip = this.player.addTextTrack('subtitles', 'bip', 'fr');
  const bop = this.player.addTextTrack('metadata', 'bop');

  bop.mode = 'hidden';

  const fooItem = new TextTrackMenuItem(this.player, {
    track: foo,
    kinds: ['captions', 'subtitles']
  });

  const barItem = new TextTrackMenuItem(this.player, {
    track: bar,
    kinds: ['captions', 'subtitles']
  });

  const bipItem = new TextTrackMenuItem(this.player, {
    track: bip,
    kinds: ['captions', 'subtitles']
  });

  assert.strictEqual(foo.mode, 'disabled', 'captions track "foo" begins "disabled"');
  assert.strictEqual(bar.mode, 'disabled', 'captions track "bar" begins "disabled"');
  assert.strictEqual(bip.mode, 'disabled', 'subtitles track "bip" begins "disabled"');
  assert.strictEqual(bop.mode, 'hidden', 'metadata track "bop" is "hidden"');

  barItem.trigger('click');

  assert.strictEqual(foo.mode, 'disabled', 'captions track "foo" is still "disabled"');
  assert.strictEqual(bar.mode, 'showing', 'captions track "bar" is now "showing"');
  assert.strictEqual(bip.mode, 'disabled', 'subtitles track "bip" is still "disabled"');
  assert.strictEqual(bop.mode, 'hidden', 'metadata track "bop" is still "hidden"');

  fooItem.trigger('click');

  assert.strictEqual(foo.mode, 'showing', 'captions track "foo" is now "showing"');
  assert.strictEqual(bar.mode, 'disabled', 'captions track "bar" is now "disabled"');
  assert.strictEqual(bip.mode, 'disabled', 'subtitles track "bip" is still "disabled"');
  assert.strictEqual(bop.mode, 'hidden', 'metadata track "bop" is still "hidden"');

  bipItem.trigger('click');

  assert.strictEqual(foo.mode, 'disabled', 'captions track "foo" is now "disabled"');
  assert.strictEqual(bar.mode, 'disabled', 'captions track "bar" is still "disabled"');
  assert.strictEqual(bip.mode, 'showing', 'subtitles track "bip" is now "showing"');
  assert.strictEqual(bop.mode, 'hidden', 'metadata track "bop" is still "hidden"');

  fooItem.dispose();
  barItem.dispose();
  bipItem.dispose();
});
