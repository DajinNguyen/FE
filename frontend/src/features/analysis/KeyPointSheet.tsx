import { Fragment } from 'react';
import { BarChart } from '../../components/BarChart';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { TermText } from '../../components/TermText';
import type { EvidenceKind, KeyPoint } from '../../types';
import { formatSignedPercent } from '../../utils/format';
import { NewsList } from '../news/NewsList';
import { evidenceChipText, keyPointLabel } from './reportMeta';
import styles from './KeyPointSheet.module.css';

interface KeyPointSheetProps {
  point: KeyPoint | null;
  onClose: () => void;
  onEvidence: (kind: EvidenceKind) => void;
}

const changeRate = (from: number, to: number) =>
  from === 0 ? null : ((to - from) / Math.abs(from)) * 100;

/** 핵심 포인트 상세 (모바일은 아래에서, PC는 오른쪽 패널): 숫자 변화 → 이유 → 연도별 막대 → 근거 뉴스·공시 */
export function KeyPointSheet({ point, onClose, onEvidence }: KeyPointSheetProps) {
  const detail = point?.detail;
  const yearly = detail?.yearly ?? [];
  const first = yearly[0];
  const last = yearly.at(-1);
  const unit = last?.unit ?? '';

  return (
    <Sheet
      open={point !== null}
      onClose={onClose}
      placement="side"
      eyebrow={point ? keyPointLabel[point.category] : undefined}
      title={point?.title ?? ''}
    >
      {point && (
        <div className={styles.content}>
          {(point.before || point.after) && (
            <p className={styles.change}>
              {point.before && (
                <span>
                  {point.before.label} {point.before.value}{' '}
                  <span className={styles.period}>({point.before.period})</span>
                </span>
              )}
              {point.before && point.after && <span aria-hidden="true"> → </span>}
              {point.after && (
                <span>
                  {!point.before || point.before.label !== point.after.label
                    ? `${point.after.label} `
                    : ''}
                  <strong>{point.after.value}</strong>{' '}
                  <span className={styles.period}>({point.after.period})</span>
                </span>
              )}
            </p>
          )}

          <dl className={styles.explain}>
            <div>
              <dt>왜 그런가요?</dt>
              <dd>
                <TermText text={point.reason} />
              </dd>
            </div>
            <div>
              <dt>무슨 뜻인가요?</dt>
              <dd>
                <TermText text={point.meaning} />
              </dd>
            </div>
          </dl>

          {yearly.length > 0 && first && last && (
            <section className={styles.block} aria-label="연도별 매출과 영업이익">
              <h3 className={styles.blockTitle}>
                연도별 매출·영업이익 <span className={styles.unit}>단위: {unit}</span>
              </h3>
              {(['revenue', 'operating_income'] as const).map((key) => {
                const label = key === 'revenue' ? '매출' : '영업이익';
                const rate = changeRate(first[key], last[key]);
                return (
                  <div key={key} className={styles.chart}>
                    <p className={styles.chartLabel}>
                      {label}
                      {rate !== null && (
                        <span className={styles.chartChange}>
                          {first.year}년보다 {formatSignedPercent(rate, 1)}
                        </span>
                      )}
                    </p>
                    <BarChart
                      data={yearly.map((row, i) => ({
                        label: `${row.year}년`,
                        value: row[key],
                        highlight: i === yearly.length - 1,
                      }))}
                      formatValue={(v) => `${v.toLocaleString('ko-KR')}`}
                      ariaLabel={`연도별 ${label} ${yearly.map((row) => `${row.year}년 ${row[key]}${unit}`).join(', ')}`}
                      height={170}
                    />
                  </div>
                );
              })}
            </section>
          )}

          {point.evidence.length > 0 && (
            <p className={styles.evidence}>
              <span className={styles.evidenceLabel}>근거</span>
              {point.evidence.map((ref, i) => (
                <Fragment key={`${ref.type}-${ref.label}-${ref.date}`}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <button
                    type="button"
                    className={styles.evidenceLink}
                    onClick={() => {
                      onClose();
                      onEvidence(ref.type);
                    }}
                  >
                    {evidenceChipText(ref)}
                  </button>
                </Fragment>
              ))}
            </p>
          )}

          {detail && detail.related_news.length > 0 && (
            <section className={styles.block} aria-label="근거 뉴스">
              <h3 className={styles.blockTitle}>근거 뉴스</h3>
              <NewsList items={detail.related_news} compact label="근거 뉴스 목록" />
            </section>
          )}

          {detail && detail.related_disclosures.length > 0 && (
            <section className={styles.block} aria-label="근거 공시">
              <h3 className={styles.blockTitle}>근거 공시</h3>
              <ul className={styles.disclosures}>
                {detail.related_disclosures.map((item) => (
                  <li key={`${item.title}-${item.date}`}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.title} <Icon name="external" size={14} />
                      <span className="visually-hidden">(새 창에서 열려요)</span>
                    </a>
                    <span className={styles.date}>{item.date.replaceAll('-', '.')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
}
