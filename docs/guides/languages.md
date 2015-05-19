Languages
=========

Multiple language support allows for users of non-English locales to natively interact with the displayed player. Video.js will compile multiple language files (see below) and instantiate with a global dictionary of language key/value support. Video.js player instances can be created with per-player language support that amends/overrides these default values. Player instances can also hard-set default languages to values other than English as of version 4.7.

Creating the Language File
--------------------------
Video.js uses key/value object dictionaries in JSON form. A sample dictionary for Spanish `['es']` would look as follows;

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
  "Unmuted": "No silenciado",
  "Playback Rate": "Velocidad de reproducción",
  "Subtitles": "Subtítulos",
  "subtitles off": "Subtítulos desactivados",
  "Captions": "Subtítulos especiales",
  "captions off": "Subtítulos especiales desactivados",
  "Chapters": "Capítulos",
  "You aborted the video playback": "Ha interrumpido la reproducción del vídeo.",
  "A network error caused the video download to fail part-way.": "Un error de red ha interrumpido la descarga del vídeo.",
  "The video could not be loaded, either because the server or network failed or because the format is not supported.": "No se ha podido cargar el vídeo debido a un fallo de red o del servidor o porque el formato es incompatible.",
  "The video playback was aborted due to a corruption problem or because the video used features your browser did not support.": "La reproducción de vídeo se ha interrumpido por un problema de corrupción de datos o porque el vídeo precisa funciones que su navegador no ofrece.",
  "No compatible source was found for this video.": "No se ha encontrado ninguna fuente compatible con este vídeo."
}
```

Notes:

- The file name should always be in the format `XX.json`, where `XX` is the two letter value of the language reported to the browser (for options see the bottom of this document).
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
    "Unmuted": "No silenciado",
    "Playback Rate": "Velocidad de reproducción",
    "Subtitles": "Subtítulos",
    "subtitles off": "Subtítulos desactivados",
    "Captions": "Subtítulos especiales",
    "captions off": "Subtítulos especiales desactivados",
    "Chapters": "Capítulos",
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

The player language is set to one of the following in descending priority

* The language set in setup options as above
* The document language (`lang` attribute of the `html` element)
* Browser language preference
* 'en'

That can be overridden after instantiation with `language('fr')`.

Language selection
------------------

* Language codes are considered case-insensitively (`en-US` == `en-us`).
* If there is no match for a language code with a subcode (`en-us`), a match for the primary code (`en`) is used if available.

Localization in Plugins
-----------------------

When you're developing a plugin, you can also introduce new localized strings. Simply wrap the string with the player's `localize` function:

```javascript
var details = '<div class="vjs-errors-details">' + player.localize('Technical details') + '</div>';
```

Language Codes
--------------
The following is a list of official language codes.

**NOTE:** For supported language translations, please see the [Languages Folder (/lang)](../../lang) folder located in the project root.

<table border="0" cellspacing="5" cellpadding="5">
  <tr>
    <td>

      <table>
        <tr><th>ab<th><td>Abkhazian</td></tr>
        <tr><th>aa<th><td>Afar</td></tr>
        <tr><th>af<th><td>Afrikaans</td></tr>
        <tr><th>sq<th><td>Albanian</td></tr>
        <tr><th>am<th><td>Amharic</td></tr>
        <tr><th>ar<th><td>Arabic</td></tr>
        <tr><th>an<th><td>Aragonese</td></tr>
        <tr><th>hy<th><td>Armenian</td></tr>
        <tr><th>as<th><td>Assamese</td></tr>
        <tr><th>ay<th><td>Aymara</td></tr>
        <tr><th>az<th><td>Azerbaijani</td></tr>
        <tr><th>ba<th><td>Bashkir</td></tr>
        <tr><th>eu<th><td>Basque</td></tr>
        <tr><th>bn<th><td>Bengali (Bangla)</td></tr>
        <tr><th>dz<th><td>Bhutani</td></tr>
        <tr><th>bh<th><td>Bihari</td></tr>
        <tr><th>bi<th><td>Bislama</td></tr>
        <tr><th>br<th><td>Breton</td></tr>
        <tr><th>bg<th><td>Bulgarian</td></tr>
        <tr><th>my<th><td>Burmese</td></tr>
        <tr><th>be<th><td>Byelorussian (Belarusian)</td></tr>
        <tr><th>km<th><td>Cambodian</td></tr>
        <tr><th>ca<th><td>Catalan</td></tr>
        <tr><th>zh<th><td>Chinese (Simplified)</td></tr>
        <tr><th>zh<th><td>Chinese (Traditional)</td></tr>
        <tr><th>co<th><td>Corsican</td></tr>
        <tr><th>hr<th><td>Croatian</td></tr>
        <tr><th>cs<th><td>Czech</td></tr>
        <tr><th>da<th><td>Danish</td></tr>
        <tr><th>nl<th><td>Dutch</td></tr>
        <tr><th>en<th><td>English</td></tr>
        <tr><th>eo<th><td>Esperanto</td></tr>
        <tr><th>et<th><td>Estonian</td></tr>
        <tr><th>fo<th><td>Faeroese</td></tr>
        <tr><th>fa<th><td>Farsi</td></tr>
        <tr><th>fj<th><td>Fiji</td></tr>
        <tr><th>fi<th><td>Finnish</td></tr>
      </table>

    </td>
    <td>

      <table>
        <tr><th>fr<th><td>French</td></tr>
        <tr><th>fy<th><td>Frisian</td></tr>
        <tr><th>gl<th><td>Galician</td></tr>
        <tr><th>gd<th><td>Gaelic (Scottish)</td></tr>
        <tr><th>gv<th><td>Gaelic (Manx)</td></tr>
        <tr><th>ka<th><td>Georgian</td></tr>
        <tr><th>de<th><td>German</td></tr>
        <tr><th>el<th><td>Greek</td></tr>
        <tr><th>kl<th><td>Greenlandic</td></tr>
        <tr><th>gn<th><td>Guarani</td></tr>
        <tr><th>gu<th><td>Gujarati</td></tr>
        <tr><th>ht<th><td>Haitian Creole</td></tr>
        <tr><th>ha<th><td>Hausa</td></tr>
        <tr><th>he<th><td>Hebrew</td></tr>
        <tr><th>hi<th><td>Hindi</td></tr>
        <tr><th>hu<th><td>Hungarian</td></tr>
        <tr><th>is<th><td>Icelandic</td></tr>
        <tr><th>io<th><td>Ido</td></tr>
        <tr><th>id<th><td>Indonesian</td></tr>
        <tr><th>ia<th><td>Interlingua</td></tr>
        <tr><th>ie<th><td>Interlingue</td></tr>
        <tr><th>iu<th><td>Inuktitut</td></tr>
        <tr><th>ik<th><td>Inupiak</td></tr>
        <tr><th>ga<th><td>Irish</td></tr>
        <tr><th>it<th><td>Italian</td></tr>
        <tr><th>ja<th><td>Japanese</td></tr>
        <tr><th>jv<th><td>Javanese</td></tr>
        <tr><th>kn<th><td>Kannada</td></tr>
        <tr><th>ks<th><td>Kashmiri</td></tr>
        <tr><th>kk<th><td>Kazakh</td></tr>
        <tr><th>rw<th><td>Kinyarwanda (Ruanda)</td></tr>
        <tr><th>ky<th><td>Kirghiz</td></tr>
        <tr><th>rn<th><td>Kirundi (Rundi)</td></tr>
        <tr><th>ko<th><td>Korean</td></tr>
        <tr><th>ku<th><td>Kurdish</td></tr>
        <tr><th>lo<th><td>Laothian</td></tr>
        <tr><th>la<th><td>Latin</td></tr>
      </table>

    </td>
    <td>

      <table>
        <tr><th>lv<th><td>Latvian (Lettish)</td></tr>
        <tr><th>li<th><td>Limburgish ( Limburger)</td></tr>
        <tr><th>ln<th><td>Lingala</td></tr>
        <tr><th>lt<th><td>Lithuanian</td></tr>
        <tr><th>mk<th><td>Macedonian</td></tr>
        <tr><th>mg<th><td>Malagasy</td></tr>
        <tr><th>ms<th><td>Malay</td></tr>
        <tr><th>ml<th><td>Malayalam</td></tr>
        <tr><th>mt<th><td>Maltese</td></tr>
        <tr><th>mi<th><td>Maori</td></tr>
        <tr><th>mr<th><td>Marathi</td></tr>
        <tr><th>mo<th><td>Moldavian</td></tr>
        <tr><th>mn<th><td>Mongolian</td></tr>
        <tr><th>na<th><td>Nauru</td></tr>
        <tr><th>ne<th><td>Nepali</td></tr>
        <tr><th>no<th><td>Norwegian</td></tr>
        <tr><th>oc<th><td>Occitan</td></tr>
        <tr><th>or<th><td>Oriya</td></tr>
        <tr><th>om<th><td>Oromo (Afan, Galla)</td></tr>
        <tr><th>ps<th><td>Pashto (Pushto)</td></tr>
        <tr><th>pl<th><td>Polish</td></tr>
        <tr><th>pt<th><td>Portuguese</td></tr>
        <tr><th>pa<th><td>Punjabi</td></tr>
        <tr><th>qu<th><td>Quechua</td></tr>
        <tr><th>rm<th><td>Rhaeto-Romance</td></tr>
        <tr><th>ro<th><td>Romanian</td></tr>
        <tr><th>ru<th><td>Russian</td></tr>
        <tr><th>sm<th><td>Samoan</td></tr>
        <tr><th>sg<th><td>Sangro</td></tr>
        <tr><th>sa<th><td>Sanskrit</td></tr>
        <tr><th>sr<th><td>Serbian</td></tr>
        <tr><th>sh<th><td>Serbo-Croatian</td></tr>
        <tr><th>st<th><td>Sesotho</td></tr>
        <tr><th>tn<th><td>Setswana</td></tr>
        <tr><th>sn<th><td>Shona</td></tr>
        <tr><th>ii<th><td>Sichuan Yi</td></tr>
        <tr><th>sd<th><td>Sindhi</td></tr>
      </table>

    </td>
    <td>

      <table>
        <tr><th>si<th><td>Sinhalese</td></tr>
        <tr><th>ss<th><td>Siswati</td></tr>
        <tr><th>sk<th><td>Slovak</td></tr>
        <tr><th>sl<th><td>Slovenian</td></tr>
        <tr><th>so<th><td>Somali</td></tr>
        <tr><th>es<th><td>Spanish</td></tr>
        <tr><th>su<th><td>Sundanese</td></tr>
        <tr><th>sw<th><td>Swahili (Kiswahili)</td></tr>
        <tr><th>sv<th><td>Swedish</td></tr>
        <tr><th>tl<th><td>Tagalog</td></tr>
        <tr><th>tg<th><td>Tajik</td></tr>
        <tr><th>ta<th><td>Tamil</td></tr>
        <tr><th>tt<th><td>Tatar</td></tr>
        <tr><th>te<th><td>Telugu</td></tr>
        <tr><th>th<th><td>Thai</td></tr>
        <tr><th>bo<th><td>Tibetan</td></tr>
        <tr><th>ti<th><td>Tigrinya</td></tr>
        <tr><th>to<th><td>Tonga</td></tr>
        <tr><th>ts<th><td>Tsonga</td></tr>
        <tr><th>tr<th><td>Turkish</td></tr>
        <tr><th>tk<th><td>Turkmen</td></tr>
        <tr><th>tw<th><td>Twi</td></tr>
        <tr><th>ug<th><td>Uighur</td></tr>
        <tr><th>uk<th><td>Ukrainian</td></tr>
        <tr><th>ur<th><td>Urdu</td></tr>
        <tr><th>uz<th><td>Uzbek</td></tr>
        <tr><th>vi<th><td>Vietnamese</td></tr>
        <tr><th>vo<th><td>Volapük</td></tr>
        <tr><th>wa<th><td>Wallon</td></tr>
        <tr><th>cy<th><td>Welsh</td></tr>
        <tr><th>wo<th><td>Wolof</td></tr>
        <tr><th>xh<th><td>Xhosa</td></tr>
        <tr><th>yi<th><td>Yiddish</td></tr>
        <tr><th>yo<th><td>Yoruba</td></tr>
        <tr><th>zu<th><td>Zulu</td></tr>
      </table>

    </td>
  </tr>
</table>
