import * as React from 'react';

/** Whether the viewport is narrower than `width` pixels, kept current as it resizes. */
export function useBreakpoint(width: number): boolean {
  const query = `(max-width: ${width - 1}px)`;
  const [below, setBelow] = React.useState(() => window.matchMedia(query).matches);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setBelow(mql.matches);

    onChange();
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return below;
}
