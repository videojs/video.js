import '@videojs/html/video/player';
import '@videojs/html/ui/container';
import '@videojs/html/ui/time-slider';
import '@videojs/html/ui/slider-track';
import '@videojs/html/ui/slider-fill';
import '@videojs/html/ui/slider-thumb';
import '@videojs/html/ui/time-slider-markers';

const player = document.querySelector('video-player');

player?.store.addTextTrack({
  kind: 'metadata',
  label: 'ads',
  cues: [{ startTime: 8 }, { startTime: 18, endTime: 24 }],
});
