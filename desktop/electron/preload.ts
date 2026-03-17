import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  runAnalysis: (args: Record<string, string>) => ipcRenderer.invoke('run-analysis', args),
  platform: process.platform,
});
