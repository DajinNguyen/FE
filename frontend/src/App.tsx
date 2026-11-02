import { Navigate, Route, Routes, useParams } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { CompanyPage } from './pages/CompanyPage';
import { HomePage } from './pages/HomePage';
import { IndustryPage } from './pages/IndustryPage';
import { TermCardsPage } from './pages/TermCardsPage';
import { TradingRankingPage } from './pages/TradingRankingPage';
import { WatchlistPage } from './pages/WatchlistPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="companies/:stockCode" element={<CompanyPage />} />
        {/* 커뮤니티는 기업 화면 탭 안에서 바로 댓글을 써요. 예전 글쓰기·글 보기 주소는 탭으로 보내요. */}
        <Route path="companies/:stockCode/community/*" element={<CommunityRedirect />} />
        <Route path="industries/:industryId" element={<IndustryPage />} />
        <Route path="rankings/trading" element={<TradingRankingPage />} />
        <Route path="terms" element={<TermCardsPage />} />
        {/* 낱말퀴즈는 용어 카드 화면 안에서 해요. 예전 주소는 그쪽으로 보내요. */}
        <Route path="learn/crossword" element={<Navigate to="/terms" replace />} />
        <Route path="learn/crossword/:puzzleId" element={<CrosswordRedirect />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function CommunityRedirect() {
  const { stockCode = '' } = useParams();
  return <Navigate to={`/companies/${stockCode}?tab=community`} replace />;
}

function CrosswordRedirect() {
  const { puzzleId = '' } = useParams();
  return <Navigate to={`/terms?mode=crossword&puzzle=${puzzleId}`} replace />;
}
