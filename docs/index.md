# [Video.js][vjs-website] Documentation

There are two categories of docs: [Guides](guides) and [API docs][api].

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
* [API Docs](#api-docs)

## Resolving Issues

### [FAQ](guides/faq.md)

The frequently asked questions for video.js.

### [Troubleshooting](guides/troubleshooting.md)

Troubleshooting help for video.js.

## [Guides](guides)

### Getting Started

#### [Setup](guides/setup.md)

The setup guide covers all methods of setting up Video.js players.

#### [Player Workflows](guides/player-workflows.md)

After mastering the basics of setup move over to this guide for some more advanced player workflows.

#### [Options](guides/options.md)

There are a number of options that can be used to change how the player behaves, starting with the HTML5 media options like autoplay and preload, and expanding to Video.js specific options.

#### [Tracks](guides/tracks.md)

Tracks are used for displaying text information over a video, selecting different audio tracks for a video, or selecting different video tracks.

### Customizing

#### [Skins](guides/skins.md)

You can change the look of the player across playback technologies just by editing a CSS file. The skins documentation gives you a intro to how the HTML and CSS of the default skin is put together. For a list of skins you can check the [video.js wiki][skins-list].

#### [Plugins](guides/plugins.md)

You can package up interesting Video.js customizations and reuse them elsewhere. Find out how to build your own plugin or [use one created by someone else][plugins-list].

#### [Components](guides/components.md)

Video.js is built around a collection of components. These are the building blocks of the player UI.

#### [Tech](guides/tech.md)

A "tech" is the shorthand we're using to describe any video playback technology - be it HTML5 video, Flash, . Basically anything that has a unique API to audio or video. Additional playback technologies can be added relatively easily.

#### [Languages](guides/languages.md)

Video.js has multi-language support! Follow this guide to see how you can contribute to and use languages.

#### [Hooks](guides/hooks.md)

A "hook" is functionality that wants to do when videojs creates a player. Right now only `beforesetup` and `setup` are supported. See the guide for more information on that.

## [API Docs][api]

You can refer to the [full list of API docs][api], but the most relevant API doc is for the [Player][api-player].

[plugins-list]: http://videojs.com/plugins

[skins-list]: https://github.com/videojs/video.js/wiki/Skins

[api]: http://docs.videojs.com/docs/api/index.html

[api-player]: http://docs.videojs.com/docs/api/player.html

[vjs-website]: http://videojs.com
