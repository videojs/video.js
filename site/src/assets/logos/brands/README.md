# Brand logos

Third-party marks used by the docs site (framework and media pickers, author links). Sourced through
[Icônes](https://icones.js.org) / Iconify; each file keeps its upstream licence and is only trimmed of root
`width`/`height` attributes so callers size it with CSS.

| Files | Collection | Licence |
| --- | --- | --- |
| `react`, `html5`, `vue`, `nuxt`, `svelte`, `css3`, `tailwindcss`, `nextjs`, `vite`, `laravel`, `react-router`, `astro`, `npm`, `jsdelivr`, `vscode` (`logos:visual-studio-code`), `claude` (`logos:claude-icon`), `youtube`, `vimeo`, `cloudflare`, `tiktok`, `twitch`, `spotify` | [SVG Logos](https://github.com/gilbarbara/logos) (`logos:*`) | CC0 1.0 |
| `github`, `linkedin`, `x-twitter`, `openai`, `cursor`, `tanstack`, `shadcn` | [Simple Icons](https://simpleicons.org) (`simple-icons:*`) | CC0 1.0 |

`react-router` draws its black dots in `currentColor` instead, so they stay visible on dark surfaces; every other mark
keeps its upstream colours. `vscode` renames its gradient and mask ids so they cannot collide on the page. OpenAI and
Cursor publish only black marks, so theirs stay single-colour in `currentColor`.

Logos remain trademarks of their respective owners; use them only to identify the product they represent.
