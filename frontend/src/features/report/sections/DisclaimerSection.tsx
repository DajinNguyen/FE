import { Section } from '../../../components/Section';
import { TermText } from '../../../components/TermText';
import type { ReportSectionProps } from '../sectionTypes';
import styles from './ReportSections.module.css';

export function DisclaimerSection({ report }: ReportSectionProps) {
  return (
    <Section>
      <div className={styles.disclaimer}>
        <ul className={styles.disclaimerList}>
          {report.disclaimers.map((text) => (
            <li key={text}>
              <TermText text={text} />
            </li>
          ))}
        </ul>
        <p className={styles.dataSources}>데이터 출처: {report.data_sources.join(' · ')}</p>
      </div>
    </Section>
  );
}
