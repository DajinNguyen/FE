import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { chatSuggestions } from '../src/config/chatSuggestions';
import { chatContextLabel } from '../src/features/chat/chatContextLabel';
import { useCurrentChatContext } from '../src/features/chat/chatContextStore';
import { renderWithProviders } from './testUtils';

/** 지금 등록된 화면 정보를 보여주는 확인용 */
function Probe() {
  const context = useCurrentChatContext();
  return (
    <aside aria-label="챗봇 화면 정보">
      <p data-testid="label">{chatContextLabel(context)}</p>
      <p data-testid="json">{JSON.stringify(context)}</p>
      <ul>
        {chatSuggestions(context).map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
    </aside>
  );
}

const open = (route: string) =>
  renderWithProviders(
    <>
      <App />
      <Probe />
    </>,
    { route },
  );
const label = () => screen.getByTestId('label').textContent;
const context = () => JSON.parse(screen.getByTestId('json').textContent ?? '{}');
const suggestions = () =>
  screen.getByRole('complementary', { name: '챗봇 화면 정보' }).querySelectorAll('li');

describe('챗봇 페이지 인식 (ChatContext)', () => {
  it('메인: { page: "main" } 과 메인 추천 질문 3개', async () => {
    open('/');
    await waitFor(() => expect(label()).toBe('메인'));
    expect(context()).toEqual({ page: 'main' });
    expect(suggestions()).toHaveLength(3);
    expect(suggestions()[0]).toHaveTextContent('오늘 시장은 왜 움직였어요?');
  });

  it('기업 재무 상세: 회사·탭을 알리고 "삼성전자 · 재무 상세"', async () => {
    open('/companies/005930?tab=financials');
    await waitFor(() => expect(label()).toBe('삼성전자 · 재무 상세'));
    expect(context()).toEqual({
      page: 'company',
      tab: 'financials',
      stock_code: '005930',
      company_name: '삼성전자',
    });
    expect(suggestions()[0]).toHaveTextContent('영업이익률이 뭐예요?');
  });

  it('기업 개요는 "이 회사는 뭘로 돈을 벌어요?"', async () => {
    open('/companies/005930');
    await waitFor(() => expect(label()).toBe('삼성전자 · 개요'));
    expect(suggestions()[0]).toHaveTextContent('이 회사는 뭘로 돈을 벌어요?');
  });

  it('AI 분석에 리포트가 있으면 { page: "report", report_id }', async () => {
    open('/companies/005930?tab=analysis');
    await waitFor(() => expect(context().page).toBe('report'));
    expect(context()).toMatchObject({ stock_code: '005930', company_name: '삼성전자' });
    expect(label()).toBe('삼성전자 · AI 분석');
  });

  it('비교하기는 두 회사를 알려요', async () => {
    open('/companies/005930?tab=compare&with=000660');
    await waitFor(() => expect(label()).toBe('SK하이닉스 vs 삼성전자 · 비교하기'));
    expect(context()).toMatchObject({ page: 'compare', left_code: '000660', right_code: '005930' });
    expect(suggestions()[0]).toHaveTextContent('두 회사의 가장 큰 차이가 뭐예요?');
  });

  it('산업·용어 학습·그 밖의 화면', async () => {
    const industry = open('/industries/semiconductor');
    await waitFor(() =>
      expect(context()).toMatchObject({ page: 'industry', industry_id: 'semiconductor' }),
    );
    await waitFor(() => expect(label()).toMatch(/산업$/));
    industry.unmount();

    const learn = open('/terms');
    await waitFor(() => expect(label()).toBe('용어 학습'));
    expect(suggestions()[0]).toHaveTextContent('이 용어를 예시로 설명해 줘');
    learn.unmount();

    open('/watchlist');
    await waitFor(() => expect(context()).toEqual({ page: 'other' }));
  });
});
