/** 128500 → "128,500원" */
export function formatPrice(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

/** 258.94 → "258.94조 원", 44 → "44.0조 원" */
export function formatTrillion(value: number, fractionDigits: { min?: number; max?: number } = {}) {
  const { min = 1, max = 2 } = fractionDigits;
  return `${value.toLocaleString('ko-KR', { minimumFractionDigits: min, maximumFractionDigits: max })}조 원`;
}

/** 1.82 → "+1.82%" */
export function formatSignedPercent(value: number, digits = 2) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}
