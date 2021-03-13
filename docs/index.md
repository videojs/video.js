# [Video.js][vjs-website] Documentation

There are two categories of docs: [Guides](/docs/guides/) and [API docs][api].

Guides explain general topics and use cases (e.g. setup). API docs are automatically generated from the codebase and give specific details about functions, properties, and events.

## Table of Contents

* [Resolving Issues](#resolving-issues)
  * [FAQ](#faq)
  * [Troubleshooting](#troubleshooting)
* [Guides](#guides)
  * [Getting Started](#getting-started)
    * [Setup](#setup)
    * [Player Workflows](#player-workflows)
    * [Options](#options)
    * [Tracks](#tracks)
  * [Customizing](#customizing)
    * [Skins](#skins)
    * [Plugins](#plugins)
    * [Components](#components)
    * [Tech](#tech)
    * [Languages](#languages)
    * [Hooks](#hooks)
    * [Debugging](#debugging)
* [API Docs](#api-docs)

## Resolving Issues

### [FAQ](/docs/guides/faq.md)

The frequently asked questions for Video.js.

### [Troubleshooting](/docs/guides/troubleshooting.md)

Troubleshooting help for Video.js.

## [Guides](/docs/guides/)

### Getting Started

#### [Setup](/docs/guides/setup.md)

The setup guide covers all methods of setting up Video.js players.

#### [Player Workflows](/docs/guides/player-workflows.md)

After mastering the basics of setup move over to this guide for some more advanced player workflows.

#### [Options](/docs/guides/options.md)

There are a number of options that can be used to change how the player behaves, starting with the HTML5 media options like autoplay and preload, and expanding to Video.js specific options.

#### [Tracks](/docs/guides/tracks.md)

Tracks are used for displaying text information over a video, selecting different audio tracks for a video, or selecting different video tracks.

### Customizing

#### [Skins](/docs/guides/skins.md)

You can change the look of the player across playback technologies just by editing a CSS file. The skins documentation gives you a intro to how the HTML and CSS of the default skin is put together. For a list of skins you can check the [Video.js wiki][skins-list].

#### [Plugins](/docs/guides/plugins.md)

You can package up interesting Video.js customizations and reuse them elsewhere. Find out how to build your own plugin or [use one created by someone else][plugins-list].

#### [Components](/docs/guides/components.md)

Video.js is built around a collection of components. These are the building blocks of the player UI.

#### [Tech](/docs/guides/tech.md)

A "tech" is the shorthand we're using to describe any video playback technology - be it HTML5 video or a YouTube player. Basically anything that has a unique API to audio or video. Additional playback technologies can be added relatively easily.

#### [Languages](/docs/guides/languages.md)

Video.js has multi-language support! Follow this guide to see how you can contribute to and use languages.

#### [Hooks](/docs/guides/hooks.md)

A "hook" is functionality that wants to do when videojs creates a player. Right now only `beforesetup` and `setup` are supported. See the guide for more information on that.

#### [Debugging](/docs/guides/debugging.md)

Follow this guide to see how you can use `videojs.log` for debugging purposes.

## [API Docs][api]

You can refer to the [full list of API docs][api], but the most relevant API doc is for the [Player][api-player].

[plugins-list]: https://videojs.com/plugins

[skins-list]: https://github.com/videojs/video.js/wiki/Skins

[api]: https://docs.videojs.com/

[api-player]: https://docs.videojs.com/Player.html

[vjs-website]: https://videojs.com
