/// <reference types="vite/client" />

import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import '@videojs/html/video/neutral-skin';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';
import { NeutralVideoSkin } from '@videojs/react/video/neutral-skin';

import '@videojs/react/video/skin.css';
import '@videojs/react/video/neutral-skin.css';
import { createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';

const params = new URLSearchParams(location.search);
const neutral = params.get('skin') === 'neutral';
const html = params.get('framework') === 'html';
const src = 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4';
const initialTitle = 'A long video title that should stay clear of the player controls';

function App() {
  const [title, setTitle] = useState(initialTitle);
  const Skin = neutral ? NeutralVideoSkin : VideoSkin;
  const tag = neutral ? 'video-neutral-skin' : 'video-skin';

  return (
    <>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      {html ? (
        createElement(
          'video-player',
          { 'content-title': title },
          createElement(
            tag,
            { style: { width: 320, aspectRatio: '16/9' } },
            <video src={src} muted playsInline style={{ background: 'white' }} />
          )
        )
      ) : (
        <VideoPlayer title={title}>
          <Skin style={{ width: 320, aspectRatio: '16/9' }}>
            <Video src={src} muted playsInline style={{ background: 'white' }} />
          </Skin>
        </VideoPlayer>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
