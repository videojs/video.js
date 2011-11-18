$(function(){  
  var tech, i,
      techList = ["html5","h5swf"],
      props = "error,currentSrc,networkState,buffered,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoWidth,videoHeight,textTracks,preload,currentTime,defaultPlaybackRate,playbackRate,autoplay,loop,controls,volume,muted,defaultMuted".split(","),
      methods = "play,pause,src,load,canPlayType,addTextTrack",
      notUsed = "mediaGroup,controller,videoTracks,audioTracks,defaultPlaybackRate";
      

  for (i=0; i < techList.length; i++) {
    tech = techList[i];

    var player = _V_("vid"+(i+1), { "techOrder":[tech] });

    _V_.each(_V_.html5Events, function(evt){
      player.addEvent(evt, _V_.proxy(tech, function(evt){
        var eventsId = "#"+this+"_events",
            type = evt.type,
            prev = $(eventsId+" div").first();
            
            if (type == 'error') _V_.log(evt);

        if (prev && prev.html() && prev.html().indexOf(type + " ") === 0) {
          var countSpan = prev.children(".count");
          countSpan.html(parseInt(countSpan.html() || 1) + 1);
        } else {
          $("#"+this+"_events").prepend("<div>" + evt.type + " <span class='count'></span></div>");
        }
      }));
    });

    var propTable = $("#"+tech+"_props");
    _V_.each(props, function(prop){
      propTable.append("<tr><th>"+prop+"</th><td id='"+tech+prop+"' class='data'></td></tr>")
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
            result = (result.length > 0) ? "s:"+result.start(0)+" e:"+result.end(0) : "-";
          }
        } catch(e) {
          _V_.log(e);
          result = "<span class='na'>N/A</span>";
        }
        $("#"+this.currentTechName+prop).html(result);
      }));
    }), 500);

  };
});