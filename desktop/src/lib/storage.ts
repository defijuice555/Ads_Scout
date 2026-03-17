import type { AnalysisResult } from '../types';

export async function loadHistory(): Promise<AnalysisResult[]> {
  return window.electronAPI.getHistory();
}

export async function saveAnalysis(result: AnalysisResult): Promise<void> {
  return window.electronAPI.saveHistoryEntry(result);
}

export async function deleteAnalysis(timestamp: string): Promise<void> {
  return window.electronAPI.deleteHistoryEntry(timestamp);
}
