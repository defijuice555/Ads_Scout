import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';

// Python environment check
ipcMain.handle('check-python', async () => {
  return new Promise((resolve) => {
    const proc = spawn('python3', ['-c', 'import requests; print("ok")'], {
      timeout: 5000,
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0 && stdout.trim() === 'ok') {
        resolve({ ok: true });
      } else {
        resolve({
          ok: false,
          error: stderr.includes('No module named') ? 'missing-requests' : 'python-not-found',
          detail: stderr,
        });
      }
    });
    proc.on('error', () => {
      resolve({ ok: false, error: 'python-not-found' });
    });
  });
});

// Register IPC handlers at top level (before app.whenReady)
ipcMain.handle('run-analysis', async (_event, args: {
  keyword: string;
  product: string;
  audience: string;
  benefit: string;
  region: string;
  state?: string;
  city?: string;
}) => {
  const scriptPath = app.isPackaged
    ? path.join(process.resourcesPath, 'python', 'main.py')
    : path.resolve(__dirname, '../../main.py');
  const cwd = app.isPackaged
    ? path.join(process.resourcesPath, 'python')
    : path.resolve(__dirname, '../..');

  const spawnArgs = [
    scriptPath,
    '--keyword', args.keyword,
    '--product', args.product,
    '--audience', args.audience,
    '--benefit', args.benefit,
    '--region', args.region,
    '--format', 'json',
  ];

  if (args.state) {
    spawnArgs.push('--state', args.state);
  }
  if (args.city) {
    spawnArgs.push('--city', args.city);
  }

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

// API key management
function getConfigPath(): string {
  const dir = path.join(os.homedir(), '.ads-scout');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'config.json');
}

function readConfig(): Record<string, unknown> {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};
  try { return JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch { return {}; }
}

function writeConfig(data: Record<string, unknown>): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(data, null, 2));
}

ipcMain.handle('get-ai-config', async () => {
  const data = readConfig();
  const provider = (data.llm_provider as string) || 'anthropic';
  const keyMap: Record<string, string> = {
    anthropic: 'anthropic_api_key',
    openai: 'openai_api_key',
    minimax: 'minimax_api_key',
  };
  return {
    provider,
    hasKey: !!(data[keyMap[provider]] as string),
    anthropicKey: !!(data.anthropic_api_key as string),
    openaiKey: !!(data.openai_api_key as string),
    minimaxKey: !!(data.minimax_api_key as string),
  };
});

ipcMain.handle('save-ai-config', async (_event, config: {
  provider?: string;
  anthropic_api_key?: string;
  openai_api_key?: string;
  minimax_api_key?: string;
}) => {
  const data = readConfig();
  if (config.provider) data.llm_provider = config.provider;
  if (config.anthropic_api_key !== undefined) data.anthropic_api_key = config.anthropic_api_key;
  if (config.openai_api_key !== undefined) data.openai_api_key = config.openai_api_key;
  if (config.minimax_api_key !== undefined) data.minimax_api_key = config.minimax_api_key;
  writeConfig(data);
});

// Legacy compat
ipcMain.handle('get-api-key', async () => {
  const data = readConfig();
  const provider = (data.llm_provider as string) || 'anthropic';
  const keyMap: Record<string, string> = { anthropic: 'anthropic_api_key', openai: 'openai_api_key', minimax: 'minimax_api_key' };
  return { key: (data[keyMap[provider]] as string) || null, provider };
});

ipcMain.handle('save-api-key', async (_event, key: string) => {
  const data = readConfig();
  const provider = (data.llm_provider as string) || 'anthropic';
  const keyMap: Record<string, string> = { anthropic: 'anthropic_api_key', openai: 'openai_api_key', minimax: 'minimax_api_key' };
  data[keyMap[provider]] = key;
  writeConfig(data);
});

// AI Strategy generation (3 agents)
ipcMain.handle('run-ai-strategies', async (_event, analysisResult: unknown) => {
  const scriptPath = app.isPackaged
    ? path.join(process.resourcesPath, 'python', 'agents_runner.py')
    : path.resolve(__dirname, '../../agents_runner.py');
  const cwd = app.isPackaged
    ? path.join(process.resourcesPath, 'python')
    : path.resolve(__dirname, '../..');

  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [scriptPath], { cwd });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    // Send analysis JSON via stdin
    proc.stdin.write(JSON.stringify(analysisResult));
    proc.stdin.end();

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error(`Failed to parse agent output: ${stdout.slice(0, 500)}`));
        }
      } else {
        // Exit code 1 with valid JSON means a controlled error (e.g., no API key)
        try {
          const errResult = JSON.parse(stdout);
          if (errResult.error) {
            resolve(errResult);
            return;
          }
        } catch { /* not JSON */ }
        reject(new Error(stderr || `Agent process exited with code ${code}`));
      }
    });

    proc.on('error', (err: NodeJS.ErrnoException) => {
      reject(new Error(`Failed to start agent process: ${err.message}`));
    });
  });
});

function createMenu(win: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New Analysis', accelerator: 'CmdOrCtrl+N', click: () => win.webContents.send('navigate', '/') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Analysis', accelerator: 'CmdOrCtrl+1', click: () => win.webContents.send('navigate', '/') },
        { label: 'History', accelerator: 'CmdOrCtrl+2', click: () => win.webContents.send('navigate', '/history') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About Ads Scout',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'About Ads Scout',
              message: 'Ads Scout — Ethical Ad Intelligence',
              detail: 'Analyze advertising trends ethically. Never copies ads — analyzes generalized patterns for original creative inspiration.',
            });
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');

  const win = new BrowserWindow({
    title: 'Ads Scout — Ethical Ad Intelligence',
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f172a',
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: { x: 15, y: 15 } }
      : {}),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  createMenu(win);

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
