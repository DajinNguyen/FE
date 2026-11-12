import { useRequireLogin } from '../../hooks/useRequireLogin';
import { useTermProgress } from '../../hooks/useTermProgress';
import styles from './MyLearningRecord.module.css';

/** 학습 메인 "내 학습 기록": 외운 용어 수 · 오늘 학습 수 · 연속 학습일 */
export function MyLearningRecord() {
  const { stats, storage } = useTermProgress();
  const requireLogin = useRequireLogin();

  return (
    <section className={styles.record} aria-labelledby="my-learning-record">
      <h2 id="my-learning-record" className={styles.title}>
        내 학습 기록
      </h2>
      <dl className={styles.stats}>
        <div>
          <dt>외운 용어</dt>
          <dd>
            {stats.mastered}
            <span className={styles.unit}>개</span>
          </dd>
        </div>
        <div>
          <dt>오늘 학습</dt>
          <dd>
            {stats.today}
            <span className={styles.unit}>개</span>
          </dd>
        </div>
        <div>
          <dt>연속 학습</dt>
          <dd>
            {stats.streak}
            <span className={styles.unit}>일</span>
          </dd>
        </div>
      </dl>
      {storage === 'device' && (
        <p className={styles.notice}>
          로그인하면 기록이 저장돼요{' '}
          <button type="button" className={styles.login} onClick={() => requireLogin()}>
            로그인
          </button>
        </p>
      )}
    </section>
  );
}
