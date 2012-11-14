---
layout: tips
title: Tips and Tricks
description: Video.js Tips and Tricks
body_id: tech
body_class: docs subpage
---

Tips and Tricks
============================
This page contains a bunch of user contributes tips and tricks from over the years.

Replacing Flash Fallback
-----------------------
In the event that you don't wish to use the VideoJS built in flash fallback, you can use the following recipe to
completely unload VideoJS and load up Flowplayer instead.

This is very useful if you want to have true fallback, or if the build in flash fallback does not perform all the
functionality you need.

<code type="javascript">
    <!DOCTYPE HTML>
    <html>
    <head>

        <style>
            #player {
                width:855px;
                height:400px;
            }
        </style>
        <!-- Load jquery -->
        <script type="text/javascript" src="js/jquery-1.7.2.js"></script>
        <script type="text/javascript" src="flowplayer/flowplayer-3.2.10.min.js"></script>
        <script type="text/javascript" src="videojs/video.js"></script>

        <link href="videojs/video-js.css" rel="stylesheet">

        <script>
            _cdn_url = "http://ftp.uni-kl.de/CCC/28C3/mp4-h264-LQ/28c3-4932-de-camp_review_2011_h264-iprod.mp4"
            _cdn_qs = "start=29"
            _cdn_img = "http://4.bp.blogspot.com/_W90V87w3sr8/TSf0PmwFqYI/AAAAAAAAAnU/Vp1XknIYmbI/s1600/bird.jpg"

            // Attach to ready
            $(document).ready(function() {

                // Forcibly disable flash support
                //VideoJS.options.techOrder = ["html5"];
                VideoJS.options.techOrder = [];

                // Event catches whenever the techOrder finished
                // without successful execution
                _V_("vjs_player").loadError(function(){

                    // Destroy videojs
                    DestroyVideoJS();

                    // Load flowplayer
                    SetupFlowplayer();
                });
            });

            function SetupFlowplayer() {
                // Creates our flowplayer object
                console.log("Loading flowplayer")
                $("#fp_player").flowplayer(_fp_src, _fp_config);

                // Due to some IE8 bug (possible race cond), we have
                // to trigger a click event outside the scope of
                // execution, which then causes the flash to load
                // properly. No idea why. Pretty retarded tbh.
                setTimeout(function() {
                    $("#fp_player").show();
                    $("#fp_player").click();
                    console.log('Flowplayer click triggered');
                }, 20);
            }

            function DestroyVideoJS() {
              // get the videojs player with id of "video_1"
              var player = _V_("vjs_player");      

              // remove the entire player from the dom
              $(player.el).remove();                 
            }

            _fp_src = {
                'src' : 'flowplayer/flowplayer-3.2.11.swf'
            }

            _fp_config = {
                /*log: { level: 'info' },*/

                'playlist': [
                    {
                        'url'           :   _cdn_img,
                    },

                    {
                        // these two settings will make the first frame visible
                        'autoPlay'      :   false,
                        'autoBuffering' :   false,

                        'scaling'       :   'fit',
                        'provider'      :   'pseudo',
                        'url'           :   _cdn_url
                    },
                ],

                showErrors: false,

                plugins:{

                    pseudo: {
                        url: 'flowplayer/flowplayer.pseudostreaming-3.2.3.swf',
                        queryString: escape("start=${start}&"+_cdn_qs)
                    }
                }
            }
        </script>

    </head>
    <body>

        <div>
            <video id="vjs_player" class="video-js vjs-default-skin" controls preload="auto">
              <source src="http://ftp.uni-kl.de/CCC/28C3/mp4-h264-LQ/28c3-4932-de-camp_review_2011_h264-iprod.mp4" type='video/mp4'>
              <source src="http://ftp.dk.debian.org/CCC/28C3/webm/28c3-4856-en-the_engineering_part_of_social_engineering.webm" type='video/webm'>
            </video>

            <div id="fp_player" style="width:855px; height:455px; background-color:red; display:none;">
                not supported
            </div>
        </div>

    </body>
    </html>
</code>