import { useEffect, useRef } from 'react';
import { usePythonAnalysis } from '../hooks/usePythonAnalysis';
import InputForm from '../components/InputForm';
import ResultsDashboard from '../components/ResultsDashboard';
import { saveAnalysis } from '../lib/storage';

function AnalysisPage(): JSX.Element {
  const { result, loading, error, runAnalysis } = usePythonAnalysis();
  const savedTimestamp = useRef<string | null>(null);

  useEffect(() => {
    if (result && result.timestamp !== savedTimestamp.current) {
      savedTimestamp.current = result.timestamp;
      saveAnalysis(result);
    }
  }, [result]);

  return (
    <div className="flex h-[calc(100vh-49px)]">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-800 overflow-y-auto p-4">
        <InputForm onSubmit={runAnalysis} loading={loading} />
      </div>
      {/* Main area */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="rounded-lg bg-red-900/50 border border-red-700 p-4 text-red-200">
            {error}
          </div>
        )}
        {loading && <p className="text-gray-400">Analyzing...</p>}
        {result && <ResultsDashboard result={result} />}
        {!result && !loading && !error && (
          <div className="flex items-center justify-center h-full text-gray-500">
            Enter your product details and run an analysis
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalysisPage;
