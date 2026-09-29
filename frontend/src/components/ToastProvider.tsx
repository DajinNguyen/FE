import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext } from '../hooks/useToast';
import styles from './ToastProvider.module.css';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={styles.toast}>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
