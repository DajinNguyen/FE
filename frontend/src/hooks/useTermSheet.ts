import { createContext, useContext } from 'react';

export interface TermSheetContextValue {
  openTerm: (termId: string) => void;
}

export const TermSheetContext = createContext<TermSheetContextValue | null>(null);

export function useTermSheet() {
  const context = useContext(TermSheetContext);
  if (!context) throw new Error('useTermSheet 는 TermSheetProvider 안에서 사용해요.');
  return context;
}
