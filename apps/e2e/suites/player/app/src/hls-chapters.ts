import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import '@videojs/html/media/hlsjs-video';
import '@videojs/html/media/native-hls-video';

// `?media=` picks the HLS path under test; `?src=` is the source it plays.
const MEDIA_ELEMENTS = ['hlsjs-video', 'native-hls-video'];

const params = new URLSearchParams(location.search);
const tag = params.get('media') ?? '';
if (!MEDIA_ELEMENTS.includes(tag)) throw new Error(`Unknown media element: ${tag}`);

const player = document.createElement('video-player');
const skin = document.createElement('video-skin');
const media = document.createElement(tag);

skin.style.cssText = 'width: 800px; aspect-ratio: 16/9';

for (const name of ['playsinline', 'muted']) media.setAttribute(name, '');

media.setAttribute('crossorigin', 'anonymous');
media.setAttribute('src', params.get('src') ?? '');

skin.append(media);
player.append(skin);
document.getElementById('root')!.append(player);
