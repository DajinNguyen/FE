import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Sheet.module.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** 제목 위 작은 글자 */
  eyebrow?: string;
  /** 'side': 넓은 화면에서 오른쪽 패널로 열어요 (모바일은 똑같이 아래에서) */
  placement?: 'center' | 'side';
}

/**
 * 아래에서 올라오는 시트 (넓은 화면에서는 가운데 대화상자).
 * 로그인 안내·신고·작성 중 나가기 확인처럼 화면 안에서 묻는 곳에 써요. (alert/confirm 대신)
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  eyebrow,
  placement = 'center',
}: SheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={`${styles.root} ${placement === 'side' ? styles.side : ''}`}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.handle} aria-hidden="true" />
        <button type="button" className={styles.close} onClick={onClose} aria-label="시트 닫기">
          ×
        </button>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
