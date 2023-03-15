# Translations needed

The currently available translations are in the lang dir. This table shows the completeness of those translations. Anything not listed does not exist yet, so go ahead and create it by copying `en.json`.

If you add or update a translation run `npm run docs:lang` to update the list and include this modified doc in the pull request.

## Progress Bar Translations

The progress bar has a translation with a few token replacements.
They key is `progress bar timing: currentTime={1} duration={2}` and the default English value is `{1} of {2}`.
This default value is hardcoded as a default to the localize method in the SeekBar component.

## Status of translations

<!-- START langtable -->

| Language file           | Missing translations                                                                |
| ----------------------- | ----------------------------------------------------------------------------------- |
| ar.json (missing 2)     | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| ba.json (missing 70)    | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Replay                                                                              |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Descriptions                                                                        |
|                         | descriptions off                                                                    |
|                         | Audio Track                                                                         |
|                         | Volume Level                                                                        |
|                         | The media is encrypted and we do not have the keys to decrypt it.                   |
|                         | Play Video                                                                          |
|                         | Close                                                                               |
|                         | Close Modal Dialog                                                                  |
|                         | Modal Window                                                                        |
|                         | This is a modal window                                                              |
|                         | This modal can be closed by pressing the Escape key or activating the close button. |
|                         | , opens captions settings dialog                                                    |
|                         | , opens subtitles settings dialog                                                   |
|                         | , opens descriptions settings dialog                                                |
|                         | , selected                                                                          |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| bg.json (missing 70)    | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Replay                                                                              |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Descriptions                                                                        |
|                         | descriptions off                                                                    |
|                         | Audio Track                                                                         |
|                         | Volume Level                                                                        |
|                         | The media is encrypted and we do not have the keys to decrypt it.                   |
|                         | Play Video                                                                          |
|                         | Close                                                                               |
|                         | Close Modal Dialog                                                                  |
|                         | Modal Window                                                                        |
|                         | This is a modal window                                                              |
|                         | This modal can be closed by pressing the Escape key or activating the close button. |
|                         | , opens captions settings dialog                                                    |
|                         | , opens subtitles settings dialog                                                   |
|                         | , opens descriptions settings dialog                                                |
|                         | , selected                                                                          |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| bn.json (missing 7)     | Exit Fullscreen                                                                     |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| ca.json (missing 70)    | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Replay                                                                              |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Descriptions                                                                        |
|                         | descriptions off                                                                    |
|                         | Audio Track                                                                         |
|                         | Volume Level                                                                        |
|                         | The media is encrypted and we do not have the keys to decrypt it.                   |
|                         | Play Video                                                                          |
|                         | Close                                                                               |
|                         | Close Modal Dialog                                                                  |
|                         | Modal Window                                                                        |
|                         | This is a modal window                                                              |
|                         | This modal can be closed by pressing the Escape key or activating the close button. |
|                         | , opens captions settings dialog                                                    |
|                         | , opens subtitles settings dialog                                                   |
|                         | , opens descriptions settings dialog                                                |
|                         | , selected                                                                          |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| cs.json (missing 11)    | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| cy.json (missing 11)    | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| da.json (missing 70)    | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Replay                                                                              |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Descriptions                                                                        |
|                         | descriptions off                                                                    |
|                         | Audio Track                                                                         |
|                         | Volume Level                                                                        |
|                         | The media is encrypted and we do not have the keys to decrypt it.                   |
|                         | Play Video                                                                          |
|                         | Close                                                                               |
|                         | Close Modal Dialog                                                                  |
|                         | Modal Window                                                                        |
|                         | This is a modal window                                                              |
|                         | This modal can be closed by pressing the Escape key or activating the close button. |
|                         | , opens captions settings dialog                                                    |
|                         | , opens subtitles settings dialog                                                   |
|                         | , opens descriptions settings dialog                                                |
|                         | , selected                                                                          |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| de.json (Complete)      |                                                                                     |
| el.json (missing 56)    | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Replay                                                                              |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Volume Level                                                                        |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| en-GB.json (has 1)      | Needs manual checking. Can safely use most default strings.                         |
| es.json (missing 2)     | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| et.json (missing 7)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| eu.json (missing 7)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| fa.json (missing 5)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
| fi.json (missing 70)    | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Replay                                                                              |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Descriptions                                                                        |
|                         | descriptions off                                                                    |
|                         | Audio Track                                                                         |
|                         | Volume Level                                                                        |
|                         | The media is encrypted and we do not have the keys to decrypt it.                   |
|                         | Play Video                                                                          |
|                         | Close                                                                               |
|                         | Close Modal Dialog                                                                  |
|                         | Modal Window                                                                        |
|                         | This is a modal window                                                              |
|                         | This modal can be closed by pressing the Escape key or activating the close button. |
|                         | , opens captions settings dialog                                                    |
|                         | , opens subtitles settings dialog                                                   |
|                         | , opens descriptions settings dialog                                                |
|                         | , selected                                                                          |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| fr.json (missing 2)     | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| gd.json (missing 9)     | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| gl.json (missing 9)     | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| he.json (missing 12)    | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| hi.json (missing 7)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| hr.json (missing 70)    | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Replay                                                                              |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Descriptions                                                                        |
|                         | descriptions off                                                                    |
|                         | Audio Track                                                                         |
|                         | Volume Level                                                                        |
|                         | The media is encrypted and we do not have the keys to decrypt it.                   |
|                         | Play Video                                                                          |
|                         | Close                                                                               |
|                         | Close Modal Dialog                                                                  |
|                         | Modal Window                                                                        |
|                         | This is a modal window                                                              |
|                         | This modal can be closed by pressing the Escape key or activating the close button. |
|                         | , opens captions settings dialog                                                    |
|                         | , opens subtitles settings dialog                                                   |
|                         | , opens descriptions settings dialog                                                |
|                         | , selected                                                                          |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| hu.json (missing 7)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| it.json (missing 7)     | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | No content                                                                          |
| ja.json (Complete)      |                                                                                     |
| ko.json (missing 2)     | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| lv.json (missing 5)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
| nb.json (missing 9)     | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| nl.json (missing 10)    | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
| nn.json (missing 9)     | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| oc.json (missing 6)     | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| pl.json (missing 6)     | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| pt-BR.json (missing 9)  | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| pt-PT.json (missing 55) | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Volume Level                                                                        |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| ro.json (missing 7)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| ru.json (missing 5)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
| sk.json (missing 11)    | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| sl.json (missing 13)    | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| sr.json (missing 70)    | Audio Player                                                                        |
|                         | Video Player                                                                        |
|                         | Replay                                                                              |
|                         | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Progress Bar                                                                        |
|                         | progress bar timing: currentTime={1} duration={2}                                   |
|                         | Descriptions                                                                        |
|                         | descriptions off                                                                    |
|                         | Audio Track                                                                         |
|                         | Volume Level                                                                        |
|                         | The media is encrypted and we do not have the keys to decrypt it.                   |
|                         | Play Video                                                                          |
|                         | Close                                                                               |
|                         | Close Modal Dialog                                                                  |
|                         | Modal Window                                                                        |
|                         | This is a modal window                                                              |
|                         | This modal can be closed by pressing the Escape key or activating the close button. |
|                         | , opens captions settings dialog                                                    |
|                         | , opens subtitles settings dialog                                                   |
|                         | , opens descriptions settings dialog                                                |
|                         | , selected                                                                          |
|                         | captions settings                                                                   |
|                         | subtitles settings                                                                  |
|                         | descriptions settings                                                               |
|                         | Text                                                                                |
|                         | White                                                                               |
|                         | Black                                                                               |
|                         | Red                                                                                 |
|                         | Green                                                                               |
|                         | Blue                                                                                |
|                         | Yellow                                                                              |
|                         | Magenta                                                                             |
|                         | Cyan                                                                                |
|                         | Background                                                                          |
|                         | Window                                                                              |
|                         | Transparent                                                                         |
|                         | Semi-Transparent                                                                    |
|                         | Opaque                                                                              |
|                         | Font Size                                                                           |
|                         | Text Edge Style                                                                     |
|                         | None                                                                                |
|                         | Raised                                                                              |
|                         | Depressed                                                                           |
|                         | Uniform                                                                             |
|                         | Dropshadow                                                                          |
|                         | Font Family                                                                         |
|                         | Proportional Sans-Serif                                                             |
|                         | Monospace Sans-Serif                                                                |
|                         | Proportional Serif                                                                  |
|                         | Monospace Serif                                                                     |
|                         | Casual                                                                              |
|                         | Script                                                                              |
|                         | Small Caps                                                                          |
|                         | Reset                                                                               |
|                         | restore all settings to the default values                                          |
|                         | Done                                                                                |
|                         | Caption Settings Dialog                                                             |
|                         | Beginning of dialog window. Escape will cancel and close the window.                |
|                         | End of dialog window.                                                               |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| sv.json (missing 9)     | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| te.json (missing 7)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| th.json (missing 7)     | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| tr.json (missing 6)     | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| uk.json (missing 11)    | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| vi.json (missing 12)    | Seek to live, currently behind live                                                 |
|                         | Seek to live, currently playing live                                                |
|                         | {1} is loading.                                                                     |
|                         | Exit Picture-in-Picture                                                             |
|                         | Picture-in-Picture                                                                  |
|                         | No content                                                                          |
|                         | Color                                                                               |
|                         | Opacity                                                                             |
|                         | Text Background                                                                     |
|                         | Caption Area Background                                                             |
|                         | Skip backward {1} seconds                                                           |
|                         | Skip forward {1} seconds                                                            |
| zh-CN.json (Complete)   |                                                                                     |
| zh-TW.json (Complete)   |                                                                                     |

<!-- END langtable -->
