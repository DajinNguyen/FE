import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { CompanyPage } from './pages/CompanyPage';
import { CrosswordListPage } from './pages/CrosswordListPage';
import { CrosswordPage } from './pages/CrosswordPage';
import { HomePage } from './pages/HomePage';
import { TermCardsPage } from './pages/TermCardsPage';
import { TradingRankingPage } from './pages/TradingRankingPage';
import { WatchlistPage } from './pages/WatchlistPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="companies/:stockCode" element={<CompanyPage />} />
        <Route path="rankings/trading" element={<TradingRankingPage />} />
        <Route path="terms" element={<TermCardsPage />} />
        <Route path="learn/crossword" element={<CrosswordListPage />} />
        <Route path="learn/crossword/:puzzleId" element={<CrosswordPage />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
