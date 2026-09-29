import type { ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}

/** 탭 안의 한 덩어리. 제목 + 내용 */
export function Section({ title, description, action, children, id }: SectionProps) {
  return (
    <section className={styles.section} id={id}>
      {(title || action) && (
        <div className={styles.head}>
          <div>
            {title && <h2 className={styles.title}>{title}</h2>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
