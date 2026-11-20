import type { MockOrderSide } from '../../types';

/** 보유 종목의 [매수]·[매도] 버튼이 주문 칸에 넘기는 요청. 같은 버튼을 다시 눌러도 적용되게 nonce 를 붙여요 */
export interface OrderRequest {
  stock_code: string;
  name: string;
  side: MockOrderSide;
  /** 지금 가격 (보유 종목 화면에서 아는 값. 주문 칸은 더 최신 값을 받아오기 전에 이걸 보여줘요) */
  price: number;
  nonce: number;
}
