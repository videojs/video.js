_V_.options.flash.swf = "../flash/video-js.swf";
_V_.options.flash.swf = "http://andylemay.com/dev/videojs/VideoJS.swf";

$(function(){
  var tech, i, tname, player,
      techList = ["html5","flash"],
      props = "error,currentSrc,networkState,buffered,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoWidth,videoHeight,textTracks,preload,currentTime,defaultPlaybackRate,playbackRate,autoplay,loop,controls,volume,muted,defaultMuted,poster".split(","),
      methods = "play,pause,src,load,canPlayType,addTextTrack",
      notUsed = "mediaGroup,controller,videoTracks,audioTracks,defaultPlaybackRate";

  for (i=0; i < techList.length; i++) {
    tech = techList[i];
    tname = tech.toLowerCase();

    player = _V_("vid"+(i+1), { "techOrder":[tech] });

    _V_.each(_V_.html5.events, function(evt){

      player.addEvent(evt, _V_.proxy(tname, function(evt){
        var eventsId = "#"+this+"_events",
            type = evt.type,
            prev = $(eventsId+" div").first();

        if (prev && prev.html() && prev.html().indexOf(type + " ") === 0) {
          var countSpan = prev.children(".count");
          countSpan.html(parseInt(countSpan.html() || 1) + 1);
        } else {
          $("#"+this+"_events").prepend("<div>" + evt.type + " <span class='count'></span></div>");
        }
      }));
    });

    var propTable = $("#"+tname+"_props");
    _V_.each(props, function(prop){
      propTable.append("<tr><th>"+prop+"</th><td id='"+tname+prop+"' class='data'></td></tr>")
    });

    setInterval(_V_.proxy(player, function(){
      _V_.each(props, _V_.proxy(this, function(prop){
        var result = ""
        try {
          result = this[prop]();
          if (result === false) result = "false";
          if (result === true) result = "true";
          if (result === "") result = "''";
          if (result === null) result = "<span class='undefined'>null</span>";
          if (result === undefined) result = "<span class='undefined'>undefined</span>";
          if (typeof result.start == "function") {
            var newResult = "", i;
            if (result.length > 0) {
              
              for (i=0;i<result.length;i++) {
                newResult += "l:"+result.length+" s:"+result.start(i)+" e:"+result.end(i);
              }
            } else {
               newResult = "-";
            }
            result = newResult;
            // result = result.toString();
            // result = (result.length > 0) ? "s:"+result.start(0)+" e:"+result.end(0) : "-";
          }
        } catch(e) {
          result = "<span class='na'>N/A</span>";
        }
        $("#"+this.techName+prop).html(result);
      }));
    }), 500);

  };
});