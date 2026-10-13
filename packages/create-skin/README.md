# @videojs/create-skin

Create a local project for building your own [Video.js](https://videojs.org) skin. It copies a skin's source into a
new Vite project with a page that previews it. The preview plays NASA's Cosmic Dawn trailer from Mux, with chapters;
change the media in `apps/preview/src/player`.

## Usage

```sh
npm create @videojs/skin@latest
```

`pnpm create @videojs/skin`, `yarn create @videojs/skin`, and `bun create @videojs/skin` work too. The command asks for:

- **Name**: required. The project goes in a folder named after it unless you choose another directory.
- **Framework**: React or HTML.
- **Styling**: Tailwind CSS or CSS. HTML skins use CSS.
- **Starting skin**: Scaffold (the default, every control wired up with minimal styling), Default, Neutral, or Compat.
- **Preset**: video, audio, live video, or live audio.

Pass flags to skip the questions, or `--yes` to take the defaults for anything you leave out:

```sh
npm create @videojs/skin@latest -- --name Neon --framework html --base default --preset audio
npm create @videojs/skin@latest ~/skins/neon -- --name Neon --yes
```

Every run ends by printing the command that creates the same skin with no questions, so you can share a setup or
repeat it. Without a terminal to ask in, such as in CI or from a coding agent, the command stops and lists the choices
you left out instead of picking them for you; pass them, or `--yes` to accept their defaults. `--name` has no default.

Run with `--help` for every option.

## What you get

- `src/`: the skin, and nothing else, so it can move into an app as it is. The component is `src/<preset>/skin`.
- `apps/preview/`: a page that mounts the skin in a player.
- `skin.json`: what the skin was created from, including the Video.js version.

Packaged skins come from the same [Shadcn registry](https://videojs.org/docs/framework/react/guides/installation-shadcn)
the installation guide uses, at the version that matches this package.

## Develop this package

From the repository root, run the command against this checkout instead of npm and the hosted registry:

```sh
pnpm build:packages
pnpm create:skin
pnpm create:skin ~/skins/neon --name Neon --framework html --base default
```

`create:skin` builds the CLI, packs the Video.js packages a skin needs into tarballs, builds the registry if it is missing, and
passes `--registry` and `--override` so the new project installs those local builds. It asks where to put the project
like the published command does, relative to the directory you ran it from.

## License

[Apache-2.0](https://github.com/videojs/video.js/blob/main/LICENSE)
