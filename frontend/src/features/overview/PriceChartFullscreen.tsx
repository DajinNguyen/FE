import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { PriceChange } from '../../components/PriceChange';
import { PriceChart } from '../../components/PriceChart';
import { SegmentedControl } from '../../components/SegmentedControl';
import { FULL_RANGES, type FullRange } from '../../config/priceChart';
import { useCompany } from '../../hooks/useCompanies';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import { formatPrice } from '../../utils/format';
import { getPeriodRate } from '../../utils/trend';
import type { PricePoint } from '../../types';
import styles from './PriceChartFullscreen.module.css';

/** 그래프 칸에서 가격 칸을 뺀 나머지 (정보 줄·날짜 줄·거래량 칸) 높이 (px) */
const CHART_CHROME = 150;
const MIN_PRICE_HEIGHT = 200;

/** 고른 기간에 드는 캔들: 1일은 가장 최근 거래일, 그 밖에는 마지막 날에서 days 일 안 */
function rangePoints(points: PricePoint[], days: number | null) {
  const lastDate = points.at(-1)?.date;
  if (!lastDate || days === null) return points;
  if (days === 1) return points.filter((p) => p.date === lastDate);
  const from = new Date(Date.parse(lastDate) - days * 86_400_000).toISOString().slice(0, 10);
  return points.filter((p) => p.date > from);
}

/**
 * 차트 크게 보기: 화면 전체에 그래프를 크게 띄우고, 아래에서 기간(1일~전체)을 골라요.
 * 그래프를 끌면 지난 기간이 보여요.
 * Esc·닫기 버튼으로 닫으면 크게 보기 버튼으로 초점이 돌아가요.
 */
export function PriceChartFullscreen({
  stockCode,
  onClose,
}: {
  stockCode: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<FullRange>('1d');
  const [priceHeight, setPriceHeight] = useState(360);
  const option = FULL_RANGES.find((r) => r.value === range)!;
  const { interval } = option;
  const { data: company } = useCompany(stockCode);
  // 지난 기간까지 길게 받아 두고, 고른 기간만큼을 먼저 보여 줘요 (1달~1년은 같은 자료를 함께 써요)
  const { data, isPending, isError, error, refetch } = usePriceHistory(
    stockCode,
    option.fetch,
    interval,
  );

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [onClose]);

  // 남은 높이를 재서 가격 칸을 꽉 채워요 (창 크기를 바꾸면 다시)
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const measure = () => {
      if (area.clientHeight > 0) {
        setPriceHeight(Math.max(MIN_PRICE_HEIGHT, area.clientHeight - CHART_CHROME));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  const points = data?.points ?? [];
  const last = points.at(-1);
  const inRange = rangePoints(points, option.days);
  const rate = getPeriodRate(inRange);
  // 다른 기간을 받는 동안에는 예전 그래프가 남아 있어요 (keepPreviousData)
  const shownInterval = data?.interval ?? interval;

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {company?.name ?? stockCode}
          <span className="visually-hidden"> 차트 크게 보기</span>
        </h2>
        {last && (
          <p className={styles.price}>
            <strong>{formatPrice(last.close)}</strong>
            {rate !== undefined && (
              <span className={styles.rate}>
                {option.label} 동안 <PriceChange rate={rate} size="sm" />
              </span>
            )}
          </p>
        )}
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="차트 크게 보기 닫기"
        >
          <Icon name="close" size={22} />
        </button>
      </header>

      <div ref={areaRef} className={styles.area}>
        {isPending && <div className={styles.placeholder} aria-hidden="true" />}
        {isError && !data && (
          <ErrorState
            compact
            title="주가를 불러오지 못했어요"
            error={error}
            onRetry={() => refetch()}
          />
        )}
        {data && points.length === 0 && (
          <p className={styles.empty}>이 기간의 주가 자료가 아직 없어요.</p>
        )}
        {points.length > 0 && (
          <PriceChart
            points={points}
            height={priceHeight}
            interval={shownInterval}
            windowSize={Math.max(inRange.length, 1)}
          />
        )}
      </div>

      <footer className={styles.footer}>
        <SegmentedControl label="기간" options={FULL_RANGES} value={range} onChange={setRange} />
      </footer>
    </div>,
    document.body,
  );
}
