import { DataAsOf } from '../../components/DataAsOf';
import { Icon } from '../../components/Icon';
import type { CompanyCompare } from '../../types';
import { compareSummary } from '../../utils/compareSummary';
import styles from './Compare.module.css';

/**
 * 비교 막대 아래 "한눈에 비교": 한 줄 결론 → 차이 포인트 → 왜 다른가요?(AI 분석이 있을 때만) → 근거
 * API 에 AI 분석(analysis)이 있으면 그것을, 없으면 숫자 규칙 문장(compareSummary)을 보여줘요.
 * 이번에는 AI 분석에 ADK 를 쓰지 않아요. (정해지지 않았어요)
 */
export function CompareSummary({ data }: { data: CompanyCompare }) {
  const { analysis } = data;
  const summary = analysis ?? compareSummary(data.left, data.right);

  return (
    <section className={styles.summary} aria-labelledby="compare-summary-title">
      <div className={styles.summaryHead}>
        <h3 id="compare-summary-title" className={styles.summaryTitle}>
          한눈에 비교
        </h3>
        <span className={styles.summaryKind}>{analysis ? 'AI 분석' : '숫자로 정리'}</span>
      </div>
      <p className={styles.headline}>{summary.headline}</p>
      {summary.points.length > 0 && (
        <ul className={styles.points}>
          {summary.points.map((point) => (
            <li key={point.title}>
              <strong>{point.title}</strong>
              <span>{point.description}</span>
            </li>
          ))}
        </ul>
      )}
      {analysis?.reason && (
        <div className={styles.reason}>
          <p className={styles.reasonTitle}>왜 다른가요?</p>
          <p>{analysis.reason}</p>
        </div>
      )}
      <div className={styles.evidence}>
        <p>
          근거: {data.base_period} · {data.basis} 재무 숫자 ({data.left.name}, {data.right.name})
        </p>
        {analysis && analysis.sources.length > 0 ? (
          <ul className={styles.sources}>
            {analysis.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title} <Icon name="external" size={12} />
                  <span className="visually-hidden">(새 창에서 열려요)</span>
                </a>{' '}
                · <DataAsOf value={source.date} />
              </li>
            ))}
          </ul>
        ) : (
          <p>출처: 금융감독원 DART 공시</p>
        )}
        <p>투자 추천이 아닌, 두 회사를 이해하기 위한 교육용 정리예요.</p>
      </div>
    </section>
  );
}
