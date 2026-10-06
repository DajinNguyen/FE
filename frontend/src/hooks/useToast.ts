import { createContext, useContext } from 'react';

export interface ToastContextValue {
  showToast: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast 는 ToastProvider 안에서 사용해요.');
  return context;
}
