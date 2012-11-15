Glossary
========
Terms related to web video.

### DOM (Document Object Model)
The container of elements on the page that must be loaded before you can interact with the elements with through Javascript.
http://en.wikipedia.org/wiki/Document_Object_Model


### Flash Fallback
The Flash video player (SWF) used to play a video when HTML5 isn't supported.


### TimeRange


### HTML5 Video
HTML is the markup language that makes up every page on the web. The newest version, HTML5, includes specifications for a video tag, that is meant to allow website developers to add a video to a page the same way they would add an image. In order for this to work, web browser developers (Mozilla, Apple, Microsoft, Google, Opera, etc.) have to build the video playback functionality into their browsers. The W3C has created directions on how video should work in browsers, and it’s up to browser developers to follow those directions, so that video works the same across all browsers. This doesn’t always happen thanks to technology, legal, and financial choices made by browser developers, but so far no one’s varying too far from the specifications. However the specifications are still being changed and refined, so browsers developers have to keep up with that as well.

Playing video in a web page may not seem so special since you can already view video on a web page through plugins like Flash Player, Quicktime, Silverlight, and RealPlayer, however this is a big step forward for standardizing video playback across web browsers and devices. The goal is that in the future, developers will only need to use one method for embedding a video, that’s based on open standards (not controlled by one company), and it will work everywhere.

A prime example of this is the iPhone and iPad. Apple has decided not to support Flash on their mobile devices, but they do support HTML5 video. Since Flash is currently the most common way video is added to web pages, most web video (aside from YouTube who has a special relationship with Apple) can’t be viewed on the iPhone or iPad. These devices are very popular, so many web sites are switching to hybrid HTML5/Flash player setups (like VideoJS).


### Video Tag
There are a number of great resources that will give you an introduction to the video tag an how it is used including:

  - [Dive into HTML5](http://diveintohtml5.org/video.html)
  - Lynda.com's ['HTML5 Video and Audio in Depth'](http://www.lynda.com/HTML-5-tutorials/HTML5-Video-and-Audio-in-Depth/80781-2.html) video tutorials created by yours truly.

An if you really want to dig in, you can read the (W3C Spec)[http://www.w3.org/TR/html5/video.html]. (Warning - not for the faint of heart)


### Skin
"Skin" refers to the design of the player's controls, also sometimes called the chrome. With VideoJS, new skins can be built simply by creating a new stylesheet.


### Content Delivery Network (CDN)
A network of servers around the world that host copies of a file. When your browser requests one of these files, the CDN automatically determines which server is closest to your location and delivers the file from there. This drastically increases delivery time, especially internationally.
