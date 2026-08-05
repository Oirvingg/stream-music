import { useEffect, useState } from 'react';

/**
 * Retorna `value` com atraso `delayMs`, atualizando só depois que o valor
 * parar de mudar por esse período — usado para evitar disparar uma
 * requisição a cada tecla digitada (ex: sugestões de busca).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
