Languages
=========

Multiple language support allows for users of non-English locales to natively interact with the displayed player. Video.js will compile multiple language files (see below) and instantiate with a global dictionary of language key/value support. Video.js player instances can be created with per-player language support that amends/overrides these default values. Player instances can also hard-set default languages to values other than English as of version 4.7.

Creating the Language File
--------------------------
Video.js uses key/value object dictionaries in JSON form.

An English lang file is at [/lang/en.json](https://github.com/videojs/video.js/tree/master/lang/en.json) which should be used as a template for new files. This will be kept up to date with strings in the core player that need localizations.

A sample dictionary for Spanish `['es']` would look as follows:

```JSON
{
  "Play": "Reproducción",
  "Pause": "Pausa",
  "Current Time": "Tiempo reproducido",
  "Duration Time": "Duración total",
  "Remaining Time": "Tiempo restante",
  "Stream Type": "Tipo de secuencia",
  "LIVE": "DIRECTO",
  "Loaded": "Cargado",
  "Progress": "Progreso",
  "Fullscreen": "Pantalla completa",
  "Non-Fullscreen": "Pantalla no completa",
  "Mute": "Silenciar",
  "Unmute": "No silenciado",
  "Playback Rate": "Velocidad de reproducción",
  "Subtitles": "Subtítulos",
  "subtitles off": "Subtítulos desactivados",
  "Captions": "Subtítulos especiales",
  "captions off": "Subtítulos especiales desactivados",
  "Chapters": "Capítulos",
  "Close Modal Dialog": "Cerca de diálogo modal",
  "You aborted the video playback": "Ha interrumpido la reproducción del vídeo.",
  "A network error caused the video download to fail part-way.": "Un error de red ha interrumpido la descarga del vídeo.",
  "The video could not be loaded, either because the server or network failed or because the format is not supported.": "No se ha podido cargar el vídeo debido a un fallo de red o del servidor o porque el formato es incompatible.",
  "The video playback was aborted due to a corruption problem or because the video used features your browser did not support.": "La reproducción de vídeo se ha interrumpido por un problema de corrupción de datos o porque el vídeo precisa funciones que su navegador no ofrece.",
  "No compatible source was found for this video.": "No se ha encontrado ninguna fuente compatible con este vídeo."
}
```

Notes:

- The file name should always be in the format `XX.json`, where `XX` is the language code. This should be a two letter code (for options see the bottom of this document) except for cases where a more specific code with sub-code is appropriate, e.g. `zh-CN.lang`.
- For automatic inclusion at build time, add your language file to the `/lang` directory (see 'Adding Languages to Video.js below').

Adding Languages to Video.js
----------------------------
Additional language support can be added to Video.js in multiple ways.

1. Create language scripts out of your JSON objects by using our custom grunt task `vjslanguages`. This task is automatically run as part of the default grunt task in Video.JS, but can be configured to match your `src`/`dist` directories if different. Once these scripts are created, just add them to your DOM like any other script.

NOTE: These need to be added after the core Video.js script.


2. Add your JSON objects via the videojs.addLanguage API. Preferably in the HEAD element of your DOM or otherwise prior to player instantiation.

```html
<head>
<script>
  videojs.options.flash.swf = '../node_modules/videojs-swf/dist/video-js.swf';
  videojs.addLanguage('es', {
    "Play": "Reproducción",
    "Pause": "Pausa",
    "Current Time": "Tiempo reproducido",
    "Duration Time": "Duración total",
    "Remaining Time": "Tiempo restante",
    "Stream Type": "Tipo de secuencia",
    "LIVE": "DIRECTO",
    "Loaded": "Cargado",
    "Progress": "Progreso",
    "Fullscreen": "Pantalla completa",
    "Non-Fullscreen": "Pantalla no completa",
    "Mute": "Silenciar",
    "Unmute": "No silenciado",
    "Playback Rate": "Velocidad de reproducción",
    "Subtitles": "Subtítulos",
    "subtitles off": "Subtítulos desactivados",
    "Captions": "Subtítulos especiales",
    "captions off": "Subtítulos especiales desactivados",
    "Chapters": "Capítulos",
    "Close Modal Dialog": "Cerca de diálogo modal",
    "You aborted the video playback": "Ha interrumpido la reproducción del vídeo.",
    "A network error caused the video download to fail part-way.": "Un error de red ha interrumpido la descarga del vídeo.",
    "The video could not be loaded, either because the server or network failed or because the format is not supported.": "No se ha podido cargar el vídeo debido a un fallo de red o del servidor o porque el formato es incompatible.",
    "The video playback was aborted due to a corruption problem or because the video used features your browser did not support.": "La reproducción de vídeo se ha interrumpido por un problema de corrupción de datos o porque el vídeo precisa funciones que su navegador no ofrece.",
    "No compatible source was found for this video.": "No se ha encontrado ninguna fuente compatible con este vídeo."
});
</script>
</head>
```

3. During a Video.js player instantiation. Adding the languages to the configuration object provided in the `data-setup` attribute.

```html
<video id="example_video_1" class="video-js vjs-default-skin"
  controls preload="auto" width="640" height="264"
  data-setup='{"languages":{"es":{"Play":"Juego"}}}'>
 <source src="http://video-js.zencoder.com/oceans-clip.mp4" type='video/mp4' />
 <source src="http://video-js.zencoder.com/oceans-clip.webm" type='video/webm' />
 <source src="http://video-js.zencoder.com/oceans-clip.ogv" type='video/ogg' />

 <track kind="captions" src="http://example.com/path/to/captions.vtt" srclang="en" label="English" default>

</video>
```

Notes:
- This will add your language key/values to the Video.js player instances individually. If these values already exist in the global dictionary via the process above, those will be overridden for the player instance in question.

Updating default translations
-----------------------------

A list of the current translations and any strings that need translation are at [docs/translations-needed.md](../translations-needed.md). After updating the language files in /lang/ running `grunt check-languages` will update that list.

Setting Default Language in a Video.js Player
---------------------------------------------
During a Video.js player instantiation you can force it to localize to a specific language by including the locale value into the configuration object via the `data-setup` attribute. Valid options listed at the bottom of the page for reference.

```html
<video id="example_video_1" class="video-js vjs-default-skin"
  controls preload="auto" width="640" height="264"
  data-setup='{"language":"es"}'>
 <source src="http://video-js.zencoder.com/oceans-clip.mp4" type='video/mp4' />
 <source src="http://video-js.zencoder.com/oceans-clip.webm" type='video/webm' />
 <source src="http://video-js.zencoder.com/oceans-clip.ogv" type='video/ogg' />

 <track kind="captions" src="http://example.com/path/to/captions.vtt" srclang="en" label="English" default>

</video>
```

Determining Player Language
---------------------------

The player language is set to one of the following in descending priority:

* The language specified in setup options as above
* The language specified by the closet element with a `lang` attribute. This could be the player itself or a parent element. Usually the document language is specified on the `html` tag.
* Browser language preference (the first language if more than one is configured)
* 'en'

The player language can be change after instantiation with `language('fr')`. However localizable text will not be modified by doing this, for best results set the language beforehand.

Language selection
------------------

* Language codes are considered case-insensitively (`en-US` == `en-us`).
* If there is no match for a language code with a subcode (`en-us`), a match for the primary code (`en`) is used if available.

Localization in Plugins
-----------------------

When you're developing a plugin, you can also introduce new localized strings. Simply wrap the string with the player's `localize` function:

```js
var details = '<div class="vjs-errors-details">' + player.localize('Technical details') + '</div>';
```

Language Codes
--------------
A list of languages codes can be found [here](http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)

For supported language translations, please see the [Languages Folder (/lang)](https://github.com/videojs/video.js/tree/master/lang) folder located in the project root.

