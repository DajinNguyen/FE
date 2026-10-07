import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Term } from '../types';
import styles from './TermSheet.module.css';

interface TermSheetProps {
  term: Term | null;
  onClose: () => void;
}

/** 아래에서 올라오는 용어 설명 시트 */
export function TermSheet({ term, onClose }: TermSheetProps) {
  useEffect(() => {
    if (!term) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [term, onClose]);

  if (!term) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="term-sheet-title"
      >
        <div className={styles.handle} aria-hidden="true" />
        <p className={styles.eyebrow}>용어 알아보기</p>
        <h2 id="term-sheet-title" className={styles.title}>
          {term.term}
        </h2>
        <p className={styles.meaning}>{term.easy}</p>
        <div className={styles.example}>
          <p className={styles.exampleLabel}>예를 들면</p>
          <p>{term.example}</p>
        </div>
        <button type="button" className={styles.confirm} onClick={onClose} autoFocus>
          알겠어요
        </button>
      </div>
    </div>,
    document.body,
  );
}
