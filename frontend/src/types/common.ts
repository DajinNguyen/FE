/** 지표 상태: 좋음 / 보통 / 주의 */
export type Status = 'good' | 'normal' | 'caution';

/**
 * 아직 공식 자료로 확인하지 않은 값은 is_sample: true 로 내려와요.
 * 화면에서는 값 옆에 "예시 값" 배지를 붙여요.
 */
export interface SampleNumber {
  value: number;
  is_sample: boolean;
}
