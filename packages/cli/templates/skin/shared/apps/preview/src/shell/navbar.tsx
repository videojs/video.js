import { ArrowTopRightOnSquareIcon, BookOpenIcon, Cog8ToothIcon } from '@heroicons/react/16/solid';
import { Badge } from '@preview/shell/components/ui/badge';
import { Button } from '@preview/shell/components/ui/button';
import { useSidebar } from '@preview/shell/components/ui/sidebar';

import { skin } from './config';

type NavbarProps = {
  /** The preview on its own, to open in a new tab. */
  previewUrl: string;
  /** The options panel this bar's toggle opens and closes. */
  optionsId: string;
};

/** The skin and links out. Everything else sits in the options panel. */
export function Navbar({ previewUrl, optionsId }: NavbarProps) {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();

  return (
    <header className="border-border bg-background flex h-14 shrink-0 items-center gap-4 border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <svg viewBox="0 0 209 209" width="18" height="18" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ffa81b" d="M0 0h209v209H0z" />
          <path fill="#ff6200" d="M0 80h209v129H0z" />
          <path fill="#eb3132" d="M0 142h209v67H0z" />
          <path fill="#cc3566" d="M0 187h209v22H0z" />
          <path d="M167.09 104.5L65.13 169.81V39.19l101.96 65.31z" fill="#ebe4c1" />
        </svg>
        <h1 className="text-foreground truncate text-base font-semibold tracking-tight">{skin.name}</h1>
        <Badge variant="outline">
          {skin.frameworkLabel} · {skin.presetLabel}
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" aria-label="Open the preview in a new tab" />
          }
        >
          <ArrowTopRightOnSquareIcon className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={
            <a
              href={skin.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Customize skins guide (opens in a new tab)"
            />
          }
        >
          <BookOpenIcon className="size-4" aria-hidden="true" />
        </Button>
        <Button
          id={`${optionsId}-trigger`}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Options"
          aria-expanded={isMobile ? openMobile : open}
          aria-controls={optionsId}
          onClick={() => {
            toggleSidebar();

            if (!isMobile && !open) {
              requestAnimationFrame(() => document.getElementById(`${optionsId}-close`)?.focus());
            }
          }}
        >
          <Cog8ToothIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
