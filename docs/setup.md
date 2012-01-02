---
layout: docs
title: Setup
description: Setup
body_id: docs
---

Setup
=====

Step 1: Include the VideoJS Javascript and CSS files in the head of your page.
------------------------------------------------------------------------------
You can download the VideoJS source and host it on your own servers, or use the free CDN hosted version (thanks to Zencoder).

    <script src="http://video-js.zencoder.com/3.0/video.min.js"></script>
    <link href="http://video-js.zencoder.com/3.0/video-js.css" rel="stylesheet">


Step 2: Add an HTML5 video tag to your page.
--------------------------------------------
Use the video tag as normal, with a few extra pieces for VideoJS:

  1. The 'data-setup' Atrribute tells VideoJS to automatically set up the video when the page is ready, and read any options (in JSON format) from the attribute (see ['options'](http://videojs.com/docs/options.html)).
  2. The 'id' Attribute: Should be used and unique for every video on the same page.
  3. The 'class' attribute contains two classes:
    - 'video-js' applies styles that are required for VideoJS functionality, like fullscreen and subtitles.
    - 'vjs-default-skin' applies the default skin to the HTML controls, and can be removed or overridden to create your own controls design.

Otherwise include/exclude attributes, settings, sources, and tracks exactly as you would for HTML5 video (see ['video-tag'](http://videojs.com/docs/video-tag.html)).

    <video id="example_video_1" class="video-js vjs-default-skin" controls preload="auto" width="640" height="264" poster="http://video-js.zencoder.com/oceans-clip.png"  
        data-setup='{"example_option":true}'>
      <source src="http://video-js.zencoder.com/oceans-clip.mp4" type='video/mp4' />
      <source src="http://video-js.zencoder.com/oceans-clip.webm" type='video/webm' />
      <source src="http://video-js.zencoder.com/oceans-clip.ogv" type='video/ogg' />
    </video>