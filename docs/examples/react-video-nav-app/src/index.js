import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import videojs from '../node_modules/video.js/dist/video.js';
import '../node_modules/video.js/dist/video-js.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


var vid = document.getElementById('vid1');

var player = videojs('vid1', {
  controlBar: {
    volumePanel: true,
    pictureInPictureToggle: true,
  },
  spatialNavigation: {
    enabled: true,
    horizontalSeek: false,
    enableKeydownListener: true
  }
});

player.ready(function () {
  console.log(player.spatialNavigation);
  player.spatialNavigation.start();

  player.spatialNavigation.on("endOfFocusableComponents", (event) => {
    if (event.direction === "up") {
      const focusableSquares = document.querySelectorAll(".focusable_square");
      if (focusableSquares) focusableSquares[0].focus();
    }
  });
  
});

window.player = player;
player.log('window.player created', player);
