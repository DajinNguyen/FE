import { Section } from '../../../components/Section';
import { TermText } from '../../../components/TermText';
import type { ReportSectionProps } from '../sectionTypes';
import styles from './ReportSections.module.css';

const chainLabels = ['비전', '뉴스', '재무 숫자'];

export function ConnectionSection({ report }: ReportSectionProps) {
  return (
    <Section title="세 가지를 이어서 보면">
      <div className={styles.connection}>
        <ol className={styles.chain}>
          {report.connection.chain.map((item, index) => (
            <li key={item} className={styles.chainItem}>
              <span className={styles.chainLabel}>{chainLabels[index] ?? `${index + 1}`}</span>
              <span className={styles.chainText}>
                <TermText text={item} />
              </span>
            </li>
          ))}
        </ol>
        <p className={styles.conclusion}>{report.connection.conclusion}</p>
      </div>
    </Section>
  );
}
