import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        <nav className="flex items-center gap-6 border-b border-gray-800 px-6 py-3">
          <span className="text-lg font-bold text-indigo-400">Ads Scout</span>
          <Link to="/" className="text-sm text-gray-300 hover:text-white">
            Analysis
          </Link>
          <Link to="/history" className="text-sm text-gray-300 hover:text-white">
            History
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<AnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
