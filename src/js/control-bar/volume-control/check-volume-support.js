const checkVolumeSupport = function(self, player) {
  // hide volume controls when they're not supported by the current tech
  if (player.tech_ && player.tech_.featuresVolumeControl === false) {
    self.addClass('vjs-hidden');
  }
  self.on(player, 'loadstart', function() {
    if (player.tech_.featuresVolumeControl === false) {
      self.addClass('vjs-hidden');
    } else {
      self.removeClass('vjs-hidden');
    }
  });
};

export default checkVolumeSupport;
