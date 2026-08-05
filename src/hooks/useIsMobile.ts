import { useEffect, useState } from 'react';

/**
 * Espelha o breakpoint `md` (768px) do Tailwind em JS, para decidir qual
 * árvore de componentes montar (não apenas qual esconder via CSS) — usado
 * onde as versões mobile/desktop divergem demais para reaproveitar o
 * mesmo JSX com classes responsivas.
 */
export function useIsMobile(breakpointPx = 768): boolean {
  const query = `(max-width: ${breakpointPx - 1}px)`;
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setIsMobile(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return isMobile;
}
