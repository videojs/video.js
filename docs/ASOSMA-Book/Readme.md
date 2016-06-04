
<!-- -->
<!-- -->
<!-- -->
<!-- -->

![Video.js logo](http://videojs.com/img/logo.png)
# [Video.js - HTML5 Video Player](http://videojs.com)

<!-- -->

**[Harel](https://github.com/harella1), [Nati](https://github.com/natiohayun), [Meir](https://github.com/mwindowshz), and [Pablo](https://github.com/pabloli)**<br/>
[Our Video.Js documentation repository](https://github.com/pabloli/video.js/tree/master/docs)

*Azriely Engeniring collage Jerusalem*

[![Join the chat at https://gitter.im/pabloli/ASOSMA](https://badges.gitter.im/pabloli/ASOSMA.svg)](https://gitter.im/pabloli/ASOSMA?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

**Abstract**

Is an open source video player.
Is active for 5 year.
Is a active project.

**Table of Contents**

* [VIDEO.JS - HTML5 Video Player]()

##	Introduction
Video.js is a web video player built from the ground up for an HTML5 world. It supports HTML5 and Flash video, as well as YouTube and Vimeo (through plugins). It supports video playback on desktops and mobile devices. This project was started mid 2010, and the player is now used on over 200,000 websites

Video.JS is compatible with may Browsers and Devices, thus makes it available on many platforms  (including ones without java script).  This is achieved through  the  use of embedded code.
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

##**Stakeholder Analysis**
###***Users***

***Funny Or Die***
![FunnyOrDie](https://yt3.ggpht.com/-hBhdcAb62Uo/AAAAAAAAAAI/AAAAAAAAAAA/NUpkCfVpTIU/s100-c-k-no-rj-c0xffffff/photo.jpg)

***The Guardian***
![](https://assets.guim.co.uk/images/favicons/451963ac2e23633472bf48e2856d3f04/152x152.png)

***Onion Studios***
![](http://assets3.onionstatic.com/onionstatic/onionstudios/static/core/images/os_logo.png)
 
  ***Zencoder*** - Also is the creator of Video.js
![](https://a.zencdn.net/assets/logo-print-c8eb6ccdba8286b7c36e567b2527f3bc.png)

## ***How to use Video.JS***

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
##**Community**
 - ***GitHub Repository***

	*Repository life activity*
	![Repository life activity](https://github.com/pabloli/ASOSMA/blob/master/VideoJs/CommitFreq.png)

	*Most active contributors*                                             
	![Most active contributors](https://github.com/pabloli/ASOSMA/blob/master/VideoJs/MostCommiters.png)
 - ***StackOverFlow Forum***
 This forum is used for questions. All watchers will get emails for closed question responses.
 

 - ***Video.Js Blog***
This [blog](http://blog.videojs.com/) (managed by [Steve Heffernan](https://github.com/heff)) publishes the latest news about the projects, like anounces for a new version.

*Question answering guide:*                                       
![Question Guide](https://github.com/pabloli/ASOSMA/blob/master/VideoJs/QuestionFlowChart.png)



##**Developer's Perspective**
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
	
***Developing Modules***

- Core
- Skin
- Plugins

***New features and tests***

There are not a tester groups, each developer with each commit **must** test the entire project and update the *TC Commitee* with the results. If there are any additional documentation will be better.

_The checklist_:
- [ ] Tests written  
- [ ] Feature implemented  
- [ ] Docs/guides updated  
- [ ] Example created (e.g. [jsbin](http://jsbin.com/axedog/9999/edit))  
- [ ] Pull request submitted

   [New Feature checklist](https://github.com/videojs/video.js/wiki/New-Feature-Checklist) 
   
##***Module Organization***
###**Development Process**
There is no too much information about the process but from the github record we can learn that the project start with only one developer and now the project is been developed by a lot of active developers.
The bigger part of this project is the UI part.


####  ***Class Diagrams***
***Entire Project Diagram*** -- Made with WAVI
![Class Diagram](https://rawgit.com/pabloli/ASOSMA/master/VideoJs/vj.svg)

***Component Class*** -- Made with PlantUML

![Component and inherited Classes Diagram](https://rawgit.com/pabloli/ASOSMA/master/VideoJs/ComponentClass.svg)
***EventTrigger Class*** -- Made with PlantUML

![EventTrigger and inherited Class Diagram](https://rawgit.com/pabloli/ASOSMA/master/VideoJs/EventTriggerClass.svg)

###**Metric Code**
The Javascript library (video.js) section is divided in 7 principal sections:
 - Control-Bar -- All the types of controls (i.e. Audio, Progress, Volume)
 - Menu -- All the menu components (i.e Buttons, Items)
 - Popup -- The Popup component is used to build pop up controls
 - Slider -- The base functionality for sliders like the volume bar and seek bar
 - Tech -- Module for media (HTML5 Video, Flash) controllers
 - Tracks -- Setup the common parts of an audio, video, or text track
 - Utils -- Various utilities

###**Variablity**
The project is divide by 3 modules (Core, Plugins, Skins).
The core module is a rigid module and for change any feature there is a need an authorization of the TC Commitee, but there are the other modules (Plugins and Skin). These module are more easy to change and commit the changes.

###**Maintaining**
***Releasing version***

The video.js release process is outlined below. Only core contributors to video.js can create a new release but we do them very regularly. 
[*Contributing guide*](https://github.com/videojs/video.js/wiki/CONTRIBUTING.md)

***Change log file***

Each version (stable or beta) has a text file with the changes of the version.
This file can includes:

 - Bug fixes
 - New features
 - Architecture changes
 - API changes
 - Additional notes

##  Conclusions and Recommendations
##  Bibliography & References
* https://github.com/videojs/video.js
* http://html5video.org/wiki/Video_for_Everybody_HTML5_Video_Player
* http://blog.videojs.com/

## Tools 
* [PlantUml UML Generator](http://plantuml.com/)
* [RawGit serves raw files directly from GitHub](http://rawgit.com/)
* [WAVI -- Generate a class diagram for your node.js web application](https://github.com/bakunin95/wavi)
