# Icons

Interface glyphs for the docs site, imported as React components through `?react` (SVGR).

- Interface glyphs come from [Octicons](https://primer.style/octicons) via [Icônes](https://icones.js.org)
  (`octicon:*`), MIT licence. Each file is the variant authored for the size it renders at: plain names (including `markdown` and the prompt's `undo`) are the 16px
  drawings, `*-24` files and the picker/theme glyphs (`cloud-upload`, `computer`, `film`, `image`, `live-streaming`,
  `moon`, `radio`, `sun`, and the prompt's `terminal`) are 24px drawings. `sun-16`, `moon-16`, and `computer-16` are the 16px
  drawings of the theme glyphs for compact controls. Render them only at that size (`size-4` or `size-6`), never through `em`
  units, so strokes stay on whole pixels.
- `music-note` and `puzzle` have no Octicon; they come from
  [Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons) (`fluent:*-regular`), MIT licence, at
  24px and 16px respectively. The skin glyphs `sparkle`, `circle`, `square-hint`, and `puzzle-24` (`fluent:puzzle-piece`) and the coding
  agent select's `wand` are Fluent's regular 24px drawings, because Octicons only offer a filled sparkle. `paintbrush` is Fluent's filled 24px drawing (`fluent:paint-brush-24-filled`) so it
  carries the same weight as the Discord and GitHub marks beside it.
- Root `width`/`height` attributes are removed so callers size them with CSS; they inherit `currentColor`.
- `arrow`, `dial-inner`, `dial-outer`, `triangle-arrow` are Video.js originals.
