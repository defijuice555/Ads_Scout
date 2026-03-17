import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';

function MenuNavigationListener(): null {
  const navigate = useNavigate();

  useEffect(() => {
    window.electronAPI.onNavigate?.((path) => {
      navigate(path);
    });
  }, [navigate]);

  return null;
}

function NavBar(): JSX.Element {
  const location = useLocation();
  const isActive = (p: string): boolean => location.pathname === p;

  return (
    <nav className="flex items-center gap-6 border-b border-gray-800 px-6 py-3">
      <span className="text-lg font-bold text-indigo-400">Ads Scout</span>
      <Link
        to="/"
        className={`text-sm ${isActive('/') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
      >
        Analysis
      </Link>
      <Link
        to="/history"
        className={`text-sm ${isActive('/history') ? 'text-white' : 'text-gray-400 hover:text-white'}`}
      >
        History
      </Link>
    </nav>
  );
}

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <MenuNavigationListener />
      <div className="min-h-screen bg-gray-950 text-white">
        <NavBar />
        <Routes>
          <Route path="/" element={<AnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
