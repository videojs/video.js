<!-- GENERATED FROM SOURCE -->

# vjs.Html5

__EXTENDS__: [vjs.MediaTechController](vjs.MediaTechController.md)  
__DEFINED IN__: [src/js/media/html5.js#L12](https://github.com/videojs/video.js/blob/master/src/js/media/html5.js#L12)  

HTML5 Media Controller - Wrapper for HTML5 Media API

---

## INDEX

- [METHODS](#methods)
  - [canControlPlaybackRate](#cancontrolplaybackrate-static)
  - [canControlVolume](#cancontrolvolume-static)
  - [init](#init-player-options-ready-)
  - [isSupported](#issupported-static)
  - [supportsNativeTextTracks](#supportsnativetexttracks-static)

---

## METHODS

### canControlPlaybackRate() `STATIC`
> Check if playbackRate is supported in this browser/device.

##### RETURNS: 
* `[type]` [description]

_defined in_: [src/js/media/html5.js#L548](https://github.com/videojs/video.js/blob/master/src/js/media/html5.js#L548)

---

### canControlVolume() `STATIC`
> Check if the volume can be changed in this browser/device.
> Volume cannot be changed in a lot of mobile devices.
> Specifically, it can't be changed from 1 on iOS.

##### RETURNS: 
* `Boolean` 

_defined in_: [src/js/media/html5.js#L538](https://github.com/videojs/video.js/blob/master/src/js/media/html5.js#L538)

---

### init( player, options, ready )

##### PARAMETERS: 
* __player__ 
* __options__ 
* __ready__ 

_defined in_: [src/js/media/html5.js#L14](https://github.com/videojs/video.js/blob/master/src/js/media/html5.js#L14)

---

### isSupported() `STATIC`
> Check if HTML5 video is supported by this browser/device

##### RETURNS: 
* `Boolean` 

_defined in_: [src/js/media/html5.js#L436](https://github.com/videojs/video.js/blob/master/src/js/media/html5.js#L436)

---

### supportsNativeTextTracks() `STATIC`
> Check to see if native text tracks are supported by this browser/device

##### RETURNS: 
* `Boolean` 

_defined in_: [src/js/media/html5.js#L558](https://github.com/videojs/video.js/blob/master/src/js/media/html5.js#L558)

---

