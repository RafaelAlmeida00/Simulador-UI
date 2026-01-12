import { useDynamicRowHeight } from 'react-window';

export function useDynamicBufferList() {
  return useDynamicRowHeight({
    defaultRowHeight: 140,
  });
}
