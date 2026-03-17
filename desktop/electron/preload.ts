import { contextBridge } from 'electron';

// TODO (Task 3): Expose IPC methods via contextBridge
// e.g. ipcRenderer.invoke('run-analysis', ...), ipcRenderer.invoke('get-history', ...)

contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder — real methods added in Task 3
  platform: process.platform,
});
