<!-- -->
<!-- -->
<!-- -->
<!-- -->

![Video.js logo](http://videojs.com/img/logo.png)
##[Video.js - HTML5 Video Player WebSite](http://videojs.com)
##[Video.js - Github Repo](https://github.com/videojs/video.js)
<!-- -->

**[Harel](https://github.com/harella1), [Nati](https://github.com/natiohayun), [Meir](https://github.com/mwindowshz), and [Pablo](https://github.com/pabloli)**<br/>
[Our Video.Js documentation repository](https://github.com/pabloli/video.js/tree/master/docs)

*Azriely Engeniring collage Jerusalem*

**Table of Contents**
- [Introduction](#introduction)
- [Stakeholder Analysis](#stakeholder-analysis)
- [Community](#community)
- [Developer's Perspective](#developers-perspective)
- [Project Development Process](#project-development-process)
		- [Class Diagrams](#class-diagrams)
- [Conclusions and Recommendations](#conclusions-and-recommendations)
- [Security Issues](#security-issues)
- [Bibliography & References](#bibliography-&-references)
- [Tools](#tools)

[![Join the chat at https://gitter.im/pabloli/ASOSMA](https://badges.gitter.im/pabloli/ASOSMA.svg)](https://gitter.im/pabloli/ASOSMA?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Abstract**

Is an open source video player. Active for 5 years. 

The project is interesting because it is open source library that allows to stream video to almost any device regardless of device or browser capabilities. This library solves a long-standing problem of Streaming of video and is unique in the market today.



##	Introduction
Video.js is a web video player built from the ground up for an HTML5 world. It supports HTML5 and Flash video, as well as YouTube and Vimeo (through plugins). It supports video playback on desktops and mobile devices. This project was started mid 2010, and the player is now used on over 200,000 websites

Video.JS is compatible with many Browsers and Devices, thus makes it available on many platforms  (including ones without java script).  This is achieved through  the  use of embedded code.
The java script library fixes browser & device bugs, and makes sure your video is even more compatible across different browser versions.
The pure HTML5/CSS skin ensures a consistent look between HTML5 browsers, and easy custom skinning if you want to give it a specific look, or brand it with your own colors. 

 **The Advantages :**
 - [x] Free & Open Source
 - [x] Lightweight. NO IMAGES USED
 - [x] 100% skinnable using CSS
 - [x] Library independent
 - [x] Easy to use
 - [x] Easy to understand & extend
 - [x] Consistent look between browsers
 - [x] Full Screen & Full Window Modes
 - [x] Volume Control
 - [x] Forced fallback to Flash (*even when there is an unsupported source*)

##	Stakeholder Analysis
This is a software library and that the reason that the all stackholders are HTML developers. They develop this library (fixes bugs, add features) and also use the library for their own bussines.  
<!-- -->
###	***Users***
<!-- -->
***Zencoder*** - Also is the most active developer of Video.js
<!-- -->
Zencoder is a cloud-based video and audio encoding product suite from Brightcove, a leading global provider of cloud content services. The Zencoder service provides customers reliable encoding of live and on-demand video. 
<!-- -->
![](https://a.zencdn.net/assets/logo-print-c8eb6ccdba8286b7c36e567b2527f3bc.png)
<!-- -->
<!-- -->
***Funny Or Die***
<!-- -->
Funny Or Die is a comedy video website founded in 2007 that combines user-generated content withoriginal, exclusive content.
<!-- -->
![FunnyOrDie](https://yt3.ggpht.com/-hBhdcAb62Uo/AAAAAAAAAAI/AAAAAAAAAAA/NUpkCfVpTIU/s100-c-k-no-rj-c0xffffff/photo.jpg)
<!-- -->
[Funny Or Die -- Zenconder case study](https://files.brightcove.com/zc-funny-or-die-cs.pdf)
<!-- -->
<!-- -->
***The Guardian***
<!-- -->
The Guardian is a British national daily newspaper. Their media feeds are played using the Video.JS library (with Flash compatibility)
<!-- -->
![](https://assets.guim.co.uk/images/favicons/451963ac2e23633472bf48e2856d3f04/152x152.png)
<!-- -->
<!-- -->
***Onion Studios***
<!-- -->
Onion Studios is a dynamic digital video network.
![](http://assets3.onionstatic.com/onionstatic/onionstudios/static/core/images/os_logo.png)
 <!-- -->
<!-- -->

##	How to use Video.JS

***Compatible Software***

Compatible OS's:

 - Windows
 - Android
 - IOS
 - Symbian S60
 - BlackBerry OS 7.1

Compatible browsers:

 - Internet Explorer (Version IE6-IE8 using Flash)
 - Firefox 3.6+ (HTML-5)
 - Chrome 3+ (HTML-5)
 - Opera 10.5+ (HTML-5)
 - Safari 4 (HTML-5)


***API***

[Video.JS API Documentation](http://docs.videojs.com/docs/api/index.html)

***Source code example***

[Simple Embedded -- Official Example](http://docs.videojs.com/docs/examples/simple-embed/index.html)

HTML 5
```
<h1>Responsive Video.js Example (v4.3)</h1>
  <p></p>
  <video id="my_video_1" class="video-js vjs-default-skin" controls preload="auto" 
  data-setup='{ "asdf": true }' poster="http://video-js.zencoder.com/oceans-clip.png" >
    <source src="http://vjs.zencdn.net/v/oceans.mp4" type='video/mp4'>
    <source src="http://vjs.zencdn.net/v/oceans.webm" type='video/webm'>
  </video>
``` 
JavaScript
```javascript
videojs.autoSetup();
    videojs('my_video_1').ready(function(){
      console.log(this.options()); //log all of the default videojs options
       // Store the video object
      var myPlayer = this, id = myPlayer.id();
      // Make up an aspect ratio
      var aspectRatio = 264/640; 
      function resizeVideoJS(){
        var width = document.getElementById(id).parentElement.offsetWidth;
        myPlayer.width(width).height( width * aspectRatio );
      }
      // Initialize resizeVideoJS()
      resizeVideoJS();
      // Then on resize call resizeVideoJS()
      window.onresize = resizeVideoJS; 
    });
```
##	**Community**
 - ***GitHub Repository***

	*Repository life activity*
	![Repository life activity](CommitFreq.png)

	*Most active contributors*                                             
	![Most active contributors](MostCommiters.png)
 - ***StackOverFlow Forum***
 This forum is used for questions. All watchers will get emails for closed question responses.
 http://stackoverflow.com/questions/tagged/video.js

 - ***Video.Js Blog***
This [blog](http://blog.videojs.com/) (managed by [Steve Heffernan](https://github.com/heff)) publishes the latest news about the projects, like anounces for a new version.

*Question answering guide:*                                       
![Question Guide](QuestionFlowChart.png)



##	Developer's Perspective
###***Developer Types***
***TC Commitee***

The Video.js project is jointly governed by a Technical Steering Committee (TSC) which is responsible for high-level guidance of the project.
The TSC has final authority over this project including:

 - Technical direction
 - Project governance and process (including this policy)
 - Contribution policy
 - GitHub repository hosting
 - Conduct guidelines
 - Maintaining the list of additional collaborators

***Collaborators***

Modifications of the contents of the videojs/video.js repository are made on a collaborative basis. Anybody with a GitHub account may propose a modification via pull request and it will be considered by the project Collaborators. All pull requests must be reviewed and accepted by a Collaborator with sufficient expertise who is able to take full responsibility for the change

***New features and tests***

There are not a tester groups, each developer with each commit **must** test the entire project and update the *TC Commitee* with the results. If developer adds additional documentation it would be welcome.

Before commiting new updates the developer is instructed to this guideline:
_The checklist_:
- [ ] Tests written  
- [ ] Feature implemented  
- [ ] Docs/guides updated  
- [ ] Example created (e.g. [jsbin](http://jsbin.com/axedog/9999/edit))  
- [ ] Pull request submitted

   [New Feature checklist](https://github.com/videojs/video.js/wiki/New-Feature-Checklist) 
   
##	Project Development Process
There is no too much information about the process but from the github record we can learn that the project start with only one developer and now the project is been developed by a lot of active developers.
The bigger part of this project is the UI part.

###**Maintaining**
***Releasing version***

The video.js release process is outlined below. Only core contributors to video.js can create a new release but it is done regularly. 
[*Contributing guide*](https://github.com/videojs/video.js/blob/master/CONTRIBUTING.md)


***Change log file***

Each version (stable or beta) has a text file with the changes of the version.
This file can includes:

 - Bug fixes
 - New features
 - Architecture changes
 - API changes
 - Additional notes


 ###**Variablity**
The project is divide by 3 modules (Core, Plugins, Skins).
***The core library*** handles the actual video player capabilities, reading video from many type of sources , and displaying it on HTML5 enviroment.
The core module is a rigid module, any change or feature addition to the core requires an authorization of the TC Committee. 
***Plugin and skins*** ,  are ment to allow specific customization, for many users. this feature makes Video.JS accessible.
Plugin examples - subtitles, recording,playlist playing etc.
 These module are more easy to change and commit the changes.

###**Core library**
The Javascript core library in video.js  is divided in seven principal sections:
 - Control-Bar -- All the types of controls (i.e. Audio, Progress, Volume)
 - Menu -- All the menu components (i.e Buttons, Items)
 - Popup -- The Popup component is used to build pop up controls
 - Slider -- The base functionality for sliders like the volume bar and seek bar
 - Tech -- Module for media (HTML5 Video, Flash) controllers
 - Tracks -- Setup the common parts of an audio, video, or text track
 - Utils -- Various utilities

##***Module Organization***

####  ***Class Diagrams***
***Entire Project Diagram*** -- Made with WAVI
![Class Diagram](https://rawgit.com/pabloli/ASOSMA/master/VideoJs/vj.svg)

<!-- -->
###	*Inheritage classes*
<!-- -->
On the next two diagrams can see that there are twon main classes, the first is *Component* class and all the feature classes directly or indirectly implement it. The second is the *Event Trigger* as the previous class all the event handlers implements this class.
<!-- -->
***Component Class*** -- Made with PlantUML

![Component and inherited Classes Diagram](https://rawgit.com/pabloli/ASOSMA/master/VideoJs/ComponentClass.svg)
***EventTrigger Class*** -- Made with PlantUML

![EventTrigger and inherited Class Diagram](https://rawgit.com/pabloli/ASOSMA/master/VideoJs/EventTriggerClass.svg)

####	***Extensibility***
The project was design for a easy extesibility, each developer can add a feature as skins or ability without change all the project.
Type of extensions:

 - [Skins](http://docs.videojs.com/docs/guides/skins.html) - *just by overiding Video.JS base theme*
 - [Languages](http://docs.videojs.com/docs/guides/languages.html) - *adding a simple jason file with a dictionary file*
 - [Plugins](http://docs.videojs.com/docs/guides/plugins.html) - *any functionality writeen could be registered as Video.JS plugin , also can be used a plugin generator tool (this tool includes Build , Installation System and Testing support)*
 - 


##	Conclusions and Recommendations
* Code comments and design documents missing
* May be there is a violation of copyright violation (Right-Clicking let option to download the video)
* Live streaming feature is missing
* Resolution selection is missing -- can be a good feature for slowly conections

##	Security Issues
* Copyright issues
* No documentation about HTTPS transmition
 

##	Bibliography & References
* http://github.com/videojs/video.js
* http://html5video.org/wiki/Video_for_Everybody_HTML5_Video_Player
* http://blog.videojs.com/
* http://www.zencoder.com/
* http://www.wikipedia.org/
* http://stackoverflow.com/questions/tagged/video.js

##	Tools 
* [PlantUml UML Generator](http://plantuml.com/)
* [RawGit serves raw files directly from GitHub](http://rawgit.com/)
* [WAVI -- Generate a class diagram for your node.js web application](https://github.com/bakunin95/wavi)
