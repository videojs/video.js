[![Video.js logo][logo]][vjs]

# Video.js - Web Video Player & Framework

[![NPM][npm-icon]][npm-link]

**Update:** Big changes coming in Video.js 10, early 2026! [Read the discussion.](https://github.com/videojs/video.js/discussions/9035)

Video.js is a full featured, open source video player for all web-based platforms.

Right out of the box, Video.js supports all common media formats used on the web including streaming formats like HLS and DASH. It works on desktops, mobile devices, tablets, and web-based Smart TVs. It can be further extended and customized by a robust ecosystem of [plugins][plugins].

Video.js was started in May 2010 and since then:

* Millions of websites have used VideoJS over time (source [Builtwith][builtwith])
* Billions of end-users every month of just the CDN-hosted copy (source Fastly stats)
* 900+ amazing contributors to the video.js core
* Hundreds of [plugins](https://videojs.com/plugins/)

## Table of Contents

* [Quick Start](#quick-start)
* [Contributing](#contributing)
* [Code of Conduct](#code-of-conduct)
* [License](#license)
* [Sponsorship](#sponsorship)

## [Quick Start][getting-started]

Thanks to the awesome folks over at [Fastly][fastly], there's a free, CDN hosted version of Video.js that anyone can use. Add these tags to your document's `<head>`:

```html
<link href="//vjs.zencdn.net/8.23.6/video-js.min.css" rel="stylesheet">
<script src="//vjs.zencdn.net/8.23.6/video.min.js"></script>
```

Alternatively, you can include Video.js by getting it from [npm](https://videojs.com/getting-started/#install-via-npm), downloading it from [GitHub releases](https://github.com/videojs/video.js/releases) or by including it via [unpkg](https://unpkg.com) or another JavaScript CDN, like CDNjs.

```html
<!-- unpkg : use the latest version of Video.js -->
<link href="https://unpkg.com/video.js/dist/video-js.min.css" rel="stylesheet">
<script src="https://unpkg.com/video.js/dist/video.min.js"></script>

<!-- unpkg : use a specific version of Video.js (change the version numbers as necessary) -->
<link href="https://unpkg.com/video.js@8.24.0/dist/video-js.min.css" rel="stylesheet">
<script src="https://unpkg.com/video.js@8.24.0/dist/video.min.js"></script>

<!-- cdnjs : use a specific version of Video.js (change the version numbers as necessary) -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/video.js/8.24.0/video-js.min.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/video.js/8.24.0/video.min.js"></script>
```

Next, using Video.js is as simple as creating a `<video>` element, but with an additional `data-setup` attribute. At a minimum, this attribute must have a value of `'{}'`, but it can include any Video.js [options][options] - just make sure it contains valid JSON!

```html
<video
    id="my-player"
    class="video-js"
    controls
    preload="auto"
    poster="//vjs.zencdn.net/v/oceans.png"
    data-setup='{}'>
  <source src="//vjs.zencdn.net/v/oceans.mp4" type="video/mp4"></source>
  <source src="//vjs.zencdn.net/v/oceans.webm" type="video/webm"></source>
  <source src="//vjs.zencdn.net/v/oceans.ogv" type="video/ogg"></source>
  <p class="vjs-no-js">
    To view this video please enable JavaScript, and consider upgrading to a
    web browser that
    <a href="https://videojs.com/html5-video-support/" target="_blank">
      supports HTML5 video
    </a>
  </p>
</video>
```

When the page loads, Video.js will find this element and automatically setup a player in its place.

If you don't want to use automatic setup, you can leave off the `data-setup` attribute and initialize a `<video>` element manually using the `videojs` function:

```js
var player = videojs('my-player');
```

The `videojs` function also accepts an `options` object and a callback to be invoked when the player is ready:

```js
var options = {};

var player = videojs('my-player', options, function onPlayerReady() {
  videojs.log('Your player is ready!');

  // In this context, `this` is the player that was created by Video.js.
  this.play();

  // How about an event listener?
  this.on('ended', function() {
    videojs.log('Awww...over so soon?!');
  });
});
```

If you're ready to dive in, the [Getting Started][getting-started] page and [documentation][docs] are the best places to go for more information. If you get stuck, head over to our [Slack][slack-link]!

## [Contributing][contributing]

Video.js is a free and open source library, and we appreciate any help you're willing to give - whether it's fixing bugs, improving documentation, or suggesting new features. Check out the [contributing guide][contributing] for more! Contributions and project decisions are overseen by the
[Video.js Technical Steering Committee (TSC)](https://github.com/videojs/admin/blob/main/GOVERNANCE.md).

By submitting a pull request, you agree that your contribution is provided under the
[Apache 2.0 License](LICENSE) and may be included in future releases. No contributor license agreement (CLA) has ever been required for contributions to Video.js. See the [Developer's Certificate of Origin 1.1
](https://github.com/videojs/admin/blob/main/CONTRIBUTING.md#developers-certificate-of-origin-11).

## [Code of Conduct][coc]

Please note that this project is released with a [Contributor Code of Conduct][coc]. By participating in this project you agree to abide by its terms.

## [License][license]

Video.js is [licensed][license] under the Apache License, Version 2.0. "Video.js" is a registered trademark of [Brightcove, Inc][bc].

## Sponsorship

Project development is sponsored by the role of [Corporate Shepherd](https://github.com/videojs/admin/blob/main/GOVERNANCE.md#corporate-shepherd), held by various companies throughout the project history:

* 2010-2012: Zencoder Inc.
* 2013-2025: [Brightcove Inc.][bc]
* 2025-present: [Mux Inc.][mux]

Video.js uses [BrowserStack][browserstack] for compatibility testing.

The free CDN-hosted copy of the libray is sponsored by [Fastly][fastly].

Website hosting is sponsored by [Netlify][netlify]

[bc]: https://www.brightcove.com/

[browserstack]: https://browserstack.com

[builtwith]: https://trends.builtwith.com/media/VideoJS

[contributing]: https://github.com/videojs/admin/blob/main/CONTRIBUTING.md

[docs]: https://docs.videojs.com

[fastly]: https://www.fastly.com/

[getting-started]: https://videojs.com/getting-started/

[license]: LICENSE

[logo]: https://videojs.com/logo-white.png

[mux]: https://www.mux.com/

[netlify]: https://www.netlify.com

[npm-icon]: https://nodei.co/npm/video.js.png?downloads=true&downloadRank=true

[npm-link]: https://nodei.co/npm/video.js/

[options]: https://videojs.com/guides/options/

[plugins]: https://videojs.com/plugins/

[slack-link]: https://slack.videojs.com

[vjs]: https://videojs.com

[coc]: https://github.com/videojs/admin/blob/main/CODE_OF_CONDUCT.md


## 🌐 Web Resources & Interactive Index
- [CATEGORY MERGE GAME](https://learnquester.pages.dev/category-merge-game.html)
- [CATEGORY CASUAL](https://themindzone.pages.dev/category-casual.html)
- [SECRETS OF CHARMLAND](https://studyplaying.github.io/secrets-of-charmland.html)
- [BLOCK TNT BLAST](https://thequizzone.pages.dev/block-tnt-blast.html)
- [TREASURE HUNT PUZZLE](https://thequizzone.pages.dev/treasure-hunt-puzzle.html)
- [ROPE STITCH PUZZLE](https://quizverses-9d2f2.web.app/rope-stitch-puzzle.html)
- [KICK LUCKY BOXES ONLINE](https://thequizzone.pages.dev/kick-lucky-boxes-online.html)
- [ONET MONSTER BOOK](https://quizverses.pages.dev/onet-monster-book.html)
- [OBBY BLOX HOOK](https://quizverses.github.io/obby-blox-hook.html)
- [FASHIONISTA AVATAR STUDIO DRESS UP](https://themindplaying.web.app/fashionista-avatar-studio-dress-up.html)
- [ROBOTS GONE WILD](https://quizverses-9d2f2.web.app/robots-gone-wild.html)
- [GT DRIFT MOST WANTED](https://quizverses.github.io/gt-drift-most-wanted.html)
- [POGO MASTERS](https://quizverses-9d2f2.web.app/pogo-masters.html)
- [CATEGORY BIKE](https://quizverses.github.io/category-bike.html)
- [CAT EVOLUTION](https://quizverses.pages.dev/cat-evolution.html)
- [BOLT CLIMB TAP TO THE TOP](https://themindplay.pages.dev/bolt-climb-tap-to-the-top.html)
- [CHICKEN SHOOTER IO](https://quizverses.pages.dev/chicken-shooter-io.html)
- [VEX HYPER DASH](https://quizverses.github.io/vex-hyper-dash.html)
- [CATEGORY CLASSIC97](https://themindzone.pages.dev/category-classic97.html)
- [PUMPKIN PATCH](https://thequizzone.pages.dev/pumpkin-patch.html)
- [HEXA BLAST GAME PUZZLE](https://thequizzone.pages.dev/hexa-blast-game-puzzle.html)
- [BUS JAM ESCAPE](https://quizverses-9d2f2.web.app/bus-jam-escape.html)
- [SPIN THRU](https://themindplay.pages.dev/spin-thru.html)
- [CATEGORY CASUAL 8](https://themindplays.pages.dev/category-casual-8.html)
- [CATEGORY FPS174](https://quizverses.github.io/category-fps174.html)
- [CATEGORY HORROR 3](https://iskillquest.pages.dev/category-horror-3.html)
- [CATEGORY INCREMENTAL388](https://themindplays.pages.dev/category-incremental388.html)
- [MUSHROOM FEVER MATCH 3](https://quizverses-9d2f2.web.app/mushroom-fever-match-3.html)
- [CATEGORY CASUAL 6](https://iskillquest.pages.dev/category-casual-6.html)
- [LAST UFO DEFENSE](https://themindplay.pages.dev/last-ufo-defense.html)
- [LULU RUN](https://studyquests.github.io/lulu-run.html)
- [CATEGORY DRESS UP](https://studyquests.github.io/category-dress-up.html)
- [CATEGORY FOOTBALL](https://themindplays.pages.dev/category-football.html)
- [SAVE MY PET PARTY](https://themindplays.pages.dev/save-my-pet-party.html)
- [IDLE POP MERGE](https://quizverses.github.io/idle-pop-merge.html)
- [STEAL ITEMS IO](https://skillplay.github.io/steal-items-io.html)
- [CATEGORY ESCAPE 2](https://studyquests.github.io/category-escape-2.html)
- [MR LONG HAND](https://quizverses-9d2f2.web.app/mr-long-hand.html)
- [WILD WEST MATCH 2 THE GOLD RUSH](https://quizverses.pages.dev/wild-west-match-2-the-gold-rush.html)
- [VEX X3M 3](https://iskillquest.pages.dev/vex-x3m-3.html)
- [CATEGORY DEEP IMMERSIVE24](https://quizverses.github.io/category-deep-immersive24.html)
- [CUTE CATS ADVENTURES](https://themindplay.pages.dev/cute-cats-adventures.html)
- [DREAMS](https://iskillquest.pages.dev/dreams.html)
- [CATEGORY MOBILE2 112 2](https://iskillquest.pages.dev/category-mobile2-112-2.html)
- [CATEGORY FPS](https://studyquests.github.io/category-fps.html)
- [TOW N GO](https://themindplays.pages.dev/tow-n-go.html)
- [CUTE FOLDING PAPER](https://themindskillplayplay.pages.dev/cute-folding-paper.html)
- [LIGHT LINE](https://theskillquest.pages.dev/light-line.html)
- [CATEGORY BIKE63](https://quizverses.github.io/category-bike63.html)
- [BLACK PINK BLACK FRIDAY FEVER](https://quizverses.pages.dev/black-pink-black-friday-fever.html)
- [CATEGORY MOBILE2 097](https://studyquests.github.io/category-mobile2-097.html)
- [LABUBU MERGE](https://themindplay.pages.dev/labubu-merge.html)
- [WORMS ZONE](https://themindplay.pages.dev/worms-zone.html)
- [BLOCKS STACK RUSH](https://thequizzone.pages.dev/blocks-stack-rush.html)
- [CLEAN THE FLOOR](https://quizverses-9d2f2.web.app/clean-the-floor.html)
- [PUZZLE BLOCKS ASMR MATCH](https://themindplays.pages.dev/puzzle-blocks-asmr-match.html)
- [CATEGORY GUN238](https://quizverses.pages.dev/category-gun238.html)
- [CATEGORY MONSTER206](https://quizverses.github.io/category-monster206.html)
- [CATEGORY AVOID295](https://quizverses.pages.dev/category-avoid295.html)
- [CATEGORY MINECRAFT81](https://studyquests.github.io/category-minecraft81.html)
- [CAT ESCAPE](https://themindskillplayplay.pages.dev/cat-escape.html)
- [DINO SHOOTER PRO](https://quizverses.github.io/dino-shooter-pro.html)
- [SHEEP VS WOLF](https://thequizzone.pages.dev/sheep-vs-wolf.html)
- [STICKER BOOK PUZZLE COLOR BY NUMBER](https://quizverses.github.io/sticker-book-puzzle-color-by-number.html)
- [MAKE TWO](https://themindplays.pages.dev/make-two.html)
- [CATEGORY MERGE221](https://quizverses.github.io/category-merge221.html)
- [COOL ORANGE BALL BOUNCE ADVENTURE](https://themindskillplayplay.pages.dev/cool-orange-ball-bounce-adventure.html)
- [HAMSTER COMBO IDLE](https://quizverses.pages.dev/hamster-combo-idle.html)
- [CATEGORY MAHJONG CONNECT](https://quizverses-9d2f2.web.app/category-mahjong-connect.html)
- [PUMPKING VS MUMMY](https://themindplay.github.io/pumpking-vs-mummy.html)
- [CATEGORY BOOKMARK](https://themindplay.pages.dev/category-bookmark.html)
- [DESERT ROVER SURVIVAL](https://themindskillplayplay.pages.dev/desert-rover-survival.html)
- [CATEGORY SHOOTER 2](https://quizverses-9d2f2.web.app/category-shooter-2.html)
- [CATEGORY MAHJONG 3](https://themindskillplayplay.pages.dev/category-mahjong-3.html)
- [ANCIENT WARS CAESAR](https://themindzone.pages.dev/ancient-wars-caesar.html)
- [SPLIT SHOT BALL ADVENTURE](https://themindzone.pages.dev/split-shot-ball-adventure.html)
- [CATEGORY FREE](https://quizverses-9d2f2.web.app/category-free.html)
- [MOTO CABBIE SIMULATOR](https://quizverses.github.io/moto-cabbie-simulator.html)
- [BUILDING MODS FOR MINECRAFT](https://iskillquest.pages.dev/building-mods-for-minecraft.html)
- [AVATAR LIFE MY TOWN](https://quizverses.pages.dev/avatar-life-my-town.html)
- [NUMBER PLACE TRAVEL](https://themindplay.github.io/number-place-travel.html)
- [CANDY RAIN 5](https://quizverses.github.io/candy-rain-5.html)
- [JELLY TOWER CRUSH](https://themindplay.pages.dev/jelly-tower-crush.html)
- [CATEGORY BATTLE ROYALE](https://quizverses.github.io/category-battle-royale.html)
- [KNOCKOUT DUDES](https://quizverses.github.io/knockout-dudes.html)
- [CATEGORY BIKE](https://themindskillplayplay.pages.dev/category-bike.html)
- [ELLIE S RECIPE DUBAI CHOCOLATE BAR](https://themindplays.pages.dev/ellie-s-recipe-dubai-chocolate-bar.html)
- [SEA MATCH](https://themindskillplayplay.pages.dev/sea-match.html)
- [MINI OBBY WAR GAME](https://quizverses-9d2f2.web.app/mini-obby-war-game.html)
- [CATEGORY LISTS](https://iskillquest.pages.dev/category-lists.html)
- [SHAPE SHIFTING](https://quizverses.pages.dev/shape-shifting.html)
- [UNO ONLINE](https://themindplays.pages.dev/uno-online.html)
- [CATEGORY MINECRAFT 2](https://quizverses.github.io/category-minecraft-2.html)
- [CUT THE ROPE TIME TRAVEL](https://quizverses.github.io/cut-the-rope-time-travel.html)
- [CAPYBARA SCREW JAM](https://themindzone.pages.dev/capybara-screw-jam.html)
- [BROKEN CITY COMBAT](https://skillplay.github.io/broken-city-combat.html)
- [FIRE BALL AND WATER BALL PARKOUR LOVE BALLS](https://themindskillplayplay.pages.dev/fire-ball-and-water-ball-parkour-love-balls.html)
- [THE PRISM CITY DETECTIVES](https://quizverses.github.io/the-prism-city-detectives.html)
- [BLOCK TNT BLAST](https://themindplay.pages.dev/block-tnt-blast.html)
- [CATEGORY BASKETBALL 2](https://themindzone.pages.dev/category-basketball-2.html)
- [CATEGORY CASUAL 2](https://themindplay.pages.dev/category-casual-2.html)
- [CLEAN HOUSE CLEARING TRASH AND DIRT](https://themindplays.pages.dev/clean-house-clearing-trash-and-dirt.html)
- [COLOR WATER PUZZLE](https://themindplays.pages.dev/color-water-puzzle.html)
- [SHOP SORTING XMAS](https://theskillquest.pages.dev/shop-sorting-xmas.html)
- [INDEX10](https://themindplay.github.io/index10.html)
- [CATEGORY CASUAL971](https://quizverses-9d2f2.web.app/category-casual971.html)
- [K POP HUNTER FASHION](https://quizverses.github.io/k-pop-hunter-fashion.html)
- [CHESSFIELD](https://iskillquest.pages.dev/chessfield.html)
- [TRAFFIC RACING](https://themindplays.pages.dev/traffic-racing.html)
- [INDEX11](https://themindskillplayplay.pages.dev/index11.html)
- [BLOCK UP](https://quizverses.github.io/block-up.html)
- [GOON BALL](https://quizverses-9d2f2.web.app/goon-ball.html)
- [TENNIS MASTERS 2026](https://themindplay.pages.dev/tennis-masters-2026.html)
- [CATEGORY POOL](https://theskillquest.pages.dev/category-pool.html)
- [BUS PARKING OUT](https://quizverses.github.io/bus-parking-out.html)
- [TRIPEAKS SOLITAIRE ESCAPES](https://quizverses-9d2f2.web.app/tripeaks-solitaire-escapes.html)
- [STICK KILL 3D](https://theskillquest.pages.dev/stick-kill-3d.html)
- [CATEGORY ESCAPE187](https://studyquests.github.io/category-escape187.html)
- [CATEGORY CARE](https://quizverses.pages.dev/category-care.html)
- [INDEX28](https://theskillquest.pages.dev/index28.html)
- [DINO IDLE PARK](https://themindplay.pages.dev/dino-idle-park.html)
- [SNAKE HUNTER](https://quizverses.pages.dev/snake-hunter.html)
- [ONET MAHJONG CONNECT](https://quizverses.github.io/onet-mahjong-connect.html)
- [TAIL GUN CHARLIE](https://quizverses.github.io/tail-gun-charlie.html)
- [CATEGORY CASUAL 8](https://studyquests.github.io/category-casual-8.html)
- [CATEGORY FASHION105](https://iskillquest.pages.dev/category-fashion105.html)
- [CATEGORY FREE](https://studyquests.github.io/category-free.html)
- [MERGE FLOWERS](https://theskillquest.pages.dev/merge-flowers.html)
- [CATEGORY SANDBOX40](https://iskillquest.pages.dev/category-sandbox40.html)
- [CATEGORY FPS174](https://quizverses-9d2f2.web.app/category-fps174.html)
