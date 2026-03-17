import { useState, useCallback } from 'react';
import type { AnalysisResult, AnalysisInput } from '../types';

export function usePythonAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (input: AnalysisInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await window.electronAPI.runAnalysis(input);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, runAnalysis };
}
