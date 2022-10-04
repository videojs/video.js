import videojs from './video';
import 'videojs-contrib-quality-levels';
import '@videojs/http-streaming';
import DomData from './utils/dom-data.js';

videojs.DomData = DomData;

videojs.log.level('debug');
export default videojs;
