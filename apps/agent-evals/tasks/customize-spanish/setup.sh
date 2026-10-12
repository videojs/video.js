#!/usr/bin/env bash
# The React player on a site written in Spanish, with the document language set to match.
set -euo pipefail

src=https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4

PLAYER_SRC="$src" bash "$(dirname "$0")/../_setup/react-next-player.sh"

cat > app/layout.tsx <<'TSX'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acme Studio",
  description: "Cortometrajes de creadores independientes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
TSX

cat > app/page.tsx <<TSX
import { Player } from "@/components/player";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Acme Studio</h1>
      <p className="mt-3 text-lg text-zinc-600">
        Cortometrajes de creadores independientes.
      </p>
      <div className="mt-8">
        <Player src="${src}" />
      </div>
      <p className="mt-6 text-zinc-600">
        Estrenamos una película nueva cada semana. Suscríbete para no perderte ninguna.
      </p>
    </main>
  );
}
TSX
