import { app, BrowserWindow } from 'electron';
import path from 'path';

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  }

  // TODO (Task 3): Add IPC handlers for Python CLI bridge
  // - ipcMain.handle('run-analysis', ...) to spawn Python process
  // - ipcMain.handle('get-history', ...) to read past results
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
