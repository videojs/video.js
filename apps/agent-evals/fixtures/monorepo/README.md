# Acme Studio

A pnpm workspace for the Acme Studio website.

| Path | Package | What it is |
| --- | --- | --- |
| `apps/web` | `web` | The Next.js site |
| `packages/ui` | `@acme/ui` | Shared React components used by the apps |

```bash
pnpm install
pnpm dev     # runs the web app
pnpm build   # builds the web app
```

`@acme/ui` ships its TypeScript source; the web app compiles it through `transpilePackages` in `apps/web/next.config.ts`.
