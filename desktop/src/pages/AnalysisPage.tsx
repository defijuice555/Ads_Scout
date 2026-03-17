import { useEffect, useRef, useState } from 'react';
import { usePythonAnalysis } from '../hooks/usePythonAnalysis';
import type { AnalysisInput } from '../types';
import InputForm from '../components/InputForm';
import ResultsDashboard from '../components/ResultsDashboard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import { saveAnalysis } from '../lib/storage';

function AnalysisPage(): JSX.Element {
  const { result, loading, error, runAnalysis } = usePythonAnalysis();
  const savedTimestamp = useRef<string | null>(null);
  const lastKeyword = useRef<string>('');
  const lastInput = useRef<AnalysisInput | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [pythonError, setPythonError] = useState<string | null>(null);

  const handleSubmit = (input: AnalysisInput): void => {
    lastKeyword.current = input.keyword;
    lastInput.current = input;
    runAnalysis(input);
  };

  const handleRetry = (): void => {
    if (lastInput.current) {
      runAnalysis(lastInput.current);
    }
  };

  useEffect(() => {
    window.electronAPI.checkPython().then((res) => {
      if (!res.ok) {
        const msg = res.error === 'missing-requests'
          ? 'Python found but "requests" package is missing. Run: pip3 install requests'
          : 'Python 3 not found. Please install Python 3 and ensure python3 is on your PATH.';
        setPythonError(msg);
      }
    });
  }, []);

  useEffect(() => {
    if (result && result.timestamp !== savedTimestamp.current) {
      savedTimestamp.current = result.timestamp;
      saveAnalysis(result);
      mainRef.current?.scrollTo({ top: 0 });
    }
  }, [result]);

  const hasEmptyTrends = result && Object.keys(result.validated_trends).length === 0;

  return (
    <div className="flex h-[calc(100vh-49px)]">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-800 overflow-y-auto p-4">
        <InputForm onSubmit={handleSubmit} loading={loading} />
      </div>
      {/* Main area */}
      <div ref={mainRef} className="flex-1 overflow-y-auto p-6">
        {pythonError && <ErrorBanner message={pythonError} />}
        {error && <ErrorBanner message={error} onRetry={handleRetry} />}

        {loading && <LoadingSkeleton keyword={lastKeyword.current || 'keyword'} />}

        {result && (
          <>
            {hasEmptyTrends && (
              <div className="rounded-xl border border-yellow-700 bg-yellow-900/50 p-4 text-yellow-200 mb-6">
                <p className="font-medium">No trends found</p>
                <p className="text-sm mt-1 opacity-90">
                  The analysis completed but no validated trends were detected. Try broadening
                  your keyword or checking a different region.
                </p>
                <button
                  onClick={handleRetry}
                  className="mt-3 rounded-lg bg-white/10 px-4 py-1.5 text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
            {!hasEmptyTrends && <ResultsDashboard result={result} />}
          </>
        )}

        {!result && !loading && !error && (
          <EmptyState
            title="Ready to Analyze"
            description="Enter your product details and run an analysis to see ethical ad intelligence."
          />
        )}
      </div>
    </div>
  );
}

export default AnalysisPage;
