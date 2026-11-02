/** 지표 색: 좋은 쪽 / 보통 / 주의 (글자는 높은 편·보통·낮은 편) */
export type Status = 'good' | 'normal' | 'caution';

/** 서버가 주는 숫자 하나 (지표 값) */
export interface SampleNumber {
  value: number;
}
