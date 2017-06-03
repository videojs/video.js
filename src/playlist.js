_V_.PlaylistEngine = _V_.Class.extend({
  init: function(player, videos) {
    this.player = player;
    this.videos = videos;
    this.currentIndex = 0;
  },

  play: function(index) {
    if (this.videos.length > 1) {
      this.currentIndex = index;
      this.updateVideo();
    } else {
      throw new Error("Playlist is empty");
    };
  },

  pause: function() {
    this.player.pause();
  },

  next: function() {
    this.incrementCurrentIndex();
    this.updateVideo();
  },

  prev: function() {
    this.decrementCurrentIndex();
    this.updateVideo();
  },

  reload: function() {
    this.pause();
    this.player.load();
    var that = this;
    setTimeout(function() { that.player.play() }, 500);
  },

  incrementCurrentIndex: function() {
    this.currentIndex++;
    // play first video when playlist reaches end
    if (this.currentIndex >= this.videos.length) {
      this.currentIndex = 0;
    };
  },

  decrementCurrentIndex: function() {
    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.videos.length - 1;
    };
  },

  updateVideo: function() {
    this.updateVideoSrc();
    this.updateVideoPoster();
    this.reload();
  },

  updateVideoSrc: function() {
    var sources = this.videos[this.currentIndex].sources();
    // check new sources
    this.player.src(sources);
    this.player.triggerReady();
  },

  updateVideoPoster: function() {
    var newPoster = this.videos[this.currentIndex].poster();
    this.player.tag.poster = newPoster;
  }
});

_V_.Playlist = _V_.Component.extend({
  init: function(player, options) {
    this._super(player, options);

    // attach playlist to the player
    this.player.playlist = this;

    this.videos = this.getVideos();
    // attach engine
    this.engine = new _V_.PlaylistEngine(this.player, this.videos);
    this.show();
  },

  play:  function(index) { this.engine.play(index) },
  pause: function() { this.player.pause() },
  next:  function() { this.playlist.next() },
  prev:  function() { this.playlist.prev() },

  show: function() {
    this.enableWebkitScrollbar();
    this.setWrapperWidth();
    this.setWidth(this.player.width())

    this.setPosition();
    this._super();
  },

  createElement: function() {
    this.wrapperEl = this.findPlaylistEl();

    var id = this.wrapperEl.attributes.id.value;
    // transform it into the wrapper tag
    this.wrapperEl.removeAttribute('id');
    this.wrapperEl.setAttribute('class', "playlist-wrapper");

    var el = this._super("div", { id: id });

    // add playlist-wrapper to main playlist tag
    el.appendChild(this.wrapperEl);
    return el;
  },

  findPlaylistEl: function() {
    var el = document.getElementById(this.player.el.id + "_playlist");
    if (!el) { throw Error("Playlist element not found") };
    return el;
  },

  hasScrollbar: function() {
    var wrapperWidth = parseInt(this.wrapperEl.style.width);
    var width = parseInt(this.el.style.width);
    return wrapperWidth > width;
  },

  enableWebkitScrollbar: function() {
    // webkit scrollbar doesn't work nice on my android tablet..
    if (_V_.isAndroid()) {
      var cssClass = "vjs-playlist";
    } else {
      var cssClass = "vjs-playlist webkit-scrollbar";
    };
    _V_.addClass(this.el, cssClass);
  },

  getVideos: function() {
    if (this.videos) {
      return this.videos;
    } else {
      this.videos = [];
      var videoTags = this.wrapperEl.children;
      for (var i=0; i < videoTags.length; i++) {
        var thumb = new _V_.PlaylistThumb(this.player, {
          el: videoTags[i],
          index: i
        });
        this.videos.push(thumb);
      };
    };
    return this.videos;
  },

  setWidth: function(width) {
    this.el.style.width = width + "px";
  },

  setWrapperWidth: function() {
    // calculate width based on number of thumbs in the playlist
    this.wrapperEl.style.width = this.calculateWrapperWidth() + "px";
  },

  calculateWrapperWidth: function() {
    return (this.videos.length * 155);
  },

  setPosition: function() {
    if (this.hasScrollbar() && !(_V_.isAndroid())) {
      var val = "-134px";
    } else {
      var val = "-124px";
    };
    this.el.style.bottom = val;
    // add extra margin to main tag when many videos are embeded
    this.player.el.style.marginBottom = val.slice(1);
  },
});

_V_.PlaylistThumb = _V_.Component.extend({
  init: function(player, options) {
    this._super(player, options);

    this.index = options.index;
    _V_.addEvent(this.el, "click", _V_.proxy(this, this.onClick));
  },

  onClick: function() {
    this.player.playlist.play(this.index);
  },

  sources: function() {
    return JSON.parse(this.el.dataset['sources']);
  },

  poster: function() {
    return this.el.dataset['poster'];
  }
});
