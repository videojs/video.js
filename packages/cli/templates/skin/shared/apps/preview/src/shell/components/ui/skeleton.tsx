// Copied from the Video.js sandbox, apps/sandbox/app/components/ui/skeleton.tsx, with only the import paths changed.
import { cn } from 'cn';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export { Skeleton };
