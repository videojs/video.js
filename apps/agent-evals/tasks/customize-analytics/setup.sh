#!/usr/bin/env bash
# The React player, plus the Acme analytics snippet that the layout loads on every page, its window typings, and the
# page-view tracking the app already does with it.
set -euo pipefail

PLAYER_SRC=https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4 \
  bash "$(dirname "$0")/../_setup/react-next-player.sh"

mkdir -p public types

cat > public/acme.js <<'JS'
/* Acme Analytics browser snippet v2.3. Sends events to the Acme collector; see https://docs.acme.example/track. */
(function () {
  var queue = [];

  window.acme = {
    track: function (event, properties) {
      queue.push({ event: event, properties: properties || {}, timestamp: Date.now() });
      console.log('[acme] track', event, properties || {});
    },
  };
})();
JS

cat > types/acme.d.ts <<'TS'
export {};

declare global {
  interface Window {
    /** Acme Analytics, loaded from public/acme.js in the root layout. */
    acme: {
      track(event: string, properties?: Record<string, unknown>): void;
    };
  }
}
TS

cat > components/page-view.tsx <<'TSX'
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Reports every page view to Acme Analytics. */
export function PageView() {
  const pathname = usePathname();

  useEffect(() => {
    window.acme?.track("page_view", { path: pathname });
  }, [pathname]);

  return null;
}
TSX

cat > app/layout.tsx <<'TSX'
import type { Metadata } from "next";
import Script from "next/script";
import { PageView } from "@/components/page-view";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acme Studio",
  description: "Short films from independent creators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Script src="/acme.js" strategy="beforeInteractive" />
        <PageView />
        {children}
      </body>
    </html>
  );
}
TSX
