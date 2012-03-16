---
layout: docs
title: HTML5 Video Text Tracks (Subtitles, Captions, Chapters)
description: Video.js support for captions, subtitles, and chapters through the use of the HTML5 video track element.
body_id: tracks
body_class: docs subpage
---

Tracks
======

Text Tracks are a function of HTML5 video for providing time triggered text to the viewer. Video.js makes tracks work across all browsers. There are currently five types of tracks:

- **Subtitles**: Translations of the dialogue in the video for when audio is available but not understood. Subtitles are shown over the video.
- **Captions**: Transcription of the dialogue, sound effects, musical cues, and other audio information for when the viewer is deaf/hard of hearing, or the video is muted. Captions are also shown over the video.
- **Chapters**: Chapter titles that are used to create navigation within the video. Typically they're in the form of a list of chapters that the viewer can click on to go to a specific chapter.
- **Descriptions** (not supported yet): Text descriptions of what's happening in the video for when the video portion isn't available, because the viewer is blind, not using a screen, or driving and about to crash because they're trying to enjoy a video while driving. Descriptions are read by a screen reader or turned into a separate audio track.
- **Metadata** (not supported yet): Tracks that have data meant for javascript to parse and do something with. These aren't shown to the user.

Creating the Text File
----------------------
To provide 
Tracks require the WebVTT timed text format.