[Video.js - HTML5 and Flash Video Player](http://videojs.com)  [![Build Status](https://travis-ci.org/zencoder/video-js.png?branch=master)](https://travis-ci.org/zencoder/video-js)
==================================================

Visit the main site at [videojs.com](http://videojs.com) for download options and instructions.

Video.js was built to provide a fast and easy way to embed and work with video in a web page. It was built from the ground up with the assumption that HTML5 is the future of web video, however it supports Flash equally well for older browsers and for advanced features not yet supported in HTML5.

Some of the focuses of Video.js are:
- Universal browser and device support
- Easily skinned (themed/chromed) using just CSS
- A JavaScript API for controlling the video that works consistently across video platforms (HTML5, Flash, and others) as well as devices
- A common skin and API between HTML5, Flash, and potentially other players like YouTube

To build video-js from the latest version of the source, clone the source repository and run:
sh build.sh
in the video-js directory using the commnand-line/terminal of a unix-based system.

Contributing
------------
If you'd like to help out on VideoJS, you are awesome. Updates should be made to the source files and then make a pull request.

When working on VideoJS code, you can use dev.html as your test page. It doesn't exist in the repo and changes to it won't be tracked. To get your own copy simply clone the repo and copy dev.html.example.
cp dev.html.example dev.html

You can use dev.html to test new code. It's simple HTML doc that includes all the source files. Send a pull request for any updates.

---
BETA NOTES
Version 3 is almost a complete rewrite of the previous versions of VideoJS. New features includes:

  - HTML/CSS Controls and API now work for both the HTML5 and Flash versions.
  - Custom Super-lightweight Flash Fallback
  - Embed Code is much simpler.
    - No more "vjs-box" div required, just use the video tag.
    - No more embedding of Flash fallback within the video tag HTML.

---

TESTING FLASH LOCALLY IN CHROME
-------------------------------
Chrome 21+ (as of 2013/01/01) doens't run Flash files that are local and loaded into a locally accessed page (file:///). To get around this you need to [disable the version of Flash](http://helpx.adobe.com/flash-player/kb/flash-player-google-chrome.html#How_can_I_run_debugger_or_alternate_versions_of_Flash_Player_in_Google_Chrome) included with Chrome and enable a system-wide version of Flash.



