import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

const renderCompanyPage = () =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: '/companies/005930' },
  );

describe('기업 화면: 그래프 먼저, AI 리포트는 버튼을 눌러야 작성', () => {
  it('처음에는 차트 탭(주가·재무제표 그래프)을 보여주고, 리포트는 아직 만들지 않아요', async () => {
    renderCompanyPage();

    expect(await screen.findByRole('tab', { name: '차트', selected: true })).toBeInTheDocument();
    expect(await screen.findByText('재무제표 한눈에')).toBeInTheDocument();
    expect(screen.getByText('주가 흐름')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: '리포트 생성 단계' })).not.toBeInTheDocument();
  });

  it('"AI 리포트 작성"을 누르면 AI 리포트 탭으로 가서 생성을 시작해요', async () => {
    const user = userEvent.setup();
    renderCompanyPage();

    // 좁은 화면용(회사 정보 옆)과 넓은 화면용(사이드바) 버튼이 같은 동작을 해요.
    const [cta] = await screen.findAllByRole('button', { name: 'AI 리포트 작성' });
    await waitFor(() => expect(cta).toBeEnabled());
    await user.click(cta);

    expect(screen.getByRole('tab', { name: 'AI 리포트', selected: true })).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: '리포트 생성 단계' })).toBeInTheDocument();
  });
});
