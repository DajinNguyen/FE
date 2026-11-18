import { PRIVACY, TERMS } from '../config/legal';
import styles from './LegalPage.module.css';

/** 이용약관·개인정보 처리방침 (로그인 없이 읽을 수 있어요) */
export function LegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
  const doc = kind === 'terms' ? TERMS : PRIVACY;
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>{doc.title}</h1>
      <p className={styles.updated}>시행일 {doc.updatedAt}</p>
      {doc.sections.map((section) => (
        <section key={section.title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{section.title}</h2>
          {section.body.map((text) => (
            <p key={text} className={styles.paragraph}>
              {text}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
