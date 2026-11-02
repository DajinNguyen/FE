import { createContext, useContext } from 'react';

export interface LoginSheetContextValue {
  /**
   * 로그인했으면 action 을 바로 실행하고 true, 아니면 로그인 안내 시트를 띄우고 false.
   * 시트에서 로그인하면 action 을 이어서 실행해요.
   */
  requireLogin: (action?: () => void) => boolean;
}

export const LoginSheetContext = createContext<LoginSheetContextValue | null>(null);

export function useRequireLogin() {
  const context = useContext(LoginSheetContext);
  if (!context) throw new Error('useRequireLogin 은 LoginSheetProvider 안에서 사용해요.');
  return context.requireLogin;
}
