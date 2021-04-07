# Video.js and Angular integration

Here's a basic Angular player implementation.

It just instantiates the Video.js player on `OnInit` and destroys it on `OnDestroy`.

```ts
// vjs-player.component.ts
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import videojs from 'video.js';

@Component({
  selector: 'app-vjs-player',
  template: `
    <video #target class="video-js" controls muted playsinline preload="none"></video>
  `,
  styleUrls: [
    './vjs-player.component.css'
  ],
  encapsulation: ViewEncapsulation.None,
})
export class VjsPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('target', {static: true}) target: ElementRef;
  // see options: https://github.com/videojs/video.js/blob/main/docs/guides/options.md
  @Input() options: {
      fluid: boolean,
      aspectRatio: string,
      autoplay: boolean,
      sources: {
          src: string,
          type: string,
      }[],
  };
  player: videojs.Player;

  constructor(
    private elementRef: ElementRef,
  ) { }

  ngOnInit() {
    // instantiate Video.js
    this.player = videojs(this.target.nativeElement, this.options, function onPlayerReady() {
      console.log('onPlayerReady', this);
    });
  }

  ngOnDestroy() {
    // destroy player
    if (this.player) {
      this.player.dispose();
    }
  }
}
```

Don't forget to include the Video.js CSS, located at `video.js/dist/video-js.css`.

```css
/* vjs-player.component.css */
@import '~video.js/dist/video-js.css';
```

You can then use it like this.

```html
<app-vjs-player [options]="{ autoplay: true, controls: true, sources: [{ src: '/path/to/video.mp4', type: 'video/mp4' }]}"></app-vjs-player>
```
