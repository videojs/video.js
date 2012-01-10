---
layout: docs
title: Options
description: Player Options
body_id: options
body_class: docs subpage
---

Options
=======

The Video.js emebed code is simply an HTML5 video tag with the video.js classes. So for many of the options you can use the standard tag attributes to set video.js options.

{% highlight html %}
<video controls autoplay preload="auto" ...>
{% endhighlight %}

Alternatively, you can use the data-setup attribute to provide options in the JSON format. This is also how you would set options that aren't standard to the video tag.

{% highlight html %}
<video data-setup='{ "controls": true, "autoplay": false, "preload": "auto" }'...>
{% endhighlight %}

Finally, if you're not using the data-setup attribute to trigger the player setup, you can pass in an object with the player options as the second argument in the setup function.

{% highlight javascript %}
_V_("myVideoID", { "controls": true, "autoplay": false, "preload": "auto" });
{% endhighlight %}

(More options documentation coming soon.)