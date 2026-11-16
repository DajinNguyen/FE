import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { ADK_NOTICE, SIGNUP_GIFT_TEXT } from '../../config/currency';
import { useAuth } from '../../hooks/useAuth';
import { LoginSheetContext, type LoginReason } from '../../hooks/useRequireLogin';

const sheetText: Record<LoginReason, { title: string; body: string }> = {
  community: {
    title: 'Google로 로그인하면 이용할 수 있어요',
    body: '글쓰기·댓글·좋아요·신고는 로그인 후 이용할 수 있어요. 글 보기는 로그인 없이 돼요.',
  },
  adk: {
    title: SIGNUP_GIFT_TEXT,
    body: `AI 리포트 만들기·AI 챗봇·낱말퀴즈 보상은 로그인 후 이용할 수 있어요. 이미 만들어진 리포트는 로그인 없이 볼 수 있어요. ${ADK_NOTICE}.`,
  },
};

/**
 * 로그인이 필요한 동작을 비로그인으로 누르면 띄우는 시트.
 * 로그인하면 눌렀던 동작을 이어서 실행해요.
 */
export function LoginSheetProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, loginWithGoogle, devLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<LoginReason>('community');
  const pending = useRef<(() => void) | null>(null);

  const requireLogin = useCallback(
    (action?: () => void, why: LoginReason = 'community') => {
      if (isLoggedIn) {
        action?.();
        return true;
      }
      pending.current = action ?? null;
      setReason(why);
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

  const value = useMemo(() => ({ requireLogin }), [requireLogin]);

  return (
    <LoginSheetContext.Provider value={value}>
      {children}
      <Sheet
        open={open}
        onClose={close}
        eyebrow="로그인이 필요해요"
        title={sheetText[reason].title}
      >
        <p>{sheetText[reason].body}</p>
        <Button size="lg" block onClick={loginWithGoogle}>
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
