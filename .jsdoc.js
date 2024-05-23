"use strict";

const pkg = require('./package.json');

module.exports = {
  source: {
    include: ['src/js/'],
    includePattern: '.js$',
  },
  opts: {
    destination: 'docs/api',
    readme: 'docs/index.md',
    template: 'node_modules/clean-jsdoc-theme',
    package: '',
    recurse: true,
    encoding: 'utf8',
    theme_opts: {
      homepageTitle: 'Video.js API docs',
      menu: [
        {
          title: 'Video.js website',
          link: 'https://videojs.com',
          class: 'link-vjs',
        },
        {
          title: `v${pkg.version} source`,
          link: 'https://github.com/videojs/video.js',
          class: 'link-gh',
        },
        {
          title: 'Twitter',
          link: 'https://twitter.com/videojs',
          class: 'link-tw',
        },
      ],
      favicon: 'https://videojs.com/favicon.ico',
      footer:
        '<span class="copyright"><a href="https://videojs.com">Video.js</a> is a free and open source HTML5 video player. © <a href="https://brightcove.com" target="_blank">Brightcove, Inc</a>. <a href="https://github.com/videojs/video.js/blob/master/LICENSE" class="button blue" target="_blank">View license</a></span>',
      include_css: ['./build/docs/styles/videojs.css'],
      displayModuleHeade: true,
      meta: [
        {
          name: 'name',
          content: 'Video.js API documentation',
        },
        {
          name: 'description',
          content:
            `Generated API documentation for the latest version of Video.js (${pkg.version}).`,
        },
      ],
    },
  },
  templates: {
    default: {
      staticFiles: {
        include: ['build/docs/'],
      },
    },
  },
  plugins: [
    'plugins/markdown',
    'build/jsdoc-typeof-plugin',
    'build/jsdoc-workarounds',
  ],
  markdown: {
    tags: ['example'],
    idInHeadings: true,
  },
};
