import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>궁금한 회사를 쉽게 알아봐요</h1>
        <p className={styles.subtitle}>
          어려운 재무제표와 뉴스를 AI가 쉬운 말로 풀어 드려요. 투자 추천이 아니라, 회사를 이해하는
          데 집중해요.
        </p>
      </section>
    </div>
  );
}
