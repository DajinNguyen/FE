import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { TermSheetContext } from '../hooks/useTermSheet';
import { useTerms } from '../hooks/useTerms';
import { TermSheet } from './TermSheet';

export function TermSheetProvider({ children }: { children: ReactNode }) {
  const { data: terms } = useTerms();
  const [termId, setTermId] = useState<string | null>(null);

  const openTerm = useCallback((id: string) => setTermId(id), []);
  const close = useCallback(() => setTermId(null), []);
  const value = useMemo(() => ({ openTerm }), [openTerm]);
  const term = terms?.find((t) => t.id === termId) ?? null;

  return (
    <TermSheetContext.Provider value={value}>
      {children}
      <TermSheet term={term} onClose={close} />
    </TermSheetContext.Provider>
  );
}
