
import { useDynamicRowHeight } from 'react-window';

export function useDynamicBufferList() {
  if (typeof window === 'undefined') {
    // SSR: retorna um valor default para evitar erro de ResizeObserver
    return 140;
  }
  // Client: usa o hook normalmente
  return useDynamicRowHeight({
    defaultRowHeight: 140,
  });
}
