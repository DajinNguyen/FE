import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ApiError } from '../api/errors';
import { displayName } from '../features/auth/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { nicknameProblem } from '../utils/nickname';
import styles from './MyPage.module.css';

/** 마이페이지: 내 정보를 보고 닉네임을 바꿔요 */
export function MyPage() {
  const navigate = useNavigate();
  const { user, isLoading, loginWithGoogle, updateNickname, logout } = useAuth();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (isLoading) return <div className={styles.page} aria-hidden="true" />;
  if (!user) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="로그인이 필요해요"
          description="Google로 로그인하면 내 정보를 볼 수 있어요."
          action={<Button onClick={loginWithGoogle}>Google로 로그인</Button>}
        />
      </div>
    );
  }

  const current = displayName(user);
  const value = draft ?? current;
  const problem = nicknameProblem(value);
  const unchanged = value.trim() === current;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (problem || unchanged || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateNickname(value.trim() || null);
      setDraft(null);
      showToast('닉네임을 바꿨어요');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '닉네임을 바꾸지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>마이페이지</h1>
        <p className={styles.subtitle}>내 정보를 확인하고 닉네임을 바꿀 수 있어요</p>
      </header>

      <form className={styles.card} onSubmit={save} noValidate>
        <h2 className={styles.cardTitle}>닉네임</h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="nickname">
            커뮤니티와 상단 메뉴에 이 이름으로 보여요
          </label>
          <div className={styles.row}>
            <input
              id="nickname"
              className={styles.input}
              value={value}
              maxLength={20}
              autoComplete="off"
              aria-invalid={problem !== null || error !== null}
              aria-describedby="nickname-help"
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
            />
            <Button type="submit" disabled={problem !== null || unchanged || saving}>
              {saving ? '저장 중…' : '저장'}
            </Button>
          </div>
          {problem || error ? (
            <p id="nickname-help" className={styles.error} role="alert">
              {problem ?? error}
            </p>
          ) : (
            <p id="nickname-help" className={styles.help}>
              2~12자, 한글·영문·숫자·밑줄(_)만 쓸 수 있어요. 비우고 저장하면 자동 닉네임으로
              돌아가요.
            </p>
          )}
        </div>
      </form>

      <section className={styles.card} aria-label="계정 정보">
        <h2 className={styles.cardTitle}>계정 정보</h2>
        <div className={styles.field}>
          <span className={styles.label}>이메일</span>
          <span className={styles.value}>{user.email}</span>
        </div>
        {user.joined_at && (
          <div className={styles.field}>
            <span className={styles.label}>가입일</span>
            <span className={styles.value}>{user.joined_at.replaceAll('-', '.')}</span>
          </div>
        )}
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              void logout().then(() => navigate('/'));
            }}
          >
            로그아웃
          </Button>
        </div>
      </section>

      <p className={styles.notice}>
        Google 계정의 이메일과 이름만 받아요. 실명은 다른 사람에게 보이지 않고, 닉네임만 보여요.
      </p>
    </div>
  );
}
