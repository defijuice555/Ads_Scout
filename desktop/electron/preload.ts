import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  checkPython: () => ipcRenderer.invoke('check-python'),
  runAnalysis: (args: Record<string, string>) => ipcRenderer.invoke('run-analysis', args),
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveHistoryEntry: (entry: unknown) => ipcRenderer.invoke('save-history-entry', entry),
  deleteHistoryEntry: (timestamp: string) => ipcRenderer.invoke('delete-history-entry', timestamp),
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate', (_event, path) => callback(path));
  },
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key),
  getAiConfig: () => ipcRenderer.invoke('get-ai-config'),
  saveAiConfig: (config: Record<string, string>) => ipcRenderer.invoke('save-ai-config', config),
  runAiStrategies: (analysisResult: unknown) => ipcRenderer.invoke('run-ai-strategies', analysisResult),
  platform: process.platform,
});
