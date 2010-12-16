Behaviors
=========
Behaviors allow you to make an element on your page act as a video control or a display of video information. The easiest example of this is creating a play button. The following code will make a click on your element play the video.

    myPlayer.activateElement(myElement, "playButton");

mouseOverVideoReporter
  The mouseOverVideoReporter behavior is mostly used internally to trigger showing the controls when a user's mouse is over the video. It's used on elements that are shown in front of the video, that might block a mouseover on the video itself from registering.

controlBar
  The controlBar behavior is what's added to the main control bar to make it show/hide depending on the user's mouse and the set preferences. It can also be added to other elements if the same effect is desired.

playButton
  The playButton behavior can be added to an element to make it play the video when clicked. (See also playToggle)

pauseButton
  The pauseButton behavior can be added to an element to make it pause the video when clicked.

playToggle
  The playToggle behavior can be added to an element to make it toggle between play and pause. When the video is playing it will pause the video, and vice versa. The play button in the default control bar works this way.
  The icon in the play button changes to pause (two vertical bars) or play (triangle) depending on the state of the video. This is done through CSS classes. When the video is playing, a class of "vjs-playing" will be added to the playToggle element. When the video is paused, a class of "vjs-paused" will be added to the element. If you are using an image for the icon, set it as a background image of the element (or a sub element) and change the background image accordingly.

    #my_play_toggle.vjs-playing { background-image: url("my-pause-icon.png") }
    #my_play_toggle.vjs-paused { background-image: url("my-play-icon.png") }

playProgressBar
  With the playProgressBar behavior, you can make an element grow like a progress bar as the video plays. The width of the element is set as a percent, and uses the video's current time divided by the video's total duration. For this reason, you may also need a container element to get the desired effect. In this example the width of the playProgressBar will be based on the width of myPlayProgressHolder.
    <div id="myPlayProgressHolder">
      <div id="myPlayProgressBar"></div>
    </div>

loadProgressBar
  The loadProgressBar behavior works similarly to the playProgressBar behavior, except that it's based on the amount of video data that's been downloaded to the users machine.

currentTimeDisplay
  The currentTimeDisplay behavior will make an element display the video's current playback time in the format of 00:00. It does so by changing the innerHTML of the element to the time.

durationDisplay
  The durationDisplay behavior will make an element display the video's duration in the format of 00:00. It does so by changing the innerHTML of the element to the duration.

currentTimeScrubber
  The currentTimeScrubber behavior allows you to make an element that controls the current time of the video by clicking and dragging on the element. The current time will be set based on where the user clicks or drags to, in relation to the width of the element.

volumeDisplay
...

volumeScrubber
  The volumeScrubber behavior allows you to make an element that controls the volume of the video by clicking and dragging on the element. The volume will be set based on where the user clicks or drags to, in relation to the width of the element.

fullscreenToggle
...

(Note to self: Have a video that is fixed position beside the behavior docs, that all examples are tied to)