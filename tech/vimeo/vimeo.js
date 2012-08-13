
var VimeoState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3
};

/* VideoJS-Vimeo - Vimeo iFrame Wrapper
================================================================================ */
_V_.vimeo = _V_.PlaybackTech.extend({

  init: function(player, options){
    this.player = player;

    var source = options.source;

    // Extract the Vimeo videoID from the source
    var videoId = this.getVideoId(source.src);

    // Which element to embed in
    var parentEl = options.parentEl;

    // Generate ID for iFrame
    var objId = player.el.id+"_vimeo_api";

    // Create an iFrame for the Vimeo player
    var iFrm = this.el = _V_.createElement("iframe", {
      id: objId + "_iframe",
      name: objId + "_iframe",
      className: "vjs-tech",
      scrolling: "no",
      marginWidth: 0,
      marginHeight: 0,
      frameBorder: 0,
      webkitAllowFullScreen: "",
      mozallowfullscreen: "",
      allowFullScreen: ""
    });

    var playerOptions = player.options;
    var optionsParams = options.params || {};

    // Setup player parameters
    this.player.apiArgs = {
      api: 1,
      byline: 0,
      portrait: 0,
      show_title: 0,
      show_byline: 0,
      show_portrait: 0,
      fullscreen: 1,
      player_id: objId + "_iframe",
      color: optionsParams.color || playerOptions.color || 'ffffff',
      autoplay: this.toBoolInt(optionsParams.autoplay || playerOptions.autoplay),
      loop: this.toBoolInt(optionsParams.loop || playerOptions.loop)
    };

    // Create a dummy object to hold Vimeo state in case any info is requested
    // before the iFrame loads
    this.player.vimeoInfo = {};

    // Add iFrame to player div
    _V_.insertFirst(iFrm, parentEl);

    this.loadPlayer(videoId);
  },

  loadPlayer: function(videoId){
    var baseUrl = (document.location.protocol == 'https:') ?
      'https://secure.vimeo.com/video/' :
      'http://player.vimeo.com/video/';

    // Wait until iFrame has loaded to initialize the API
    _V_.addEvent(this.el, "load", _V_.proxy(this, function(){
      // Initialize the Vimeo Player object
      this.vimeo = $f(this.el);

      // Create an object to track the state of the Vimeo player, since we can
      // only fetch information from the iFrame asynchronously
      this.player.vimeoInfo = {
        state: VimeoState.UNSTARTED,
        volume: 1,
        muted: false,
        muteVolume: 1,
        time: 0,
        duration: 0,
        buffered: 0,
        url: baseUrl + videoId,
        error: null
      };

      // Register Vimeo event handlers
      this.vimeo.addEvent('ready', _V_.vimeo.onReady);
      this.vimeo.addEvent('loadProgress', _V_.vimeo.onLoadProgress);
      this.vimeo.addEvent('playProgress', _V_.vimeo.onPlayProgress);
      this.vimeo.addEvent('play', _V_.vimeo.onPlay);
      this.vimeo.addEvent('pause', _V_.vimeo.onPause);
      this.vimeo.addEvent('finish', _V_.vimeo.onFinish);
      this.vimeo.addEvent('seek', _V_.vimeo.onSeek);
    }));

    // Set the iFrame URL to start loading the video
    this.el.src = baseUrl + videoId + "?" + this.makeQueryString(this.player.apiArgs);
  },

  destroy: function(){
    this.vimeo.api("unload");
    delete this.vimeo;
    this.el.parentNode.removeChild(this.el);
  },

  play: function(){ this.vimeo.api("play"); },
  pause: function(){ this.vimeo.api("pause"); },
  paused: function(){
    var state = this.player.vimeoInfo.state;
    return state !== VimeoState.PLAYING &&
           state !== VimeoState.BUFFERING;
  },

  src: function(src){
    var videoId = this.getVideoId(src);
    this.loadPlayer(videoId);
  },
  load: function(){ },
  poster: function(){
    // We could fetch the poster image using JSONP, but it would need to be
    // done ahead of time (and probably enabled only through a player param)
    return null;
  },

  currentTime: function(){ return this.player.vimeoInfo.time || 0; },
  setCurrentTime: function(seconds){ this.vimeo.api("seekTo", seconds); },

  duration: function(){ return this.player.vimeoInfo.duration || 0; },
  buffered: function(){
    return _V_.createTimeRange(0, this.player.vimeoInfo.buffered || 0);
  },

  volume: function(){
    return (this.player.vimeoInfo.muted) ?
      this.player.vimeoInfo.muteVolume :
      this.player.vimeoInfo.volume;
  },
  setVolume: function(percentAsDecimal){
    this.vimeo.api("setVolume", percentAsDecimal);
    this.player.vimeoInfo.volume = percentAsDecimal;
    this.player.triggerEvent("volumechange");
  },
  muted: function(){ return this.player.vimeoInfo.muted || false; },
  setMuted: function(muted){
    if (muted) {
      this.player.vimeoInfo.muteVolume = this.player.vimeoInfo.volume;
      this.setVolume(0);
    } else {
      this.setVolume(this.player.vimeoInfo.muteVolume);
    }
    this.player.vimeoInfo.muted = muted;
    this.player.triggerEvent("volumechange");
  },

  width: function(){ return this.el.offsetWidth; },
  height: function(){ return this.el.offsetHeight; },

  currentSrc: function(){ return this.player.vimeoInfo.url; },

  preload: function(){ return false; },
  setPreload: function(val){ },
  autoplay: function(){ return !!this.player.apiArgs.autoplay; },
  setAutoplay: function(val){ },
  loop: function(){ return !!this.player.apiArgs.loop; },
  setLoop: function(val){
    this.player.apiArgs.loop = (val ? 1 : 0);
    // We handle looping manually
    //this.vimeo.api("setLoop", val);
  },

  supportsFullScreen: function(){ return false; },
  enterFullScreen: function(){ return false; },

  error: function(){ return this.player.vimeoInfo.error; },
  seeking: function(){ return false; },
  ended: function(){ return this.player.vimeoInfo.state === VimeoState.ENDED; },
  videoWidth: function(){ return this.width(); },
  videoHeight: function(){ return this.height(); },
  controls: function(){ return this.player.options.controls; },
  defaultMuted: function(){ return false; },

  // Helpers ------------------------------------------------------------------

  makeQueryString: function(args) {
    var array = [];
    for (var key in args) {
      if (args.hasOwnProperty(key))
        array.push(encodeURIComponent(key) + "=" + encodeURIComponent(args[key]));
    }
    return array.join("&");
  },

  getVideoId: function(url) {
    return url.match(/vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/)[1];
  },

  toBoolInt: function(val) {
    return val ? 1 : 0;
  }
});

// Event callbacks ------------------------------------------------------------

_V_.vimeo.onReady = function(id) {
  var player = _V_.el(id).parentNode.player;
  player.tech.triggerReady();
  player.triggerReady();
  player.triggerEvent("canplay");
  _V_.vimeo.hideOverlay(player);

  // Hide our playback controls since we have no good way of hiding the Vimeo
  // controls
  player.controlBar.hide();
};

_V_.vimeo.onLoadProgress = function(data, id) {
  var player = _V_.el(id).parentNode.player;
  var durationUpdate = !player.vimeoInfo.duration;
  player.vimeoInfo.duration = data.duration;
  player.vimeoInfo.buffered = data.percent;
  player.triggerEvent("progress");
  if (durationUpdate) player.triggerEvent("durationchange");
};

_V_.vimeo.onPlayProgress = function(data, id) {
  var player = _V_.el(id).parentNode.player;
  player.vimeoInfo.time = data.seconds;
  player.triggerEvent("timeupdate");
};

_V_.vimeo.onPlay = function(id) {
  var player = _V_.el(id).parentNode.player;
  player.vimeoInfo.state = VimeoState.PLAYING;
  player.triggerEvent("play");
};

_V_.vimeo.onPause = function(id) {
  var player = _V_.el(id).parentNode.player;
  player.vimeoInfo.state = VimeoState.PAUSED;
  player.triggerEvent("pause");
};

_V_.vimeo.onFinish = function(id) {
  var player = _V_.el(id).parentNode.player;
  player.vimeoInfo.state = VimeoState.ENDED;
  player.triggerEvent("ended");
  _V_.vimeo.hideOverlay(player);
  
  // Vimeo looping doesn't seem to play well with VideoJS, so we need to
  // implement it manually here
  if (player.apiArgs.loop) {
    //player.tech.vimeo.api("seekTo", 0);
    player.tech.vimeo.api("play");
  } else {
    // Reset the video
    player.tech.vimeo.api("seekTo", 0);
    player.tech.vimeo.api("play");
    player.tech.vimeo.api("pause");
  }
};

_V_.vimeo.onSeek = function(data, id) {
  var player = _V_.el(id).parentNode.player;
  player.vimeoInfo.time = data.seconds;
  player.triggerEvent("timeupdate");
  player.triggerEvent("seeked");
};

// Helpers --------------------------------------------------------------------

_V_.vimeo.hideOverlay = function(player) {
  // Hide the big play button and poster since Vimeo provides these. Using
  // our own prevents the video from playing on the first click in mobile
  // devices
  player.bigPlayButton.hide();
  player.posterImage.hide();
};

// Support testing ------------------------------------------------------------

_V_.vimeo.isSupported = function(){
  return true;
};

_V_.vimeo.canPlaySource = function(srcObj){
  return srcObj.type == "video/vimeo";
};

_V_.vimeo.prototype.support = {
  formats: {
    "video/vimeo": "VIM"
  },

  // Optional events that we can manually mimic with timers
  progressEvent: true,
  timeupdateEvent: true,

  //fullscreen: true,
  // In iOS, if you move a video element in the DOM, it breaks video playback.
  movingElementInDOM: !_V_.isIOS(),

  fullscreenResize: true,
  parentResize: true
};

// Froogaloop API -------------------------------------------------------------

// From https://github.com/vimeo/player-api/blob/master/javascript/froogaloop.js
var Froogaloop = (function(){
    // Define a local copy of Froogaloop
    function Froogaloop(iframe) {
        // The Froogaloop object is actually just the init constructor
        return new Froogaloop.fn.init(iframe);
    }

    var eventCallbacks = {},
        hasWindowEvent = false,
        isReady = false,
        slice = Array.prototype.slice,
        playerDomain = '';

    Froogaloop.fn = Froogaloop.prototype = {
        element: null,

        init: function(iframe) {
            if (typeof iframe === "string") {
                iframe = document.getElementById(iframe);
            }

            this.element = iframe;

            // Register message event listeners
            playerDomain = getDomainFromUrl(this.element.getAttribute('src'));

            return this;
        },

        /*
         * Calls a function to act upon the player.
         *
         * @param {string} method The name of the Javascript API method to call. Eg: 'play'.
         * @param {Array|Function} valueOrCallback params Array of parameters to pass when calling an API method
         *                                or callback function when the method returns a value.
         */
        api: function(method, valueOrCallback) {
            if (!this.element || !method) {
                return false;
            }

            var self = this,
                element = self.element,
                target_id = element.id !== '' ? element.id : null,
                params = !isFunction(valueOrCallback) ? valueOrCallback : null,
                callback = isFunction(valueOrCallback) ? valueOrCallback : null;

            // Store the callback for get functions
            if (callback) {
                storeCallback(method, callback, target_id);
            }

            postMessage(method, params, element);
            return self;
        },

        /*
         * Registers an event listener and a callback function that gets called when the event fires.
         *
         * @param eventName (String): Name of the event to listen for.
         * @param callback (Function): Function that should be called when the event fires.
         */
        addEvent: function(eventName, callback) {
            if (!this.element) {
                return false;
            }

            var self = this,
                element = self.element,
                target_id = element.id !== '' ? element.id : null;


            storeCallback(eventName, callback, target_id);

            // The ready event is not registered via postMessage. It fires regardless.
            if (eventName != 'ready') {
                postMessage('addEventListener', eventName, element);
            }
            else if (eventName == 'ready' && isReady) {
                callback.call(null, target_id);
            }

            return self;
        },

        /*
         * Unregisters an event listener that gets called when the event fires.
         *
         * @param eventName (String): Name of the event to stop listening for.
         */
        removeEvent: function(eventName) {
            if (!this.element) {
                return false;
            }

            var self = this,
                element = self.element,
                target_id = element.id !== '' ? element.id : null,
                removed = removeCallback(eventName, target_id);

            // The ready event is not registered
            if (eventName != 'ready' && removed) {
                postMessage('removeEventListener', eventName, element);
            }
        }
    };

    /**
     * Handles posting a message to the parent window.
     *
     * @param method (String): name of the method to call inside the player. For api calls
     * this is the name of the api method (api_play or api_pause) while for events this method
     * is api_addEventListener.
     * @param params (Object or Array): List of parameters to submit to the method. Can be either
     * a single param or an array list of parameters.
     * @param target (HTMLElement): Target iframe to post the message to.
     */
    function postMessage(method, params, target) {
        if (!target.contentWindow.postMessage) {
            return false;
        }

        var url = target.getAttribute('src').split('?')[0],
            data = JSON.stringify({
                method: method,
                value: params
            });

        if (url.substr(0, 2) === '//') {
            url = window.location.protocol + url;
        }

        target.contentWindow.postMessage(data, url);
    }

    /**
     * Event that fires whenever the window receives a message from its parent
     * via window.postMessage.
     */
    function onMessageReceived(event) {
        var data, method;

        try {
            data = JSON.parse(event.data);
            method = data.event || data.method;
        }
        catch(e)  {
            //fail silently... like a ninja!
        }

        if (method == 'ready' && !isReady) {
            isReady = true;
        }

        // Handles messages from moogaloop only
        if (event.origin != playerDomain) {
            return false;
        }

        var value = data.value,
            eventData = data.data,
            target_id = target_id === '' ? null : data.player_id,

            callback = getCallback(method, target_id),
            params = [];

        if (!callback) {
            return false;
        }

        if (value !== undefined) {
            params.push(value);
        }

        if (eventData) {
            params.push(eventData);
        }

        if (target_id) {
            params.push(target_id);
        }

        return params.length > 0 ? callback.apply(null, params) : callback.call();
    }


    /**
     * Stores submitted callbacks for each iframe being tracked and each
     * event for that iframe.
     *
     * @param eventName (String): Name of the event. Eg. api_onPlay
     * @param callback (Function): Function that should get executed when the
     * event is fired.
     * @param target_id (String) [Optional]: If handling more than one iframe then
     * it stores the different callbacks for different iframes based on the iframe's
     * id.
     */
    function storeCallback(eventName, callback, target_id) {
        if (target_id) {
            if (!eventCallbacks[target_id]) {
                eventCallbacks[target_id] = {};
            }
            eventCallbacks[target_id][eventName] = callback;
        }
        else {
            eventCallbacks[eventName] = callback;
        }
    }

    /**
     * Retrieves stored callbacks.
     */
    function getCallback(eventName, target_id) {
        if (target_id) {
            return eventCallbacks[target_id][eventName];
        }
        else {
            return eventCallbacks[eventName];
        }
    }

    function removeCallback(eventName, target_id) {
        if (target_id && eventCallbacks[target_id]) {
            if (!eventCallbacks[target_id][eventName]) {
                return false;
            }
            eventCallbacks[target_id][eventName] = null;
        }
        else {
            if (!eventCallbacks[eventName]) {
                return false;
            }
            eventCallbacks[eventName] = null;
        }

        return true;
    }

    /**
     * Returns a domain's root domain.
     * Eg. returns http://vimeo.com when http://vimeo.com/channels is sbumitted
     *
     * @param url (String): Url to test against.
     * @return url (String): Root domain of submitted url
     */
    function getDomainFromUrl(url) {
        if (url.substr(0, 2) === '//') {
            url = window.location.protocol + url;
        }

        var url_pieces = url.split('/'),
            domain_str = '';

        for(var i = 0, length = url_pieces.length; i < length; i++) {
            if(i<3) {domain_str += url_pieces[i];}
            else {break;}
            if(i<2) {domain_str += '/';}
        }

        return domain_str;
    }

    function isFunction(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    }

    function isArray(obj) {
        return toString.call(obj) === '[object Array]';
    }

    // Give the init function the Froogaloop prototype for later instantiation
    Froogaloop.fn.init.prototype = Froogaloop.fn;

    // Listens for the message event.
    // W3C
    if (window.addEventListener) {
        window.addEventListener('message', onMessageReceived, false);
    }
    // IE
    else {
        window.attachEvent('onmessage', onMessageReceived);
    }

    // Expose froogaloop to the global object
    return (window.Froogaloop = window.$f = Froogaloop);

})();
