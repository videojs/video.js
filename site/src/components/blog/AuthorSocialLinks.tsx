import { Fragment } from 'react';

import AtSign from '@/assets/icons/at-sign.svg?react';
import Globe from '@/assets/icons/globe.svg?react';
import Github from '@/assets/logos/brands/github.svg?react';
import Linkedin from '@/assets/logos/brands/linkedin.svg?react';
import Twitter from '@/assets/logos/brands/x-twitter.svg?react';

import { Tooltip, TooltipProvider } from '../Tooltip';
import { getLinkDestination } from '../typography/linkDestination';

interface SocialLinks {
  website?: string;
  github?: string;
  linkedin?: string;
  bluesky?: string;
  mastodon?: string;
  x?: string;
}

export interface AuthorSocialLinksProps {
  socialLinks: SocialLinks;
  className?: string;
}

const SOCIAL_CONFIGS = {
  website: {
    icon: Globe,
    label: 'Website',
  },
  github: {
    icon: Github,
    label: 'GitHub',
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
  },
  bluesky: {
    icon: AtSign,
    label: 'Bluesky',
  },
  mastodon: {
    icon: AtSign,
    label: 'Mastodon',
  },
  x: {
    icon: Twitter,
    label: 'X',
  },
} as const;

export function AuthorSocialLinks({ socialLinks, className }: AuthorSocialLinksProps) {
  const links = Object.entries(socialLinks).filter(([_, url]) => url) as Array<[keyof SocialLinks, string]>;
  if (links.length === 0) return null;

  return (
    <TooltipProvider>
      <ul className={className}>
        {links.map(([platform, url]) => {
          const config = SOCIAL_CONFIGS[platform];
          if (!config) return <Fragment key={platform} />;

          const Icon = config.icon;

          return (
            <li key={platform}>
              <Tooltip content={config.label}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${config.label} profile`}
                  data-ph-capture-attribute-destination={getLinkDestination(url)}
                  className="intent:text-warm-gray dark:intent:text-manila-50 corner-squircle inline-flex items-center justify-center rounded-md p-2"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}
