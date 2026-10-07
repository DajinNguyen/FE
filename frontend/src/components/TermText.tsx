import { Fragment, useMemo } from 'react';
import { useTerms } from '../hooks/useTerms';
import { useTermSheet } from '../hooks/useTermSheet';
import { splitByTerms } from '../utils/termMatcher';
import styles from './TermText.module.css';

/** 문장 속 전문용어에 점선 밑줄을 긋고, 누르면 용어 설명 시트를 열어요. */
export function TermText({ text }: { text: string }) {
  const { data: terms } = useTerms();
  const { openTerm } = useTermSheet();
  const parts = useMemo(() => splitByTerms(text, terms ?? []), [text, terms]);

  return (
    <>
      {parts.map((part, index) =>
        part.termId ? (
          <button
            key={index}
            type="button"
            className={styles.term}
            onClick={() => openTerm(part.termId!)}
            aria-haspopup="dialog"
          >
            {part.text}
          </button>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
