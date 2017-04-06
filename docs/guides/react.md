# video.js and ReactJS integration

Here's a basic ReactJS player implementation.

It just instantiates the video.js player on `componentDidMount` and destroys it on `componentWillUnmount`.

```jsx
import React from 'react';
import videojs from 'video.js'

export default class VideoPlayer extends React.Component {
  componentDidMount() {
    // instantiate video.js
    this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
      console.log('onPlayerReady', this)
    });
  }

  // destroy player on unmount
  componentWillUnmount() {
    if (this.player) {
      this.player.dispose()
    }
  }

  // wrap the player in a div with a `data-vjs-player` attribute
  // so videojs won't create additional wrapper in the DOM
  // see https://github.com/videojs/video.js/pull/3856
  render() {
    return (
      <div data-vjs-player>
        <video ref={ node => this.videoNode = node } className="video-js"></video>
      </div>
    )
  }
}
```

You can then use it like this: (see [options guide][options] for option information)

```jsx
const videoJsOptions = {
  autoplay: true,
  controls: true,
  sources: [{
    src: '/path/to/video.mp4',
    type: 'video/mp4'
  }]
}

return <VideoPlayer { ...videoJsOptions } />
```

Dont forget to include the video.js CSS, located at `video.js/dist/video-js.css`.

### Some notes for Webpack Users:
If you are using Webpack, then this can easily be achieved by adding
`require('!style-loader!css-loader!video.js/dist/video-js.css')` to the file where you use the VideoPlayer component.

In addition to this, you may run into a problem where Webpack does not know how to load .eot files by default. This can be solved by installing the file-loader and url-loader packages. Install them by running:
`npm install --save file-loader url-loader`

With both packages installed, simply add the following to you webpack.config file in the 'loaders' section:
```
{
  test: /\.(png|woff|woff2|eot|ttf|svg)$/,
  loader: 'url-loader?limit=100000'
}
```

[options]: /docs/guides/options.md
