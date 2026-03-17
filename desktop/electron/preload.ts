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
  platform: process.platform,
});
