/**
 * Check if muting volume is supported and if it isn't hide the mute toggle
 * button.
 *
 * @param {Component} self
 *        A reference to the mute toggle button
 *
 * @param {Player} player
 *        A reference to the player
 *
 * @private
 */
const checkMuteSupport = function(self, player) {
  // hide mute toggle button if it's not supported by the current tech
  if (player.tech_ && !player.tech_.featuresMuteControl) {
    self.addClass('vjs-hidden');
  }

  self.on(player, 'loadstart', function() {
    if (!player.tech_.featuresMuteControl) {
      self.addClass('vjs-hidden');
    } else {
      self.removeClass('vjs-hidden');
    }
  });
};

export default checkMuteSupport;
