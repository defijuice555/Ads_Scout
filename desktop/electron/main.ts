import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

// Register IPC handlers at top level (before app.whenReady)
ipcMain.handle('run-analysis', async (_event, args: {
  keyword: string;
  product: string;
  audience: string;
  benefit: string;
  region: string;
}) => {
  const scriptPath = path.resolve(__dirname, '../../main.py');
  const cwd = path.resolve(__dirname, '../..');

  const spawnArgs = [
    scriptPath,
    '--keyword', args.keyword,
    '--product', args.product,
    '--audience', args.audience,
    '--benefit', args.benefit,
    '--region', args.region,
    '--format', 'json',
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn('python3', spawnArgs, { cwd });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch {
          reject(new Error(`Failed to parse Python output: ${stdout.slice(0, 500)}`));
        }
      } else {
        reject(new Error(stderr || `Python process exited with code ${code}`));
      }
    });

    proc.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(new Error('Python not found. Please install Python 3 and ensure python3 is on your PATH.'));
      } else {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      }
    });
  });
});

function getHistoryPath(): string {
  const dir = path.join(os.homedir(), '.ads-scout');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'history.json');
}

function readHistory(): unknown[] {
  const p = getHistoryPath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return [];
  }
}

function writeHistory(entries: unknown[]): void {
  fs.writeFileSync(getHistoryPath(), JSON.stringify(entries, null, 2));
}

ipcMain.handle('get-history', async () => readHistory());

ipcMain.handle('save-history-entry', async (_event, entry: unknown) => {
  const history = readHistory();
  history.unshift(entry);
  writeHistory(history);
});

ipcMain.handle('delete-history-entry', async (_event, timestamp: string) => {
  const history = readHistory();
  const filtered = history.filter((e: unknown) => (e as { timestamp: string }).timestamp !== timestamp);
  writeHistory(filtered);
});

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
