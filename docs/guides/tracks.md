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
Timed text requires a text file in [WebVTT](http://dev.w3.org/html5/webvtt/) format. This format defines a list of "cues" that have a start time, and end time, and text to display. [Microsoft has a builder](http://ie.microsoft.com/testdrive/Graphics/CaptionMaker/) that can help you get started on the file.

When creating captions, there's also additional [caption formatting techniques] (http://www.theneitherworld.com/mcpoodle/SCC_TOOLS/DOCS/SCC_FORMAT.HTML#style) that would be good to use, like brackets around sound effects: [ sound effect ]. If you'd like a more in depth style guide for captioning, you can reference the [Captioning Key](http://www.dcmp.org/captioningkey/), but keep in mind not all features are supported by WebVTT or (more likely) the Video.js WebVTT implementation.

Adding to Video.js
------------------
Once you have your WebVTT file created, you can add it to Video.js using the track trag. Put your track track tag after all the source elements, and before any fallback content.

```html
<video id="example_video_1" class="video-js vjs-default-skin"  
  controls preload="auto" width="640" height="264"  
  data-setup='{"example_option":true}'>  
 <source src="http://video-js.zencoder.com/oceans-clip.mp4" type='video/mp4' />  
 <source src="http://video-js.zencoder.com/oceans-clip.webm" type='video/webm' />  
 <source src="http://video-js.zencoder.com/oceans-clip.ogv" type='video/ogg' />  

 <track kind="captions" src="http://example.com/path/to/captions.vtt" srclang="en" label="English" default>

</video>
```

Track Attributes
----------------
Additional settings for track tags.

### kind
One of the five track types listed above. Kind defaults to subtitles if no kind is included.

### label
The label for the track that will be show to the user, for example in a menu that list the different languages available for subtitles.

### default
The default attribute can be used to have a track default to showing. Otherwise the viewer would need to select their language from the captions or subtitles menu.
NOTE: For chapters, default is required if you want the chapters menu to show.

### srclang
The two-letter code (valid BCP 47 language tag) for the language of the text track, for example "en" for English. Here's a list of available language codes.

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
