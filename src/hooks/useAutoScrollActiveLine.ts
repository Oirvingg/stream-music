import { useEffect, useRef } from 'react';

/**
 * Ref para a linha ativa da letra sincronizada. Rola instantaneamente
 * (sem debounce/animação) assim que a primeira linha é destacada para uma
 * nova faixa/letra — evita o atraso perceptível de "letra travada" nos
 * primeiros segundos. Trocas de linha seguintes usam scroll suave com um
 * pequeno debounce, para não saltar bruscamente entre versos.
 *
 * `resetKey` deve mudar sempre que a letra atual for substituída (nova
 * faixa, novo carregamento) para que a próxima linha ativa volte a rolar
 * instantaneamente em vez de usar o debounce suave.
 */
export function useAutoScrollActiveLine(activeIndex: number, resetKey: unknown) {
  const activeLineRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hasScrolledRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (activeIndex === -1) return;

    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true;
      activeLineRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeIndex]);

  return activeLineRef;
}
