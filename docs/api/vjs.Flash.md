<!-- GENERATED FROM SOURCE -->

# vjs.Flash

__EXTENDS__: [vjs.MediaTechController](vjs.MediaTechController.md)  
__DEFINED IN__: [src/js/media/flash.js#L15](https://github.com/videojs/video.js/blob/master/src/js/media/flash.js#L15)  

Flash Media Controller - Wrapper for fallback SWF API

---

## INDEX

- [METHODS](#methods)
  - [init](#init-player-options-ready-)

- [UNDEFINED](#undefined)
  - [nativeSourceHandler](#nativesourcehandler-static)
  - [rtmpSourceHandler](#rtmpsourcehandler-static)

---

## METHODS

### init( player, options, ready )

##### PARAMETERS: 
* __player__ 
* __options__ 
* __ready__ 

_defined in_: [src/js/media/flash.js#L17](https://github.com/videojs/video.js/blob/master/src/js/media/flash.js#L17)

---

## UNDEFINED

### nativeSourceHandler `STATIC`
> The default native source handler.
> This simply passes the source to the video element. Nothing fancy.

##### PARAMETERS: 
* __source__ `Object` The source object
* __tech__ `vjs.Flash` The instance of the Flash tech

_defined in_: [src/js/media/flash.js#L229](https://github.com/videojs/video.js/blob/master/src/js/media/flash.js#L229)

---

### rtmpSourceHandler `STATIC`
> A source handler for RTMP urls

_defined in_: [src/js/media/flash.rtmp.js#L58](https://github.com/videojs/video.js/blob/master/src/js/media/flash.rtmp.js#L58)

---

