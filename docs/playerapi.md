@fileoverview Main function src.

_Source: [dist/video-js/video.dev.js](../dist/video-js/video.dev.js)_

<a name="tableofcontents"></a>

- <a name="toc_vjsoptions"></a><a name="toc_vjs"></a>[vjs.options](#vjsoptions)
- <a name="toc_vjsplayers"></a>[vjs.players](#vjsplayers)
- <a name="toc_vjscoreobject"></a>[vjs.CoreObject](#vjscoreobject)
- <a name="toc_vjscoreobjectextendprops"></a>[vjs.CoreObject.extend](#vjscoreobjectextendprops)
- <a name="toc_vjscoreobjectcreate"></a>[vjs.CoreObject.create](#vjscoreobjectcreate)
- <a name="toc_vjsonelem-type-fn"></a>[vjs.on](#vjsonelem-type-fn)
- <a name="toc_vjsoffelem-type-fn"></a>[vjs.off](#vjsoffelem-type-fn)
- <a name="toc_vjscleanupeventselem-type"></a>[vjs.cleanUpEvents](#vjscleanupeventselem-type)
- <a name="toc_vjsfixeventevent"></a>[vjs.fixEvent](#vjsfixeventevent)
- <a name="toc_vjstriggerelem-event"></a>[vjs.trigger](#vjstriggerelem-event)
- <a name="toc_vjsoneelem-type-fn"></a>[vjs.one](#vjsoneelem-type-fn)
- <a name="toc_vjscreateeltagname-properties"></a>[vjs.createEl](#vjscreateeltagname-properties)
- <a name="toc_vjscapitalizestring"></a>[vjs.capitalize](#vjscapitalizestring)
- <a name="toc_vjsobj"></a>[vjs.obj](#vjsobj)
- <a name="toc_vjsobjeachobj-fn"></a>[vjs.obj.each](#vjsobjeachobj-fn)
- <a name="toc_vjsobjmergeobj1-obj2"></a>[vjs.obj.merge](#vjsobjmergeobj1-obj2)
- <a name="toc_vjsobjdeepmergeobj1-obj2"></a>[vjs.obj.deepMerge](#vjsobjdeepmergeobj1-obj2)
- <a name="toc_vjsobjcopyobj"></a>[vjs.obj.copy](#vjsobjcopyobj)
- <a name="toc_vjsobjisplainobj"></a>[vjs.obj.isPlain](#vjsobjisplainobj)
- <a name="toc_vjsbindcontext-fn-uid"></a>[vjs.bind](#vjsbindcontext-fn-uid)
- <a name="toc_vjscache"></a>[vjs.cache](#vjscache)
- <a name="toc_vjsguid"></a>[vjs.guid](#vjsguid)
- <a name="toc_vjsexpando"></a>[vjs.expando](#vjsexpando)
- <a name="toc_vjsgetdatael"></a>[vjs.getData](#vjsgetdatael)
- <a name="toc_vjshasdatael"></a>[vjs.hasData](#vjshasdatael)
- <a name="toc_vjsremovedatael"></a>[vjs.removeData](#vjsremovedatael)
- <a name="toc_vjsaddclasselement-classtoadd"></a>[vjs.addClass](#vjsaddclasselement-classtoadd)
- <a name="toc_vjsremoveclasselement-classtoadd"></a>[vjs.removeClass](#vjsremoveclasselement-classtoadd)
- <a name="toc_vjstest_vid"></a>[vjs.TEST_VID](#vjstest_vid)
- <a name="toc_vjsuser_agent"></a>[vjs.USER_AGENT](#vjsuser_agent)
- <a name="toc_vjsis_iphone"></a>[vjs.IS_IPHONE](#vjsis_iphone)
- <a name="toc_vjsgetattributevaluestag"></a>[vjs.getAttributeValues](#vjsgetattributevaluestag)
- <a name="toc_vjsgetcomputeddimensionel-strcssrule"></a>[vjs.getComputedDimension](#vjsgetcomputeddimensionel-strcssrule)
- <a name="toc_vjsinsertfirstchild-parent"></a>[vjs.insertFirst](#vjsinsertfirstchild-parent)
- <a name="toc_vjssupport"></a>[vjs.support](#vjssupport)
- <a name="toc_vjselid"></a>[vjs.el](#vjselid)
- <a name="toc_vjsformattimeseconds-guide"></a>[vjs.formatTime](#vjsformattimeseconds-guide)
- <a name="toc_vjstrimstring"></a>[vjs.trim](#vjstrimstring)
- <a name="toc_vjsroundnum-dec"></a>[vjs.round](#vjsroundnum-dec)
- <a name="toc_vjscreatetimerangestart-end"></a>[vjs.createTimeRange](#vjscreatetimerangestart-end)
- <a name="toc_vjsgeturl-onsuccess-onerror"></a>[vjs.get](#vjsgeturl-onsuccess-onerror)
- <a name="toc_vjssetlocalstorage"></a>[vjs.setLocalStorage](#vjssetlocalstorage)
- <a name="toc_vjsgetabsoluteurlurl"></a>[vjs.getAbsoluteURL](#vjsgetabsoluteurlurl)
- <a name="toc_vjscomponentplayer-options"></a>[vjs.Component](#vjscomponentplayer-options)
- <a name="toc_vjscomponentprototypedispose"></a><a name="toc_vjscomponentprototype"></a>[vjs.Component.prototype.dispose](#vjscomponentprototypedispose)
- <a name="toc_vjscomponentprototypeplayer"></a>[vjs.Component.prototype.player](#vjscomponentprototypeplayer)
- <a name="toc_vjscomponentprototypeoptionsobj"></a>[vjs.Component.prototype.options](#vjscomponentprototypeoptionsobj)
- <a name="toc_vjscomponentprototypecreateeltagname-attributes"></a>[vjs.Component.prototype.createEl](#vjscomponentprototypecreateeltagname-attributes)
- <a name="toc_vjscomponentprototypeel"></a>[vjs.Component.prototype.el](#vjscomponentprototypeel)
- <a name="toc_vjscomponentprototypecontentel"></a>[vjs.Component.prototype.contentEl](#vjscomponentprototypecontentel)
- <a name="toc_vjscomponentprototypeid"></a>[vjs.Component.prototype.id](#vjscomponentprototypeid)
- <a name="toc_vjscomponentprototypename"></a>[vjs.Component.prototype.name](#vjscomponentprototypename)
- <a name="toc_vjscomponentprototypechildren"></a>[vjs.Component.prototype.children](#vjscomponentprototypechildren)
- <a name="toc_vjscomponentprototypegetchildbyid"></a>[vjs.Component.prototype.getChildById](#vjscomponentprototypegetchildbyid)
- <a name="toc_vjscomponentprototypegetchild"></a>[vjs.Component.prototype.getChild](#vjscomponentprototypegetchild)
- <a name="toc_vjscomponentprototypeaddchildchild-options"></a>[vjs.Component.prototype.addChild](#vjscomponentprototypeaddchildchild-options)
- <a name="toc_vjscomponentprototypeinitchildren"></a>[vjs.Component.prototype.initChildren](#vjscomponentprototypeinitchildren)
- <a name="toc_vjscomponentprototypeontype-fn"></a>[vjs.Component.prototype.on](#vjscomponentprototypeontype-fn)
- <a name="toc_vjscomponentprototypeofftype-fn"></a>[vjs.Component.prototype.off](#vjscomponentprototypeofftype-fn)
- <a name="toc_vjscomponentprototypeonetype-fn"></a>[vjs.Component.prototype.one](#vjscomponentprototypeonetype-fn)
- <a name="toc_vjscomponentprototypetriggertype-event"></a>[vjs.Component.prototype.trigger](#vjscomponentprototypetriggertype-event)
- <a name="toc_vjscomponentprototypereadyfn"></a>[vjs.Component.prototype.ready](#vjscomponentprototypereadyfn)
- <a name="toc_vjscomponentprototypetriggerready"></a>[vjs.Component.prototype.triggerReady](#vjscomponentprototypetriggerready)
- <a name="toc_vjscomponentprototypeaddclassclasstoadd"></a>[vjs.Component.prototype.addClass](#vjscomponentprototypeaddclassclasstoadd)
- <a name="toc_vjscomponentprototyperemoveclassclasstoremove"></a>[vjs.Component.prototype.removeClass](#vjscomponentprototyperemoveclassclasstoremove)
- <a name="toc_vjscomponentprototypeshow"></a>[vjs.Component.prototype.show](#vjscomponentprototypeshow)
- <a name="toc_vjscomponentprototypehide"></a>[vjs.Component.prototype.hide](#vjscomponentprototypehide)
- <a name="toc_vjscomponentprototypelockshowing"></a>[vjs.Component.prototype.lockShowing](#vjscomponentprototypelockshowing)
- <a name="toc_vjscomponentprototypeunlockshowing"></a>[vjs.Component.prototype.unlockShowing](#vjscomponentprototypeunlockshowing)
- <a name="toc_vjscomponentprototypedisable"></a>[vjs.Component.prototype.disable](#vjscomponentprototypedisable)
- <a name="toc_vjscomponentprototypewidthnum-skiplisteners"></a>[vjs.Component.prototype.width](#vjscomponentprototypewidthnum-skiplisteners)
- <a name="toc_vjscomponentprototypeheightnum-skiplisteners"></a>[vjs.Component.prototype.height](#vjscomponentprototypeheightnum-skiplisteners)
- <a name="toc_vjscomponentprototypedimensionswidth-height"></a>[vjs.Component.prototype.dimensions](#vjscomponentprototypedimensionswidth-height)
- <a name="toc_vjscomponentprototypedimensionwidthorheight-num-skiplisteners"></a>[vjs.Component.prototype.dimension](#vjscomponentprototypedimensionwidthorheight-num-skiplisteners)
- <a name="toc_vjscomponentprototypeemittapevents"></a>[vjs.Component.prototype.emitTapEvents](#vjscomponentprototypeemittapevents)
- <a name="toc_vjsbuttonplayer-options"></a>[vjs.Button](#vjsbuttonplayer-options)
- <a name="toc_vjssliderplayer-options"></a>[vjs.Slider](#vjssliderplayer-options)
- <a name="toc_vjssliderprototypeonclickevent"></a><a name="toc_vjssliderprototype"></a>[vjs.Slider.prototype.onClick](#vjssliderprototypeonclickevent)
- <a name="toc_vjssliderhandleplayer-options"></a>[vjs.SliderHandle](#vjssliderhandleplayer-options)
- <a name="toc_vjssliderhandleprototypecreateel"></a><a name="toc_vjssliderhandleprototype"></a>[vjs.SliderHandle.prototype.createEl](#vjssliderhandleprototypecreateel)
- <a name="toc_vjsmenuplayer-options"></a>[vjs.Menu](#vjsmenuplayer-options)
- <a name="toc_vjsmenuprototypeadditemcomponent"></a><a name="toc_vjsmenuprototype"></a>[vjs.Menu.prototype.addItem](#vjsmenuprototypeadditemcomponent)
- <a name="toc_vjsmenuprototypecreateel"></a>[vjs.Menu.prototype.createEl](#vjsmenuprototypecreateel)
- <a name="toc_vjsmenuitemplayer-options"></a>[vjs.MenuItem](#vjsmenuitemplayer-options)
- <a name="toc_vjsmenuitemprototypecreateel"></a><a name="toc_vjsmenuitemprototype"></a>[vjs.MenuItem.prototype.createEl](#vjsmenuitemprototypecreateel)
- <a name="toc_vjsmenuitemprototypeonclick"></a>[vjs.MenuItem.prototype.onClick](#vjsmenuitemprototypeonclick)
- <a name="toc_vjsmenuitemprototypeselectedselected"></a>[vjs.MenuItem.prototype.selected](#vjsmenuitemprototypeselectedselected)
- <a name="toc_vjsmenubuttonplayer-options"></a>[vjs.MenuButton](#vjsmenubuttonplayer-options)
- <a name="toc_vjsmenubuttonprototypecreateitems"></a><a name="toc_vjsmenubuttonprototype"></a>[vjs.MenuButton.prototype.createItems](#vjsmenubuttonprototypecreateitems)
- <a name="toc_vjsmenubuttonprototypebuildcssclass"></a>[vjs.MenuButton.prototype.buildCSSClass](#vjsmenubuttonprototypebuildcssclass)
- <a name="toc_vjsplayertag-options-ready"></a>[vjs.Player](#vjsplayertag-options-ready)
- <a name="toc_vjsplayerprototypemanualtimeupdateson"></a><a name="toc_vjsplayerprototype"></a>[vjs.Player.prototype.manualTimeUpdatesOn](#vjsplayerprototypemanualtimeupdateson)
- <a name="toc_vjsplayerprototypeplay"></a>[vjs.Player.prototype.play](#vjsplayerprototypeplay)
- <a name="toc_vjsplayerprototypepostersrc"></a>[vjs.Player.prototype.poster](#vjsplayerprototypepostersrc)
- <a name="toc_vjsplayerprototypecontrolscontrols"></a>[vjs.Player.prototype.controls](#vjsplayerprototypecontrolscontrols)
- <a name="toc_vjsplayerprototypeusingnativecontrolsbool"></a>[vjs.Player.prototype.usingNativeControls](#vjsplayerprototypeusingnativecontrolsbool)
- <a name="toc_vjscontrolbarplayer-options"></a>[vjs.ControlBar](#vjscontrolbarplayer-options)
- <a name="toc_vjsplaytoggleplayer-options"></a>[vjs.PlayToggle](#vjsplaytoggleplayer-options)
- <a name="toc_vjscurrenttimedisplayplayer-options"></a>[vjs.CurrentTimeDisplay](#vjscurrenttimedisplayplayer-options)
- <a name="toc_vjsdurationdisplayplayer-options"></a>[vjs.DurationDisplay](#vjsdurationdisplayplayer-options)
- <a name="toc_vjstimedividerplayer-options"></a>[vjs.TimeDivider](#vjstimedividerplayer-options)
- <a name="toc_vjsremainingtimedisplayplayer-options"></a>[vjs.RemainingTimeDisplay](#vjsremainingtimedisplayplayer-options)
- <a name="toc_vjsfullscreentoggleplayer-options"></a>[vjs.FullscreenToggle](#vjsfullscreentoggleplayer-options)
- <a name="toc_vjsprogresscontrolplayer-options"></a>[vjs.ProgressControl](#vjsprogresscontrolplayer-options)
- <a name="toc_vjsseekbarplayer-options"></a>[vjs.SeekBar](#vjsseekbarplayer-options)
- <a name="toc_vjsloadprogressbarplayer-options"></a>[vjs.LoadProgressBar](#vjsloadprogressbarplayer-options)
- <a name="toc_vjsplayprogressbarplayer-options"></a>[vjs.PlayProgressBar](#vjsplayprogressbarplayer-options)
- <a name="toc_vjsseekhandleplayer-options"></a>[vjs.SeekHandle](#vjsseekhandleplayer-options)
- <a name="toc_vjsseekhandleprototypecreateel"></a><a name="toc_vjsseekhandleprototype"></a>[vjs.SeekHandle.prototype.createEl](#vjsseekhandleprototypecreateel)
- <a name="toc_vjsvolumecontrolplayer-options"></a>[vjs.VolumeControl](#vjsvolumecontrolplayer-options)
- <a name="toc_vjsvolumebarplayer-options"></a>[vjs.VolumeBar](#vjsvolumebarplayer-options)
- <a name="toc_vjsvolumelevelplayer-options"></a>[vjs.VolumeLevel](#vjsvolumelevelplayer-options)
- <a name="toc_vjsvolumehandleplayer-options"></a>[vjs.VolumeHandle](#vjsvolumehandleplayer-options)
- <a name="toc_vjsvolumehandleprototypecreateel"></a><a name="toc_vjsvolumehandleprototype"></a>[vjs.VolumeHandle.prototype.createEl](#vjsvolumehandleprototypecreateel)
- <a name="toc_vjsmutetoggleplayer-options"></a>[vjs.MuteToggle](#vjsmutetoggleplayer-options)
- <a name="toc_vjsvolumemenubutton"></a>[vjs.VolumeMenuButton](#vjsvolumemenubutton)
- <a name="toc_vjsposterimageplayer-options"></a>[vjs.PosterImage](#vjsposterimageplayer-options)
- <a name="toc_vjsloadingspinnerplayer-options"></a>[vjs.LoadingSpinner](#vjsloadingspinnerplayer-options)
- <a name="toc_vjsbigplaybuttonplayer-options"></a>[vjs.BigPlayButton](#vjsbigplaybuttonplayer-options)
- <a name="toc_vjsmediatechcontrollerplayer-options"></a>[vjs.MediaTechController](#vjsmediatechcontrollerplayer-options)
- <a name="toc_vjsmediatechcontrollerprototypeinitcontrolslisteners"></a><a name="toc_vjsmediatechcontrollerprototype"></a>[vjs.MediaTechController.prototype.initControlsListeners](#vjsmediatechcontrollerprototypeinitcontrolslisteners)
- <a name="toc_vjsmediatechcontrollerprototyperemovecontrolslisteners"></a>[vjs.MediaTechController.prototype.removeControlsListeners](#vjsmediatechcontrollerprototyperemovecontrolslisteners)
- <a name="toc_vjsmediatechcontrollerprototypeonclick"></a>[vjs.MediaTechController.prototype.onClick](#vjsmediatechcontrollerprototypeonclick)
- <a name="toc_vjsmediatechcontrollerprototypeontap"></a>[vjs.MediaTechController.prototype.onTap](#vjsmediatechcontrollerprototypeontap)
- <a name="toc_vjshtml5player-options-ready"></a>[vjs.Html5](#vjshtml5player-options-ready)
- <a name="toc_vjshtml5issupported"></a>[vjs.Html5.isSupported](#vjshtml5issupported)
- <a name="toc_vjsflashplayer-options-ready"></a>[vjs.Flash](#vjsflashplayer-options-ready)
- <a name="toc_vjsflashissupported"></a>[vjs.Flash.isSupported](#vjsflashissupported)
- <a name="toc_vjsmedialoader"></a>[vjs.MediaLoader](#vjsmedialoader)
- <a name="toc_vjsplayerprototypetexttracks"></a>[vjs.Player.prototype.textTracks](#vjsplayerprototypetexttracks)
- <a name="toc_vjsplayerprototypeaddtexttrackkind-label-language-options"></a>[vjs.Player.prototype.addTextTrack](#vjsplayerprototypeaddtexttrackkind-label-language-options)
- <a name="toc_vjsplayerprototypeaddtexttrackstracklist"></a>[vjs.Player.prototype.addTextTracks](#vjsplayerprototypeaddtexttrackstracklist)
- <a name="toc_vjstexttrackplayer-options"></a>[vjs.TextTrack](#vjstexttrackplayer-options)
- <a name="toc_vjstexttrackprototypekind"></a><a name="toc_vjstexttrackprototype"></a>[vjs.TextTrack.prototype.kind](#vjstexttrackprototypekind)
- <a name="toc_vjstexttrackprototypesrc"></a>[vjs.TextTrack.prototype.src](#vjstexttrackprototypesrc)
- <a name="toc_vjstexttrackprototypedflt"></a>[vjs.TextTrack.prototype.dflt](#vjstexttrackprototypedflt)
- <a name="toc_vjstexttrackprototypetitle"></a>[vjs.TextTrack.prototype.title](#vjstexttrackprototypetitle)
- <a name="toc_vjstexttrackprototypelanguage"></a>[vjs.TextTrack.prototype.language](#vjstexttrackprototypelanguage)
- <a name="toc_vjstexttrackprototypelabel"></a>[vjs.TextTrack.prototype.label](#vjstexttrackprototypelabel)
- <a name="toc_vjstexttrackprototypecues"></a>[vjs.TextTrack.prototype.cues](#vjstexttrackprototypecues)
- <a name="toc_vjstexttrackprototypeactivecues"></a>[vjs.TextTrack.prototype.activeCues](#vjstexttrackprototypeactivecues)
- <a name="toc_vjstexttrackprototypereadystate"></a>[vjs.TextTrack.prototype.readyState](#vjstexttrackprototypereadystate)
- <a name="toc_vjstexttrackprototypemode"></a>[vjs.TextTrack.prototype.mode](#vjstexttrackprototypemode)
- <a name="toc_vjstexttrackprototypeadjustfontsize"></a>[vjs.TextTrack.prototype.adjustFontSize](#vjstexttrackprototypeadjustfontsize)
- <a name="toc_vjstexttrackprototypecreateel"></a>[vjs.TextTrack.prototype.createEl](#vjstexttrackprototypecreateel)
- <a name="toc_vjstexttrackprototypeshow"></a>[vjs.TextTrack.prototype.show](#vjstexttrackprototypeshow)
- <a name="toc_vjstexttrackprototypehide"></a>[vjs.TextTrack.prototype.hide](#vjstexttrackprototypehide)
- <a name="toc_vjstexttrackprototypedisable"></a>[vjs.TextTrack.prototype.disable](#vjstexttrackprototypedisable)
- <a name="toc_vjstexttrackprototypeactivate"></a>[vjs.TextTrack.prototype.activate](#vjstexttrackprototypeactivate)
- <a name="toc_vjstexttrackprototypedeactivate"></a>[vjs.TextTrack.prototype.deactivate](#vjstexttrackprototypedeactivate)
- <a name="toc_vjscaptionstrack"></a>[vjs.CaptionsTrack](#vjscaptionstrack)
- <a name="toc_vjssubtitlestrack"></a>[vjs.SubtitlesTrack](#vjssubtitlestrack)
- <a name="toc_vjschapterstrack"></a>[vjs.ChaptersTrack](#vjschapterstrack)
- <a name="toc_vjstexttrackdisplay"></a>[vjs.TextTrackDisplay](#vjstexttrackdisplay)
- <a name="toc_vjstexttrackmenuitem"></a>[vjs.TextTrackMenuItem](#vjstexttrackmenuitem)
- <a name="toc_vjsofftexttrackmenuitem"></a>[vjs.OffTextTrackMenuItem](#vjsofftexttrackmenuitem)
- <a name="toc_vjstexttrackbutton"></a>[vjs.TextTrackButton](#vjstexttrackbutton)
- <a name="toc_vjscaptionsbutton"></a>[vjs.CaptionsButton](#vjscaptionsbutton)
- <a name="toc_vjssubtitlesbutton"></a>[vjs.SubtitlesButton](#vjssubtitlesbutton)
- <a name="toc_vjschaptersbutton"></a>[vjs.ChaptersButton](#vjschaptersbutton)
- <a name="toc_vjschapterstrackmenuitem"></a>[vjs.ChaptersTrackMenuItem](#vjschapterstrackmenuitem)

<a name="vjs"></a>

# vjs.options()

> Global Player instance options, surfaced from [vjs.Player](#vjsplayertag-options-ready).prototype.options_
vjs.options = [vjs.Player](#vjsplayertag-options-ready).prototype.options_
All options should use string keys so they avoid
renaming by closure compiler

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.players()

> Global player list

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.CoreObject()

> Core Object/Class for objects that use inheritance + contstructors

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.CoreObject.extend(props)

> Create a new object that inherits from this Object

**Parameters:**

- `{Object} props` Functions and properties to be applied to the

new object's prototype

**Return:**

`{vjs.CoreObject}` Returns an object that inherits from CoreObject

{*}

<sub>Go: [TOC](#tableofcontents) | [vjs.CoreObject](#toc_vjscoreobject)</sub>

# vjs.CoreObject.create()

> Create a new instace of this Object class

**Return:**

`{vjs.CoreObject}` Returns an instance of a CoreObject subclass

{*}

<sub>Go: [TOC](#tableofcontents) | [vjs.CoreObject](#toc_vjscoreobject)</sub>

# vjs.on(elem, type, fn)

> Add an event listener to element
It stores the handler function in a separate cache object
and adds a generic handler to the element's event,
along with a unique id (guid) to the element.

**Parameters:**

- `{Element | Object} elem` Element or object to bind listeners to
- `{String} type` Type of event to bind to.
- `{Function} fn` Event listener.

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.off(elem, type, fn)

> Removes event listeners from an element

**Parameters:**

- `{Element | Object} elem` Object to remove listeners from
- `{String=} type` Type of listener to remove. Don't include to remove all events from element.
- `{Function} fn` Specific listener to remove. Don't incldue to remove listeners for an event type.

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.cleanUpEvents(elem, type)

> Clean up the listener cache and dispatchers

**Parameters:**

- `{Element | Object} elem` Element to clean up
- `{String} type` Type of event to clean up

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.fixEvent(event)

> Fix a native event to have standard property values

**Parameters:**

- `{Object} event` Event object to fix

**Return:**

`{Object}`

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.trigger(elem, event)

> Trigger an event for an element

**Parameters:**

- `{Element | Object} elem` Element to trigger an event on
- `{String} event` Type of event to trigger

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.one(elem, type, fn)

> Trigger a listener only once for an event

**Parameters:**

- `{Element | Object} elem` Element or object to
- `{[type]} type` [description]
- `{Function} fn` [description]

**Return:**

`{[type]}`

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.createEl(tagName, properties)

> Creates an element and applies properties.

**Parameters:**

- `{String=} tagName` Name of tag to be created.
- `{Object=} properties` Element properties to be applied.

**Return:**

`{Element}`

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.capitalize(string)

> Uppercase the first letter of a string

**Parameters:**

- `{String} string` String to be uppercased

**Return:**

`{String}`

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.obj()

> Object functions container

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.obj.each(obj, fn)

> Loop through each property in an object and call a function
whose arguments are (key,value)

**Parameters:**

- `{Object} obj` Object of properties
- `{Function} fn` Function to be called on each property.

{*}

<sub>Go: [TOC](#tableofcontents) | [vjs.obj](#toc_vjsobj)</sub>

# vjs.obj.merge(obj1, obj2)

> Merge two objects together and return the original.

**Parameters:**

- `{Object} obj1`
- `{Object} obj2`

**Return:**

`{Object}`

<sub>Go: [TOC](#tableofcontents) | [vjs.obj](#toc_vjsobj)</sub>

# vjs.obj.deepMerge(obj1, obj2)

> Merge two objects, and merge any properties that are objects
instead of just overwriting one. Uses to merge options hashes
where deeper default settings are important.

**Parameters:**

- `{Object} obj1` Object to override
- `{Object} obj2` Overriding object

**Return:**

`{Object}` New object. Obj1 and Obj2 will be untouched.

<sub>Go: [TOC](#tableofcontents) | [vjs.obj](#toc_vjsobj)</sub>

# vjs.obj.copy(obj)

> Make a copy of the supplied object

**Parameters:**

- `{Object} obj` Object to copy

**Return:**

`{Object}` Copy of object

<sub>Go: [TOC](#tableofcontents) | [vjs.obj](#toc_vjsobj)</sub>

# vjs.obj.isPlain(obj)

> Check if an object is plain, and not a dom node or any object sub-instance

**Parameters:**

- `{Object} obj` Object to check

**Return:**

`{Boolean}` True if plain, false otherwise

<sub>Go: [TOC](#tableofcontents) | [vjs.obj](#toc_vjsobj)</sub>

# vjs.bind(context, fn, uid)

> Bind (a.k.a proxy or Context). A simple method for changing the context of a function
   It also stores a unique id on the function so it can be easily removed from events

**Parameters:**

- `{*} context` The object to bind as scope
- `{Function} fn` The function to be bound to a scope
- `{Number=} uid` An optional unique ID for the function to be set

**Return:**

`{Function}`

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.cache()

> Element Data Store. Allows for binding data to an element without putting it directly on the element.
Ex. Event listneres are stored here.
(also from jsninja.com, slightly modified and updated for closure compiler)

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.guid()

> Unique ID for an element or function

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.expando()

> Unique attribute name to store an element's guid in

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.getData(el)

> Returns the cache object where data for an element is stored

**Parameters:**

- `{Element} el` Element to store data for.

**Return:**

`{Object}`

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.hasData(el)

> Returns the cache object where data for an element is stored

**Parameters:**

- `{Element} el` Element to store data for.

**Return:**

`{Object}`

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.removeData(el)

> Delete data for the element from the cache and the guid attr from getElementById

**Parameters:**

- `{Element} el` Remove data for an element

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.addClass(element, classToAdd)

> Add a CSS class name to an element

**Parameters:**

- `{Element} element` Element to add class name to
- `{String} classToAdd` Classname to add

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.removeClass(element, classToAdd)

> Remove a CSS class name from an element

**Parameters:**

- `{Element} element` Element to remove from class name
- `{String} classToAdd` Classname to remove

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.TEST_VID()

> Element for testing browser HTML5 video capabilities

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.USER_AGENT()

> Useragent for browser testing.

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.IS_IPHONE()

> Device is an iPhone

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.getAttributeValues(tag)

> Get an element's attribute values, as defined on the HTML tag
Attributs are not the same as properties. They're defined on the tag
or with setAttribute (which shouldn't be used with HTML)
This will return true or false for boolean attributes.

**Parameters:**

- `{Element} tag` Element from which to get tag attributes

**Return:**

`{Object}`

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.getComputedDimension(el, strCssRule)

> Get the computed style value for an element
From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/

**Parameters:**

- `{Element} el` Element to get style value for
- `{String} strCssRule` Style name

**Return:**

`{String}` Style value

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.insertFirst(child, parent)

> Insert an element as the first child node of another

**Parameters:**

- `{Element} child` Element to insert
- `{[type]} parent` Element to insert child into

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.support()

> Object to hold browser support information

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.el(id)

> Shorthand for document.getElementById()
Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.

**Parameters:**

- `{String} id` Element ID

**Return:**

`{Element}` Element with supplied ID

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.formatTime(seconds, guide)

> Format seconds as a time string, H:MM:SS or M:SS
Supplying a guide (in seconds) will force a number of leading zeros
to cover the length of the guide

**Parameters:**

- `{Number} seconds` Number of seconds to be turned into a string
- `{Number} guide` Number (in seconds) to model the string after

**Return:**

`{String}` Time formatted as H:MM:SS or M:SS

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.trim(string)

> Trim whitespace from the ends of a string.

**Parameters:**

- `{String} string` String to trim

**Return:**

`{String}` Trimmed string

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.round(num, dec)

> Should round off a number to a decimal place

**Parameters:**

- `{Number} num` Number to round
- `{Number} dec` Number of decimal places to round to

**Return:**

`{Number}` Rounded number

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.createTimeRange(start, end)

> Should create a fake TimeRange object
Mimics an HTML5 time range instance, which has functions that
return the start and end times for a range
TimeRanges are returned by the buffered() method

**Parameters:**

- `{Number} start` Start time in seconds
- `{Number} end` End time in seconds

**Return:**

`{Object}` Fake TimeRange object

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.get(url, onSuccess, onError)

> Simple http request for retrieving external files (e.g. text tracks)

**Parameters:**

- `{String} url` URL of resource
- `{Function=} onSuccess` Success callback
- `{Function=} onError` Error callback

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.setLocalStorage()

> Local Storage
================================================================================

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.getAbsoluteURL(url)

> Get abosolute version of relative URL. Used to tell flash correct URL.
http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue

**Parameters:**

- `{String} url` URL to make absolute

**Return:**

`{String}` Absolute URL

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.Component(player, options)

> Base UI Component class

**Parameters:**

- `{Object} player` Main Player
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjscomponentprototype"></a>

# vjs.Component.prototype.dispose()

> Dispose of the component and all child components.

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.player()

> Return the component's player.

**Return:**

`{vjs.Player}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.options(obj)

> Deep merge of options objects
Whenever a property is an object on both options objects
the two properties will be merged using [vjs.obj.deepMerge](#vjsobjdeepmergeobj1-obj2).

This is used for merging options for child components. We
want it to be easy to override individual options on a child
component without having to rewrite all the other default options.

Parent.prototype.options_ = {
  children: {
```js
'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
'childTwo': {},
'childThree': {}
```

  }
}
newOptions = {
  children: {
```js
'childOne': { 'foo': 'baz', 'abc': '123' }
'childTwo': null,
'childFour': {}
```

  }
}

this.options(newOptions);

RESULT

{
  children: {
```js
'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
'childTwo': null, // Disabled. Won't be initialized.
'childThree': {},
'childFour': {}
```

  }
}

**Parameters:**

- `{Object} obj` Object whose values will be overwritten

**Return:**

`{Object}` NEW merged object. Does not return obj1.

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.createEl(tagName, attributes)

> Create the component's DOM element.

**Parameters:**

- `{String=} tagName` Element's node type. e.g. 'div'
- `{Object=} attributes` An object of element attributes that should be set on the element.

**Return:**

`{Element}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.el()

> Return the component's DOM element.

**Return:**

`{Element}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.contentEl()

> Return the component's DOM element for embedding content.
  will either be el_ or a new element defined in createEl

**Return:**

`{Element}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.id()

> Return the component's ID.

**Return:**

`{String}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.name()

> Return the component's ID.

**Return:**

`{String}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.children()

> Returns array of all child components.

**Return:**

`{Array}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.getChildById()

> Returns a child component with the provided ID.

**Return:**

`{Array}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.getChild()

> Returns a child component with the provided ID.

**Return:**

`{Array}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.addChild(child, options)

> Adds a child component inside this component.

**Parameters:**

- `{String | vjs.Component} child` The class name or instance of a child to add.
- `{Object=} options` Optional options, including options to be passed to

children of the child.

**Return:**

`{vjs.Component}` The child component, because it might be created in this process.

{accessControls|checkRegExp|checkTypes|checkVars|const|constantProperty|deprecated|duplicate|es5Strict|fileoverviewTags|globalThis|invalidCasts|missingProperties|nonStandardJsDocs|strictModuleDepCheck|undefinedNames|undefinedVars|unknownDefines|uselessCode|visibility}

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.initChildren()

> Initialize default child components from options

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.on(type, fn)

> Add an event listener to this component's element. Context will be the component.

**Parameters:**

- `{String} type` Event type e.g. 'click'
- `{Function} fn` Event listener

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.off(type, fn)

> Remove an event listener from the component's element

**Parameters:**

- `{String=} type` Optional event type. Without type it will remove all listeners.
- `{Function=} fn` Optional event listener. Without fn it will remove all listeners for a type.

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.one(type, fn)

> Add an event listener to be triggered only once and then removed

**Parameters:**

- `{String} type` Event type
- `{Function} fn` Event listener

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.trigger(type, event)

> Trigger an event on an element

**Parameters:**

- `{String} type` Event type to trigger
- `{Event | Object} event` Event object to be passed to the listener

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.ready(fn)

> Bind a listener to the component's ready state.
  Different from event listeners in that if the ready event has already happend
  it will trigger the function immediately.

**Parameters:**

- `{Function} fn` Ready listener

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.triggerReady()

> Trigger the ready listeners

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.addClass(classToAdd)

> Add a CSS class name to the component's element

**Parameters:**

- `{String} classToAdd` Classname to add

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.removeClass(classToRemove)

> Remove a CSS class name from the component's element

**Parameters:**

- `{String} classToRemove` Classname to remove

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.show()

> Show the component element if hidden

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.hide()

> Hide the component element if hidden

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.lockShowing()

> Lock an item in its visible state. To be used with fadeIn/fadeOut.

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.unlockShowing()

> Unlock an item to be hidden. To be used with fadeIn/fadeOut.

**Return:**

`{vjs.Component}`

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.disable()

> Disable component by making it unshowable

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.width(num, skipListeners)

> If a value is provided it will change the width of the player to that value
otherwise the width is returned
http://dev.w3.org/html5/spec/dimension-attributes.html#attr-dim-height
Video tag width/height only work in pixels. No percents.
But allowing limited percents use. e.g. width() will return number+%, not computed width

**Parameters:**

- `{Number | String=} num` Optional width number
- `{[type]} skipListeners` Skip the 'resize' event trigger

**Return:**

`{vjs.Component | Number | String}` Returns 'this' if dimension was set.

Otherwise it returns the dimension.

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.height(num, skipListeners)

> Get or set the height of the player

**Parameters:**

- `{Number | String=} num` Optional new player height
- `{Boolean=} skipListeners` Optional skip resize event trigger

**Return:**

`{vjs.Component | Number | String}` The player, or the dimension

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.dimensions(width, height)

> Set both width and height at the same time.

**Parameters:**

- `{Number | String} width`
- `{Number | String} height`

**Return:**

`{vjs.Component}` The player.

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.dimension(widthOrHeight, num, skipListeners)

> Get or set width or height.
All for an integer, integer + 'px' or integer + '%';
Known issue: hidden elements. Hidden elements officially have a width of 0.
So we're defaulting to the style.width value and falling back to computedStyle
which has the hidden element issue.
Info, but probably not an efficient fix:
http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/

**Parameters:**

- `{String=} widthOrHeight` 'width' or 'height'
- `{Number | String=} num` New dimension
- `{Boolean=} skipListeners` Skip resize event trigger

**Return:**

`{vjs.Component | Number | String}` Return the player if setting a dimension.

Otherwise it returns the dimension.

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Component.prototype.emitTapEvents()

> Emit 'tap' events when touch events are supported. We're requireing them to
be enabled because otherwise every component would have this extra overhead
unnecessarily, on mobile devices where extra overhead is especially bad.

This is being implemented so we can support taps on the video element
toggling the controls.

<sub>Go: [TOC](#tableofcontents) | [vjs.Component.prototype](#toc_vjscomponentprototype)</sub>

# vjs.Button(player, options)

> Base class for all buttons

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.Slider(player, options)

> Parent for seek bar and volume slider

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjssliderprototype"></a>

# vjs.Slider.prototype.onClick(event)

> Listener for click events on slider, used to prevent clicks
  from bubbling up to parent elements like button menus.

**Parameters:**

- `{Object} event` Event object

<sub>Go: [TOC](#tableofcontents) | [vjs.Slider.prototype](#toc_vjssliderprototype)</sub>

# vjs.SliderHandle(player, options)

> SeekBar Behavior includes play progress bar, and seek handle
Needed so it can determine seek position based on handle position/size

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjssliderhandleprototype"></a>

# vjs.SliderHandle.prototype.createEl()

> @inheritDoc

<sub>Go: [TOC](#tableofcontents) | [vjs.SliderHandle.prototype](#toc_vjssliderhandleprototype)</sub>

# vjs.Menu(player, options)

> The base for text track and settings menu buttons.

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjsmenuprototype"></a>

# vjs.Menu.prototype.addItem(component)

> Add a menu item to the menu

**Parameters:**

- `{Object | String} component` Component or component type to add

<sub>Go: [TOC](#tableofcontents) | [vjs.Menu.prototype](#toc_vjsmenuprototype)</sub>

# vjs.Menu.prototype.createEl()

> @inheritDoc

<sub>Go: [TOC](#tableofcontents) | [vjs.Menu.prototype](#toc_vjsmenuprototype)</sub>

# vjs.MenuItem(player, options)

> Menu item

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjsmenuitemprototype"></a>

# vjs.MenuItem.prototype.createEl()

> @inheritDoc

<sub>Go: [TOC](#tableofcontents) | [vjs.MenuItem.prototype](#toc_vjsmenuitemprototype)</sub>

# vjs.MenuItem.prototype.onClick()

> @inheritDoc

<sub>Go: [TOC](#tableofcontents) | [vjs.MenuItem.prototype](#toc_vjsmenuitemprototype)</sub>

# vjs.MenuItem.prototype.selected(selected)

> Set this menu item as selected or not

**Parameters:**

- `{Boolean} selected`

<sub>Go: [TOC](#tableofcontents) | [vjs.MenuItem.prototype](#toc_vjsmenuitemprototype)</sub>

# vjs.MenuButton(player, options)

> A button class with a popup menu

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjsmenubuttonprototype"></a>

# vjs.MenuButton.prototype.createItems()

> Create the list of menu items. Specific to each subclass.

<sub>Go: [TOC](#tableofcontents) | [vjs.MenuButton.prototype](#toc_vjsmenubuttonprototype)</sub>

# vjs.MenuButton.prototype.buildCSSClass()

> @inheritDoc

<sub>Go: [TOC](#tableofcontents) | [vjs.MenuButton.prototype](#toc_vjsmenubuttonprototype)</sub>

# vjs.Player(tag, options, ready)

> Main player class. A player instance is returned by _V_(id);

**Parameters:**

- `{Element} tag` The original video tag used for configuring options
- `{Object=} options` Player options
- `{Function=} ready` Ready callback function



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjsplayerprototype"></a>

# vjs.Player.prototype.manualTimeUpdatesOn()

> Time Tracking --------------------------------------------------------------

<sub>Go: [TOC](#tableofcontents) | [vjs.Player.prototype](#toc_vjsplayerprototype)</sub>

# vjs.Player.prototype.play()

> Start media playback
http://dev.w3.org/html5/spec/video.html#dom-media-play
We're triggering the 'play' event here instead of relying on the
media element to allow using event.preventDefault() to stop
play from happening if desired. Usecase: preroll ads.

<sub>Go: [TOC](#tableofcontents) | [vjs.Player.prototype](#toc_vjsplayerprototype)</sub>

# vjs.Player.prototype.poster(src)

> Get or set the poster image source url.

**Parameters:**

- `{String} src` Poster image source URL

**Return:**

`{String}` Poster image source URL or null

<sub>Go: [TOC](#tableofcontents) | [vjs.Player.prototype](#toc_vjsplayerprototype)</sub>

# vjs.Player.prototype.controls(controls)

> Get or set whether or not the controls are showing.

**Parameters:**

- `{Boolean} controls` Set controls to showing or not

**Return:**

`{Boolean}` Controls are showing

<sub>Go: [TOC](#tableofcontents) | [vjs.Player.prototype](#toc_vjsplayerprototype)</sub>

# vjs.Player.prototype.usingNativeControls(bool)

> Toggle native controls on/off. Native controls are the controls built into
devices (e.g. default iPhone controls), Flash, or other techs
(e.g. Vimeo Controls)

**This should only be set by the current tech, because only the tech knows
if it can support native controls**

**Parameters:**

- `{Boolean} bool` True signals that native controls are on

**Return:**

`{vjs.Player}` Returns the player

<sub>Go: [TOC](#tableofcontents) | [vjs.Player.prototype](#toc_vjsplayerprototype)</sub>

# vjs.ControlBar(player, options)

> Container of main controls

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.PlayToggle(player, options)

> Button to toggle between play and pause

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.CurrentTimeDisplay(player, options)

> Displays the current time

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.DurationDisplay(player, options)

> Displays the duration

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.TimeDivider(player, options)

> Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.RemainingTimeDisplay(player, options)

> Displays the time left in the video

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.FullscreenToggle(player, options)

> Toggle fullscreen video

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.ProgressControl(player, options)

> Seek, Load Progress, and Play Progress

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.SeekBar(player, options)

> Seek Bar and holder for the progress bars

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.LoadProgressBar(player, options)

> Shows load progres

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.PlayProgressBar(player, options)

> Shows play progress

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.SeekHandle(player, options)

> SeekBar component includes play progress bar, and seek handle
Needed so it can determine seek position based on handle position/size

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjsseekhandleprototype"></a>

# vjs.SeekHandle.prototype.createEl()

> @inheritDoc

<sub>Go: [TOC](#tableofcontents) | [vjs.SeekHandle.prototype](#toc_vjsseekhandleprototype)</sub>

# vjs.VolumeControl(player, options)

> Control the volume

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.VolumeBar(player, options)

> Contains volume level

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.VolumeLevel(player, options)

> Shows volume level

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.VolumeHandle(player, options)

> Change volume level

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjsvolumehandleprototype"></a>

# vjs.VolumeHandle.prototype.createEl()

> @inheritDoc

<sub>Go: [TOC](#tableofcontents) | [vjs.VolumeHandle.prototype](#toc_vjsvolumehandleprototype)</sub>

# vjs.MuteToggle(player, options)

> Mute the audio

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.VolumeMenuButton()

> Menu button with a popup for showing the volume slider.

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.PosterImage(player, options)

> Poster image. Shows before the video plays.

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.LoadingSpinner(player, options)

> Loading spinner for waiting events

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.BigPlayButton(player, options)

> Initial play button. Shows before the video has played. The hiding of the
big play button is done via CSS and player states.

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.MediaTechController(player, options)

> Base class for media (HTML5 Video, Flash) controllers

**Parameters:**

- `{vjs.Player | Object} player` Central player instance
- `{Object=} options` Options object



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjsmediatechcontrollerprototype"></a>

# vjs.MediaTechController.prototype.initControlsListeners()

> Set up click and touch listeners for the playback element
On desktops, a click on the video itself will toggle playback,
on a mobile device a click on the video toggles controls.
(toggling controls is done by toggling the user state between active and
inactive)

A tap can signal that a user has become active, or has become inactive
e.g. a quick tap on an iPhone movie should reveal the controls. Another
quick tap should hide them again (signaling the user is in an inactive
viewing state)

In addition to this, we still want the user to be considered inactive after
a few seconds of inactivity.

Note: the only part of iOS interaction we can't mimic with this setup
is a touch and hold on the video element counting as activity in order to
keep the controls showing, but that shouldn't be an issue. A touch and hold on
any controls will still keep the user active

<sub>Go: [TOC](#tableofcontents) | [vjs.MediaTechController.prototype](#toc_vjsmediatechcontrollerprototype)</sub>

# vjs.MediaTechController.prototype.removeControlsListeners()

> Remove the listeners used for click and tap controls. This is needed for
toggling to controls disabled, where a tap/touch should do nothing.

<sub>Go: [TOC](#tableofcontents) | [vjs.MediaTechController.prototype](#toc_vjsmediatechcontrollerprototype)</sub>

# vjs.MediaTechController.prototype.onClick()

> Handle a click on the media element. By default will play/pause the media.

<sub>Go: [TOC](#tableofcontents) | [vjs.MediaTechController.prototype](#toc_vjsmediatechcontrollerprototype)</sub>

# vjs.MediaTechController.prototype.onTap()

> Handle a tap on the media element. By default it will toggle the user
activity state, which hides and shows the controls.

<sub>Go: [TOC](#tableofcontents) | [vjs.MediaTechController.prototype](#toc_vjsmediatechcontrollerprototype)</sub>

# vjs.Html5(player, options, ready)

> HTML5 Media Controller - Wrapper for HTML5 Media API

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`
- `{Function=} ready`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.Html5.isSupported()

> HTML5 Support Testing ----------------------------------------------------

<sub>Go: [TOC](#tableofcontents) | [vjs.Html5](#toc_vjshtml5)</sub>

# vjs.Flash(player, options, ready)

> HTML5 Media Controller - Wrapper for HTML5 Media API

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`
- `{Function=} ready`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.Flash.isSupported()

> Flash Support Testing --------------------------------------------------------

<sub>Go: [TOC](#tableofcontents) | [vjs.Flash](#toc_vjsflash)</sub>

# vjs.MediaLoader()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.Player.prototype.textTracks()

> Get an array of associated text tracks. captions, subtitles, chapters, descriptions
http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks

**Return:**

`{Array}` Array of track objects

<sub>Go: [TOC](#tableofcontents) | [vjs.Player.prototype](#toc_vjsplayerprototype)</sub>

# vjs.Player.prototype.addTextTrack(kind, label, language, options)

> Add a text track
In addition to the W3C settings we allow adding additional info through options.
http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack

**Parameters:**

- `{String} kind` Captions, subtitles, chapters, descriptions, or metadata
- `{String=} label` Optional label
- `{String=} language` Optional language
- `{Object=} options` Additional track options, like src

<sub>Go: [TOC](#tableofcontents) | [vjs.Player.prototype](#toc_vjsplayerprototype)</sub>

# vjs.Player.prototype.addTextTracks(trackList)

> Add an array of text tracks. captions, subtitles, chapters, descriptions
Track objects will be stored in the player.textTracks() array

**Parameters:**

- `{Array} trackList` Array of track elements or objects (fake track elements)

<sub>Go: [TOC](#tableofcontents) | [vjs.Player.prototype](#toc_vjsplayerprototype)</sub>

# vjs.TextTrack(player, options)

> Track Class
Contains track methods for loading, showing, parsing cues of tracks

**Parameters:**

- `{vjs.Player | Object} player`
- `{Object=} options`



<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

<a name="vjstexttrackprototype"></a>

# vjs.TextTrack.prototype.kind()

> Get the track kind value

**Return:**

`{String}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.src()

> Get the track src value

**Return:**

`{String}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.dflt()

> Get the track default value
'default' is a reserved keyword

**Return:**

`{Boolean}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.title()

> Get the track title value

**Return:**

`{String}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.language()

> Get the track language value

**Return:**

`{String}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.label()

> Get the track label value

**Return:**

`{String}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.cues()

> Get the track cues

**Return:**

`{Array}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.activeCues()

> Get the track active cues

**Return:**

`{Array}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.readyState()

> Get the track readyState

**Return:**

`{Number}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.mode()

> Get the track mode

**Return:**

`{Number}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.adjustFontSize()

> Change the font size of the text track to make it larger when playing in fullscreen mode
and restore it to its normal size when not in fullscreen mode.

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.createEl()

> Create basic div to hold cue text

**Return:**

`{Element}`

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.show()

> Show: Mode Showing (2)
Indicates that the text track is active. If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
In addition, for text tracks whose kind is subtitles or captions, the cues are being displayed over the video as appropriate;
for text tracks whose kind is descriptions, the user agent is making the cues available to the user in a non-visual fashion;
and for text tracks whose kind is chapters, the user agent is making available to the user a mechanism by which the user can navigate to any point in the media resource by selecting a cue.
The showing by default state is used in conjunction with the default attribute on track elements to indicate that the text track was enabled due to that attribute.
This allows the user agent to override the state if a later track is discovered that is more appropriate per the user's preferences.

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.hide()

> Hide: Mode Hidden (1)
Indicates that the text track is active, but that the user agent is not actively displaying the cues.
If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
The user agent is maintaining a list of which cues are active, and events are being fired accordingly.

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.disable()

> Disable: Mode Off/Disable (0)
Indicates that the text track is not active. Other than for the purposes of exposing the track in the DOM, the user agent is ignoring the text track.
No cues are active, no events are fired, and the user agent will not attempt to obtain the track's cues.

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.activate()

> Turn on cue tracking. Tracks that are showing OR hidden are active.

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.TextTrack.prototype.deactivate()

> Turn off cue tracking.

<sub>Go: [TOC](#tableofcontents) | [vjs.TextTrack.prototype](#toc_vjstexttrackprototype)</sub>

# vjs.CaptionsTrack()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.SubtitlesTrack()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.ChaptersTrack()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.TextTrackDisplay()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.TextTrackMenuItem()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.OffTextTrackMenuItem()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.TextTrackButton()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.CaptionsButton()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.SubtitlesButton()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.ChaptersButton()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

# vjs.ChaptersTrackMenuItem()

> @constructor

<sub>Go: [TOC](#tableofcontents) | [vjs](#toc_vjs)</sub>

_&mdash;generated by [apidox](https://github.com/codeactual/apidox)&mdash;_
