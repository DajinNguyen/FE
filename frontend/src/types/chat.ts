/**
 * 챗봇에 함께 보내는 "지금 보고 있는 화면" 정보 (POST /api/chat 의 context)
 * 이름(company_name 등)은 대화창 위 "지금 보고 있는 화면: …" 표시용이에요.
 */
export type ChatContext =
  | { page: 'main' }
  | { page: 'company'; tab: string; stock_code: string; company_name: string }
  | { page: 'industry'; industry_id: string; industry_name?: string }
  | { page: 'learn'; term_id?: string }
  | { page: 'report'; stock_code: string; report_id: string | null; company_name?: string }
  | {
      page: 'compare';
      left_code: string;
      right_code: string;
      left_name?: string;
      right_name?: string;
    }
  /** 위에 없는 화면 (관심 기업·거래 순위 등) */
  | { page: 'other' };

export type ChatPage = ChatContext['page'];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** sending: 보내는 중, streaming: 답변이 이어서 오는 중, failed: 답변을 받지 못했어요 */
  status: 'sending' | 'streaming' | 'done' | 'failed';
}

/** POST /api/chat */
export interface ChatRequest {
  message: string;
  context: ChatContext;
  /** 첫 질문이면 null, 이어서 물으면 서버가 준 id */
  conversation_id: string | null;
}

export interface ChatResponse {
  answer: string;
  conversation_id: string;
  /** 5 ADK 를 뺀 뒤 잔액 (답변을 만든 뒤에만 빼요) */
  balance: number;
}
