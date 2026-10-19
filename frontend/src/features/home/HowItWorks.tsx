import styles from './HowItWorks.module.css';

const steps = [
  { title: '기업 검색', description: '궁금한 회사 이름을 입력해요' },
  { title: 'AI 핵심 분석', description: '어떤 회사이고 지금 어떤 상황인지 5가지로 정리해요' },
  { title: '근거 확인', description: '재무제표·뉴스·기업 비전에서 이유를 확인해요' },
];

/** 다진이 하는 일 3단계 (가로 한 줄, 작게) */
export function HowItWorks() {
  return (
    <ol className={styles.steps} aria-label="다진이 하는 일">
      {steps.map((step, index) => (
        <li key={step.title} className={styles.step}>
          <span className={styles.number} aria-hidden="true">
            {index + 1}
          </span>
          <span>
            <strong className={styles.title}>{step.title}</strong>
            <span className={styles.description}>{step.description}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
