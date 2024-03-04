import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import videojs from '../node_modules/video.js/dist/video.js';
import '../node_modules/video.js/dist/video-js.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

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
