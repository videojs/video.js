<!--
Start src/js/player.js

GENERATED FROM SOURCE
if you edit this doc directly your changes will be lost
-->

# vjs.Player

__EXTENDS__: [vjs.Component](component.md)  
__DEFINED IN__: [src/js/player.js](https://github.com/videojs/video.js/blob/master/src/js/player.js)

<p>An instance of the <code>Video.Player</code> class is created when any of the Video.js setup methods are used to initialize a video.</p>

<div class="highlight"><pre lang="js">var myPlayer = Video('example_video_1');
</pre></div>

<p>In the follwing example, the <code>data-setup</code> attribute tells the Video.js library to create a player instance when the library is ready.</p>

<div class="highlight"><pre lang="html"><video id="example_video_1" data-setup='{}' controls>
  <source src="my-source.mp4" type="video/mp4">
</video>
</pre></div>

<p>After an instance has been created it can be accessed globally using <code>Video('example_video_1')</code>.</p>

---

## INDEX

- [METHODS](#methods)
  - [init](#inittag-options-ready)
  - [play](#play)
  - [poster](#postersrc)
  - [controls](#controlscontrols)
  - [usingNativeControls](#usingnativecontrolsbool)

- [EVENTS](#events)
  - [usingnativecontrols](#usingnativecontrols)
  - [usingcustomcontrols](#usingcustomcontrols)

## METHODS

### init(tag, options, ready)
<p>player's constructor function</p>

##### PARAMETERS:
* __tag__ `Element` The original video tag used for configuring options
* __options__ `Object` _(Optional)_ Player options
* __ready__ `Function` _(Optional)_ Ready callback function

---

### play()
<p>start media playback</p>

<h5>EXAMPLE:</h5>

<div class="highlight"><pre lang="js">  myPlayer.play();
</pre></div>

##### RETURNS:
* `vjs.Player` self

---

### poster([src])
<p>get or set the poster image source url</p>

<h5>EXAMPLE:</h5>

<pre><code>// getting
var currentPoster = myPlayer.poster();

// setting
myPlayer.poster('<a href='http://example.com/myImage.jpg'>http://example.com/myImage.jpg</a>');
</code></pre>

##### PARAMETERS:
* __src__ `String` _(Optional)_ Poster image source URL

##### RETURNS:
* `String` poster URL when getting
* `vjs.Player` self when setting

---

### controls(controls)
<p>Get or set whether or not the controls are showing.</p>

##### PARAMETERS:
* __controls__ `Boolean` Set controls to showing or not

##### RETURNS:
* `Boolean` Controls are showing

---

### usingNativeControls(bool)
<p>Toggle native controls on/off. Native controls are the controls built into<br />devices (e.g. default iPhone controls), Flash, or other techs<br />(e.g. Vimeo Controls)</p>

<p><strong>This should only be set by the current tech, because only the tech knows<br />if it can support native controls</strong></p>

##### PARAMETERS:
* __bool__ `Boolean` True signals that native controls are on

##### RETURNS:
* `vjs.Player` Returns the player

---

## EVENTS

### usingnativecontrols
<p>player is using the native device controls</p>

---

### usingcustomcontrols
<p>player is using the custom HTML controls</p>

---

<!-- End src/js/player.js -->

