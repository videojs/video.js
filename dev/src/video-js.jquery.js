/* jQuery Plugin
================================================================================ */
if (window.jQuery) {
  (function($) {

    $.fn.setupPlayer = function(options) {
      return VideoJS.setup(this[0], options);
    };

    // Deprecated
    $.fn.VideoJS = function(options) {
      this.each(function() {
        VideoJS.setup(this, options);
      });
      return this;
    };

    $.fn.player = function() {
      return this[0].player;
    };

  })(jQuery);
}

