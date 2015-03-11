import videojs from '../src/js/video.js';

import CoreObject from '../src/js/core-object';
import * as Lib from '../src/js/lib';
import MediaTechController from '../src/js/media/media';
import * as Util from '../src/js/util';
import * as Events from '../src/js/events';
import Component from '../src/js/component';
import Button from '../src/js/button';
import Player from '../src/js/player';
import options from '../src/js/options';
import Html5 from '../src/js/media/html5';
import Flash from '../src/js/media/flash';

import PosterImage from '../src/js/player';

import { ChaptersButton } from '../src/js/tracks/text-track-controls';

var TEST = {};

TEST.CoreObject = CoreObject;
TEST.Lib = Lib;
TEST.MediaTechController = MediaTechController;
TEST.Util = Util;
TEST.Events = Events;
TEST.Component = Component;
TEST.Button = Button;
TEST.Player = Player;
TEST.options = options;
TEST.Html5 = Html5;
TEST.Flash = Flash;
TEST.PosterImage = PosterImage;
TEST.ChaptersButton = ChaptersButton;

videojs.TEST = TEST;

export default videojs;
