/**
 * A helper function used by {@link checkVolumeSupport} to hide volume/mute toggle
 * button when the actions by them are unsopported in the current tech.
 *
 * @param {Component} self
 *        The component that should be hidden if volume is unsupported
 *
 * @param {Player} player
 *        A reference to the player
 *
 * @private
 */
const checkVolumeSupportHelper = function(self, player) {
  const isMuteToggle = self.name_ === 'MuteToggle';

  // hide volume panel if neither mute or volume control
  // is supported by the current tech
  if (player.tech_ && !player.tech_.featuresVolumeControl && !player.tech_.featuresMuteControl) {
    player.getChild('controlBar').getChild('volumePanel').addClass('vjs-hidden');
  // hide volume slider if volume control
  // is not supported by the current tech
  } else if (player.tech_ && !player.tech_.featuresVolumeControl && !isMuteToggle) {
    self.addClass('vjs-hidden');
    player.getChild('controlBar').getChild('volumePanel').addClass('vjs-mute-supported');
  // hide volume slider if volume control
  // if it's not supported by the current tech
  } else if (player.tech_ && !player.tech_.featuresMuteControl && isMuteToggle) {
    self.addClass('vjs-hidden');
  } else if (player.tech_) {
    self.removeClass('vjs-hidden');
  }
};

/**
 * Check if volume control is supported and if it isn't hide the
 * `Component` that was passed  using the `vjs-hidden` class.
 *
 * @param {Component} self
 *        The component that should be hidden if volume is unsupported
 *
 * @param {Player} player
 *        A reference to the player
 *
 * @private
 */
const checkVolumeSupport = function(self, player) {
  checkVolumeSupportHelper(self, player);

  self.on(player, 'loadstart', function() {
    checkVolumeSupportHelper(self, player);
  });
};

export default checkVolumeSupport;
