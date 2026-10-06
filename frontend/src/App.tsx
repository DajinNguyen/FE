import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { CompanyPage } from './pages/CompanyPage';
import { HomePage } from './pages/HomePage';
import { TermCardsPage } from './pages/TermCardsPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="companies/:stockCode" element={<CompanyPage />} />
        <Route path="terms" element={<TermCardsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
