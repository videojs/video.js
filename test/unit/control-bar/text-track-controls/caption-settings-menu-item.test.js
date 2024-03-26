/* eslint-env qunit */
import CaptionSettingsMenuItem from '../../../../src/js/control-bar/text-track-controls/caption-settings-menu-item';
import TextTrackSelect from '../../../../src/js/tracks/text-track-select';
import TestHelpers from '../../test-helpers';
import sinon from 'sinon';

QUnit.module('SpatialNavigationKeys', {
  beforeEach() {
    // Ensure each test starts with a player that has spatial navigation enabled
    this.player = TestHelpers.makePlayer({
      controls: true,
      bigPlayButton: true,
      spatialNavigation: { enabled: true }
    });
    // Directly reference the instantiated SpatialNavigation from the player
    this.spatialNav = this.player.spatialNavigation;
    this.spatialNav.start();
  },
  afterEach() {
    if (this.spatialNav && this.spatialNav.isListening_) {
      this.spatialNav.stop();
    }
    this.player.dispose();
  }
});

QUnit.test('should call `searchForTrackSelect()` if spatial navigation is enabled on click event', function(assert) {
  const clickEvent = new MouseEvent('click', { // eslint-disable-line no-undef
    view: this.window,
    bubbles: true,
    cancelable: true
  });

  const CaptionSettingsMenuItemComponent = new CaptionSettingsMenuItem(this.player, { kind: 'captions' });

  const trackSelectSpy = sinon.spy(CaptionSettingsMenuItemComponent, 'searchForTrackSelect');

  const textTrackSelectComponent = new TextTrackSelect(this.player, {
    SelectOptions: ['Option 1', 'Option 2', 'Option 3'],
    legendId: '1',
    id: 1,
    labelId: '1'
  });

  this.spatialNav.updateFocusableComponents = () => [textTrackSelectComponent];

  CaptionSettingsMenuItemComponent.handleClick(clickEvent);

  assert.ok(trackSelectSpy.calledOnce);
});
