import { formatPrice } from '../../utils/format';

/** 오르면 빨강(rise), 내리면 파랑(fall), 같으면 기본 색 */
export type Tone = 'rise' | 'fall' | 'flat';
export const toneOf = (value: number | null | undefined): Tone =>
  !value ? 'flat' : value > 0 ? 'rise' : 'fall';

/** 1234567.4 → "1,234,567원" */
export const formatWon = (value: number) => formatPrice(Math.round(value));

/** +12,300원 / -5,000원 / 0원 */
export const formatSignedWon = (value: number) => {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : rounded < 0 ? '-' : ''}${formatPrice(Math.abs(rounded))}`;
};

/** +3.25% / -1.10% / 0.00% */
export const formatRate = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

/** 색만으로 구분하지 않게 화면 읽기 프로그램용 말 */
export const toneWords = (value: number) =>
  value > 0 ? '올랐어요' : value < 0 ? '내렸어요' : '같아요';
