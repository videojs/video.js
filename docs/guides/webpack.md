# Using Webpack with Video.js

Video.js, and the playback technologies such as videojs-contrib-hls all work in a Webpack based build environment. Here are several configuration changes specific to Webpack that will get you up and running.

## Video.js CSS:
To add the CSS that the player requires, simply add
`require('!style-loader!css-loader!video.js/dist/video-js.css')` to the file where the player is also included or initialized.

## Handling .eot files in Webpack
In addition to this, you may run into a problem where Webpack does not know how to load .eot files required for IE8 support by default. This can be solved by installing the file-loader and url-loader packages. Install them by running:
`npm install --save-dev file-loader url-loader`

With both packages installed, simply add the following to you webpack.config file in the 'loaders' section:
```
{
  loader: 'url-loader?limit=100000',
  test: /\.(png|woff|woff2|eot|ttf|svg)$/
}
```

## Using Webpack with videojs-contrib-hls
Import the HLS library with a line such as:
`import * as HLS from 'videojs-contrib-hls';`

In order to use the tech, we must also introduce webworkers with the package 'webworkify-webpack-dropin', run:
`npm install --save-dev webworkify-webpack-dropin`

To utilize this in your page, simply create an alias in your webpack.config.js file with:
```
resolve: {
  alias: {
    webworkify: 'webworkify-webpack-dropin'
  }
}
```

Source maps that use the 'eval' tag are not compatible with webworkify, so this may need to be changed also. Source maps such as 'cheap-eval-module-source-map' should be changed to 'cheap-source-map' or anything else that fits your build without using 'eval' source maps.
