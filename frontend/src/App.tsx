import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
