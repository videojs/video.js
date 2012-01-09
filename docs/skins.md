---
layout: docs
title: Skins
description: Controls Skins, Chrome, Design, look-and-feel.
body_id: skins
body_class: docs subpage
---

Skins
=====

The default Video.js skin is made using HTML and CSS, so there's no need to learn a complicated skinning language to update colors or even create an entirely new skin. New in version 3.0 is the use of a sprites image file (video-js.png). The image allows for a little bit more classy design, as well as compatibility with older versions of IE now that the HTML skin also shows when Flash is used for those browsers.

You can view the uncompressed CSS for the default skin by downloading the latest version of Video.js or viewing [the source version](https://github.com/zencoder/video-js/blob/master/design/video-js.css) on Github.

You can either override styles in the default skin:

{% highlight css %}

.vjs-default-skin .vjs-play-progress { background: #900; }

{% endhighlight %}

Or remove the 'vjs-default-skin' class from the video tag and create your own skin.

{% highlight html %}

<video class="video-js my-custom-skin" ...>

{% endhighlight %}

More custom skins will be available for download soon. If you have one you'd like to contribute back, please email it to <script type="text/javascript">eval(decodeURIComponent('%64%6f%63%75%6d%65%6e%74%2e%77%72%69%74%65%28%27%3c%61%20%68%72%65%66%3d%22%6d%61%69%6c%74%6f%3a%73%6b%69%6e%73%40%76%69%64%65%6f%6a%73%2e%63%6f%6d%22%3e%73%6b%69%6e%73%40%76%69%64%65%6f%6a%73%2e%63%6f%6d%3c%2f%61%3e%27%29%3b'))</script>.

