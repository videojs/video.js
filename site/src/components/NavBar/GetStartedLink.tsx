import { useStore } from '@nanostores/react';

import { currentFramework } from '@/stores/preferences';
import { resolveDocsHref } from '@/utils/docs/routing';
import useIsHydrated from '@/utils/useIsHydrated';

export interface GetStartedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
}

export default function GetStartedLink({ children, ...props }: GetStartedLinkProps) {
  const framework = useStore(currentFramework);
  const isHydrated = useIsHydrated();

  const href = resolveDocsHref({ slug: null, framework: isHydrated ? framework : null });

  return (
    <a data-ph-capture-attribute-destination="docs" {...props} href={href}>
      {children}
    </a>
  );
}
