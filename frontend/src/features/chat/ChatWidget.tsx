import { MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { sendChatMessage } from '../../api/chat';
import { ApiError } from '../../api/errors';
import { Sheet } from '../../components/Sheet';
import { TermText } from '../../components/TermText';
import { chatSuggestions } from '../../config/chatSuggestions';
import { ADK_COST, ADK_NOTICE, ADK_SHORTAGE_TEXT, formatAdk } from '../../config/currency';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import { onUserDataReset } from '../../hooks/userData';
import { useWallet } from '../../hooks/useWallet';
import type { ChatMessage } from '../../types';
import { chatContextLabel } from './chatContextLabel';
import { ChatSources } from './ChatSources';
import { useCurrentChatContext } from './chatContextStore';
import styles from './Chat.module.css';

export const CHAT_FAILED_TEXT = '답변을 받지 못해 ADK는 차감되지 않았어요';
const MAX_LENGTH = 300;

let seq = 0;
const nextId = () => `m${(seq += 1)}`;

/**
 * 모든 화면 오른쪽 아래 AI 챗봇. (AppLayout 에 있어서 페이지를 옮겨도 대화가 남아요)
 * PC 오른쪽 패널, 휴대폰 전체 화면. 비로그인은 버튼을 누르면 로그인 시트.
 * 질문 1번 5 ADK, 답변을 받은 뒤에만 빠져요. 로그아웃하면 대화를 비워요.
 */
export function ChatWidget() {
  const wallet = useWallet();
  const requireLogin = useRequireLogin();
  const context = useCurrentChatContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // 로그아웃하면 대화 기록도 비워요 (resetUserData)
  useEffect(
    () =>
      onUserDataReset(() => {
        setMessages([]);
        setConversationId(null);
        setText('');
        setOpen(false);
      }),
    [],
  );

  useEffect(() => {
    listRef.current?.scrollTo?.({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  const cost = ADK_COST.chat;
  const balanceKnown = wallet.balance !== null;
  const shortage = balanceKnown && !wallet.canAfford(cost);
  const waiting = messages.some((m) => m.status === 'sending' || m.status === 'streaming');
  const canSend = wallet.isLoggedIn && balanceKnown && !shortage && !waiting;

  const openChat = () => requireLogin(() => setOpen(true), 'adk');

  const send = async (question: string) => {
    const message = question.trim().slice(0, MAX_LENGTH);
    if (!message || !canSend) return;
    const answerId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: message, status: 'done' },
      { id: answerId, role: 'assistant', text: '', status: 'sending' },
    ]);
    setText('');
    const update = (patch: Partial<ChatMessage>) =>
      setMessages((prev) => prev.map((m) => (m.id === answerId ? { ...m, ...patch } : m)));
    try {
      const res = await sendChatMessage({ message, context, conversation_id: conversationId });
      update({ text: res.answer, status: 'done', sources: res.sources ?? [] });
      setConversationId(res.conversation_id);
      wallet.applyBalance(res.balance);
    } catch (error) {
      update({ text: CHAT_FAILED_TEXT, status: 'failed' });
      if (error instanceof ApiError && error.code === 'INSUFFICIENT_BALANCE') void wallet.refetch();
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(text);
  };

  const newConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <>
      <button
        type="button"
        className={styles.launcher}
        onClick={openChat}
        aria-label="AI에게 물어보기"
        aria-haspopup="dialog"
      >
        <MessageCircle size={24} aria-hidden="true" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="AI에게 물어보기" placement="chat">
        <div className={styles.top}>
          <p className={styles.context}>
            지금 보고 있는 화면: <strong>{chatContextLabel(context)}</strong>
          </p>
          <button
            type="button"
            className={styles.newChat}
            onClick={newConversation}
            disabled={messages.length === 0 || waiting}
          >
            새 대화
          </button>
        </div>

        <div
          ref={listRef}
          className={styles.messages}
          role="log"
          aria-label="대화"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className={styles.intro}>
              <p>지금 보고 있는 화면을 바탕으로 쉬운 말로 설명해 드려요.</p>
              <ul className={styles.suggestions} aria-label="추천 질문">
                {chatSuggestions(context).map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      className={styles.suggestion}
                      onClick={() => void send(q)}
                      disabled={!canSend}
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            messages.map((m) =>
              m.role === 'user' ? (
                <p key={m.id} className={styles.user}>
                  {m.text}
                </p>
              ) : (
                <div key={m.id} className={styles.answer}>
                  {m.status === 'sending' ? (
                    <p className={styles.thinking} role="status">
                      답변을 만들고 있어요…
                    </p>
                  ) : m.status === 'failed' ? (
                    <p className={styles.failed} role="alert">
                      {m.text}
                    </p>
                  ) : (
                    <>
                      <p className={styles.answerText}>
                        <TermText text={m.text} />
                      </p>
                      <ChatSources sources={m.sources} />
                      <p className={styles.disclaimer}>투자 추천이 아닌 교육용 설명이에요</p>
                    </>
                  )}
                </div>
              ),
            )
          )}
        </div>

        {shortage && (
          <p className={styles.shortage} role="note">
            {ADK_SHORTAGE_TEXT}{' '}
            <Link to="/terms" onClick={() => setOpen(false)}>
              낱말퀴즈 풀러 가기
            </Link>
          </p>
        )}
        <form className={styles.form} onSubmit={onSubmit}>
          <label className="visually-hidden" htmlFor="chat-input">
            질문 입력
          </label>
          <input
            id="chat-input"
            className={styles.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="궁금한 걸 물어보세요"
            autoComplete="off"
          />
          <button type="submit" className={styles.send} disabled={!canSend || !text.trim()}>
            보내기 · {formatAdk(cost)}
          </button>
        </form>
        <p className={styles.notice}>
          {wallet.balance !== null && `내 잔액 ${formatAdk(wallet.balance)} · `}
          {ADK_NOTICE}
        </p>
      </Sheet>
    </>
  );
}
