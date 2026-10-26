import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { useAuth } from '../../hooks/useAuth';
import { LoginSheetContext } from '../../hooks/useRequireLogin';
import { useToast } from '../../hooks/useToast';
import { GOOGLE_LOGIN_UNAVAILABLE } from './AuthContext';

/**
 * 로그인이 필요한 동작(글쓰기·수정·삭제·댓글·좋아요·신고)을 비로그인으로 누르면 띄우는 시트.
 * 로그인하면 눌렀던 동작을 이어서 실행해요.
 */
export function LoginSheetProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, loginWithGoogle, devLogin } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const requireLogin = useCallback(
    (action?: () => void) => {
      if (isLoggedIn) {
        action?.();
        return true;
      }
      pending.current = action ?? null;
      setOpen(true);
      return false;
    },
    [isLoggedIn],
  );

  // 로그인되면 시트를 닫고 눌렀던 동작을 이어서 해요.
  useEffect(() => {
    if (!isLoggedIn || !open) return;
    setOpen(false);
    const action = pending.current;
    pending.current = null;
    action?.();
  }, [isLoggedIn, open]);

  const close = useCallback(() => {
    pending.current = null;
    setOpen(false);
  }, []);

  const google = async () => {
    const ok = await loginWithGoogle();
    if (!ok) showToast(GOOGLE_LOGIN_UNAVAILABLE);
  };

  const value = useMemo(() => ({ requireLogin }), [requireLogin]);

  return (
    <LoginSheetContext.Provider value={value}>
      {children}
      <Sheet
        open={open}
        onClose={close}
        eyebrow="로그인이 필요해요"
        title="Google로 로그인하면 이용할 수 있어요"
      >
        <p>글쓰기·댓글·좋아요·신고는 로그인 후 이용할 수 있어요. 글 보기는 로그인 없이 돼요.</p>
        <Button size="lg" block onClick={google}>
          Google로 로그인
        </Button>
        {devLogin && (
          <Button size="lg" block variant="secondary" onClick={devLogin}>
            개발용으로 로그인
          </Button>
        )}
        <Button block variant="ghost" onClick={close}>
          닫기
        </Button>
      </Sheet>
    </LoginSheetContext.Provider>
  );
}
