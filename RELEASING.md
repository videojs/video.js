RELEASING
=========
The video.js release process is outlined below. Only core contributors
to video.js can create a new release but we do them very regularly. If
you're just looking to get involved with the project, head over to the
[contribution guide](CONTRIBUTING.md) for tips on how to get started.

## Patch Releases
- Merge from stable to patch
- Push from patch to upstream
- Log into codeship.io and watch the publishing process
- Checkout and update stable
- Run `npm i`
- Run `grunt` to create build/cdn
- Upload CDN files to AWS minor/patch locations
  - Currently, you need @heff to do this
- Log into fastly.com and purge the CDN
  - Go to "Configure"
  - Click Purge
  - Add the path you'd like to purge. For example, "4.12/*"
You're done!