import '@app/styles.css';
// HyperFrames composition sandbox — HTML
// http://localhost:5173/hyperframes-video-html/
//
// The composition is the `<template>` child: clips timed with `data-start`/`data-duration`, animated by a GSAP
// timeline the page builds from the composition root.
import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import '@videojs/html/video/skin.css';
import '@videojs/html/media/hyperframes-video';

// GSAP loads from the page's `<script>`; only the calls the timeline makes are typed.
interface GsapTimeline {
  from(target: Element | null, vars: object, position?: number): GsapTimeline;
  to(target: Element | null, vars: object, position?: number): GsapTimeline;
  duration(): number;
  seek(time: number): unknown;
  pause(): unknown;
}

declare const gsap: { timeline(): GsapTimeline };

const html = String.raw;

document.getElementById('root')!.innerHTML = html`
  <video-player>
    <video-skin class="sandbox-video-frame mx-auto block w-full max-w-4xl" style="aspect-ratio: 16 / 9">
      <hyperframes-video class="block h-full w-full">
        <template>
          <style>
            .stage {
              position: absolute;
              inset: 0;
              background: linear-gradient(135deg, #0f172a, #1e3a8a);
            }
            .title,
            .subtitle {
              position: absolute;
              left: 160px;
              margin: 0;
              font:
                800 140px/1 system-ui,
                sans-serif;
              color: #fff;
            }
            .title {
              top: 320px;
            }
            .subtitle {
              top: 520px;
              font-size: 72px;
              font-weight: 500;
              color: #fbbf24;
            }
            .shape {
              position: absolute;
              right: 220px;
              top: 380px;
              width: 280px;
              height: 280px;
              border-radius: 48px;
              background: #f472b6;
            }
          </style>
          <div class="stage" data-start="0" data-duration="8" data-track-index="0"></div>
          <h1 class="clip title" data-start="0" data-duration="5" data-track-index="1">Hello, Video.js</h1>
          <p class="clip subtitle" data-start="1.5" data-duration="6.5" data-track-index="2">played by HyperFrames</p>
          <div class="clip shape" data-start="3" data-duration="5" data-track-index="3"></div>
        </template>
      </hyperframes-video>
    </video-skin>
  </video-player>
`;

const media = document.querySelector('hyperframes-video')!;

media.timeline = (root) =>
  gsap
    .timeline()
    .from(root.querySelector('.title'), { y: 80, opacity: 0, duration: 1, ease: 'power3.out' }, 0)
    .from(root.querySelector('.subtitle'), { x: -120, opacity: 0, duration: 0.8, ease: 'power2.out' }, 1.5)
    .from(root.querySelector('.shape'), { scale: 0, rotation: -180, duration: 1.2, ease: 'back.out(1.7)' }, 3)
    .to(root.querySelector('.shape'), { rotation: 180, duration: 3.8, ease: 'none' }, 4.2);
