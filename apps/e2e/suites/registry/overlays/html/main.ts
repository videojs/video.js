import '@videojs/html/audio/player';
import '@videojs/html/video/player';
import '@videojs/html/media/hlsjs-video';
import audioSkin from '@/components/videojs/audio/skin.html?raw';
import '@/components/videojs/audio/skin';
import videoSkin from '@/components/videojs/video/skin.html?raw';
import '@/components/videojs/video/skin';

import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Could not find the application root.');

const mediaPlaceholder = '<!-- Add a compatible media component here. -->';

root.innerHTML = `
  <video-player data-registry-skin="video">
    ${videoSkin.replace(mediaPlaceholder, '<hlsjs-video aria-label="Registry validation video"></hlsjs-video>')}
  </video-player>
  <audio-player data-registry-skin="audio">
    ${audioSkin.replace(mediaPlaceholder, '<audio aria-label="Registry validation audio"></audio>')}
  </audio-player>
`;
