import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { ChatSources } from '../src/features/chat/ChatSources';
import { safeSourceUrl } from '../src/utils/safeUrl';
import { renderWithProviders } from './testUtils';

describe('챗봇 답변 출처', () => {
  it('답변 아래에 근거 기사를 원문 링크(새 창)로 보여줘요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/companies/005930?tab=financials', user: DEV_USER });
    await screen.findByRole('button', { name: '내 앰똥깡 50 ADK' });
    await user.click(screen.getByRole('button', { name: 'AI에게 물어보기' }));
    const dialog = screen.getByRole('dialog', { name: 'AI에게 물어보기' });
    await user.click(within(dialog).getByRole('button', { name: '영업이익률이 뭐예요?' }));

    const sources = await within(dialog).findByRole('list', { name: '답변 출처' });
    const link = within(sources).getByRole('link', { name: /삼성전자 3분기 영업이익 늘어/ });
    expect(link).toHaveAttribute('href', 'https://news.example.com/articles/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(sources).toHaveTextContent('다진일보 · 11월 11일');
  });

  it('출처가 없으면(빈 배열·칸 없음) 아무것도 그리지 않아요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/', user: DEV_USER });
    await screen.findByRole('button', { name: '내 앰똥깡 50 ADK' });
    await user.click(screen.getByRole('button', { name: 'AI에게 물어보기' }));
    const dialog = screen.getByRole('dialog', { name: 'AI에게 물어보기' });
    await user.type(within(dialog).getByLabelText('질문 입력'), '코스피가 뭐예요?');
    await user.click(within(dialog).getByRole('button', { name: '보내기 · 5 ADK' }));
    await within(dialog).findByText(/지금 화면을 기준으로/);
    expect(within(dialog).queryByRole('list', { name: '답변 출처' })).not.toBeInTheDocument();

    const { container } = render(<ChatSources />);
    expect(container).toBeEmptyDOMElement();
  });

  it('http·https 가 아닌 주소는 링크로 만들지 않아요', () => {
    expect(safeSourceUrl('https://dart.fss.or.kr/x')).toBe('https://dart.fss.or.kr/x');
    expect(safeSourceUrl('javascript:alert(1)')).toBeNull();
    expect(safeSourceUrl('not a url')).toBeNull();

    render(
      <ChatSources
        sources={[
          { title: '나쁜 링크', url: 'javascript:alert(1)' },
          { title: '공시 원문', press: 'DART', date: null, url: 'https://dart.fss.or.kr/x' },
        ]}
      />,
    );
    expect(screen.queryByText('나쁜 링크')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /공시 원문/ })).toBeInTheDocument();
    expect(screen.getByText('DART')).toBeInTheDocument();
  });
});
