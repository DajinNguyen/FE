import { useState } from 'react';
import { useLocation } from 'react-router';
import { ApiError } from '../../api/errors';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { useAuth } from '../../hooks/useAuth';
import styles from './ConsentGate.module.css';

/**
 * 처음 로그인했거나 약관이 바뀐 사용자에게 약관·개인정보 동의와 만 14세 이상 확인을 받아요.
 * 동의하기 전에는 서비스 기능을 쓸 수 없어요 (서버도 403 CONSENT_REQUIRED 로 막아요).
 * 약관 글을 읽을 수 있게 /legal 화면에서는 열리지 않아요.
 */
export function ConsentGate() {
  const { user, agreeToTerms, logout } = useAuth();
  const { pathname } = useLocation();
  const [checks, setChecks] = useState({ terms: false, privacy: false, age_14: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = user?.consent_required === true && !pathname.startsWith('/legal');
  const all = checks.terms && checks.privacy && checks.age_14;

  async function submit() {
    if (!all || saving) return;
    setSaving(true);
    setError(null);
    try {
      await agreeToTerms(checks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '동의를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  const toggle = (key: keyof typeof checks) => setChecks((c) => ({ ...c, [key]: !c[key] }));

  return (
    <Sheet
      open={open}
      dismissible={false}
      onClose={() => {}}
      eyebrow="처음 오셨네요"
      title="서비스 이용 동의"
    >
      <p>다진을 쓰려면 아래 내용에 동의해 주세요.</p>
      <div className={styles.checks}>
        <label className={`${styles.check} ${styles.all}`}>
          <input
            type="checkbox"
            checked={all}
            onChange={() => {
              const next = !all;
              setChecks({ terms: next, privacy: next, age_14: next });
            }}
          />
          전체 동의
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={checks.age_14} onChange={() => toggle('age_14')} />
          (필수) 만 14세 이상이에요
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={checks.terms} onChange={() => toggle('terms')} />
          <span>
            (필수){' '}
            <a className={styles.link} href="/legal/terms" target="_blank" rel="noreferrer">
              이용약관
            </a>
            에 동의해요
          </span>
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={checks.privacy} onChange={() => toggle('privacy')} />
          <span>
            (필수){' '}
            <a className={styles.link} href="/legal/privacy" target="_blank" rel="noreferrer">
              개인정보 처리방침
            </a>
            에 동의해요
          </span>
        </label>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button size="lg" block disabled={!all || saving} onClick={() => void submit()}>
        {saving ? '저장 중…' : '동의하고 시작하기'}
      </Button>
      <Button block variant="ghost" onClick={() => void logout()}>
        동의하지 않고 로그아웃
      </Button>
    </Sheet>
  );
}
