import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  screen,
  Tray
} from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AppStatePayload,
  AquaSettings,
  DailyHistory
} from '../src/shared/types';
import {
  createEmptyDay,
  DEFAULT_SETTINGS,
  formatLocalDateKey,
  sanitizeSettings
} from '../src/core/settings';
import { ReminderScheduler } from '../src/core/scheduler';

interface PersistedData {
  settings: AquaSettings;
  history: Record<string, DailyHistory>;
}

const OVERLAY_HEIGHT = 720;
let companionWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let testPreviewActive = false;
let scheduler: ReminderScheduler;
let schedulerInterval: NodeJS.Timeout | null = null;

function getStoragePath(): string {
  return path.join(app.getPath('userData'), 'aquabuddy-store.json');
}

function loadStore(): PersistedData {
  try {
    const file = getStoragePath();
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<PersistedData>;
      return {
        settings: sanitizeSettings(parsed.settings),
        history: parsed.history ?? {}
      };
    }
  } catch (err) {
    console.error('Failed to read store, falling back to defaults:', err);
  }
  return {
    settings: { ...DEFAULT_SETTINGS },
    history: {}
  };
}

let store: PersistedData = {
  settings: { ...DEFAULT_SETTINGS },
  history: {}
};

function saveStore(): void {
  try {
    fs.writeFileSync(getStoragePath(), JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

function getTodayHistory(): DailyHistory {
  const key = formatLocalDateKey();
  if (!store.history[key]) {
    store.history[key] = createEmptyDay(key, store.settings.dailyGoalMl);
    saveStore();
  }
  store.history[key].goalMl = store.settings.dailyGoalMl;
  return store.history[key];
}

function getRecentDays(count = 7): DailyHistory[] {
  const result: DailyHistory[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = formatLocalDateKey(d);
    result.push(store.history[key] ?? createEmptyDay(key, store.settings.dailyGoalMl));
  }
  return result;
}

function buildStatePayload(): AppStatePayload {
  return {
    settings: store.settings,
    todayHistory: getTodayHistory(),
    recentDays: getRecentDays(7),
    reminderActive: scheduler ? scheduler.isReminderActive() : false,
    testPreviewActive,
    nextReminderTimestamp: scheduler ? scheduler.getNextReminderTimestamp() : null
  };
}

function broadcastState(): void {
  const payload = buildStatePayload();
  companionWindow?.webContents.send('aqua:state-changed', payload);
  settingsWindow?.webContents.send('aqua:state-changed', payload);
  rebuildTrayMenu();
}

function positionCompanionAboveTaskbar(): void {
  if (!companionWindow || companionWindow.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.workArea;
  const targetHeight = Math.min(OVERLAY_HEIGHT, height);

  companionWindow.setBounds({
    x,
    y: y + height - targetHeight,
    width,
    height: targetHeight
  });
}

function createCompanionWindow(): void {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.workArea;
  const targetHeight = Math.min(OVERLAY_HEIGHT, height);

  companionWindow = new BrowserWindow({
    x,
    y: y + height - targetHeight,
    width,
    height: targetHeight,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  companionWindow.setAlwaysOnTop(true, 'screen-saver');
  companionWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  companionWindow.setIgnoreMouseEvents(true, { forward: true });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    companionWindow.loadURL(`${devUrl}#/companion`);
  } else {
    companionWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/companion'
    });
  }
}

function openSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 960,
    height: 820,
    minWidth: 820,
    minHeight: 660,
    title: 'AquaBuddy Studio Dashboard',
    autoHideMenuBar: true,
    backgroundColor: '#0b1120',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    settingsWindow.loadURL(`${devUrl}#/settings`);
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/settings'
    });
  }

  settingsWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      settingsWindow?.hide();
    }
  });
}

function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <path d="M16 3 C16 3 6 15 6 21 C6 26.5 10.5 30 16 30 C21.5 30 26 26.5 26 21 C26 15 16 3 16 3 Z" fill="#38bdf8"/>
      <circle cx="12.5" cy="19" r="1.8" fill="#0f172a"/>
      <circle cx="19.5" cy="19" r="1.8" fill="#0f172a"/>
    </svg>
  `;
  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  );
}

function rebuildTrayMenu(): void {
  if (!tray) return;
  const today = getTodayHistory();
  const isEnabled = store.settings.companionEnabled;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `AquaBuddy — ${today.totalMl} / ${today.goalMl} ml today`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: isEnabled ? '🟢 Companion: ON (Click to Turn OFF)' : '⚫ Companion: OFF (Click to Turn ON)',
      click: () => {
        store.settings = sanitizeSettings({
          ...store.settings,
          companionEnabled: !isEnabled,
          isPaused: isEnabled
        });
        saveStore();
        scheduler.updateSettings(store.settings);
        broadcastState();
      }
    },
    {
      label: '👁️ Test Show Companion (Keep Timer Running)',
      click: () => {
        testPreviewActive = true;
        broadcastState();
      }
    },
    {
      label: `✅ Drinked Water (+${store.settings.defaultDrinkMl} ml)`,
      click: () => recordDrink(store.settings.defaultDrinkMl)
    },
    { type: 'separator' },
    {
      label: '⚙️ Open Studio Dashboard',
      click: () => openSettingsWindow()
    },
    { type: 'separator' },
    {
      label: 'Quit AquaBuddy',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip(`AquaBuddy (${today.totalMl}/${today.goalMl} ml)`);
  tray.setContextMenu(contextMenu);
}

function recordDrink(amountMl?: number): AppStatePayload {
  const intake = amountMl ?? store.settings.defaultDrinkMl;
  const today = getTodayHistory();
  today.entries.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    amountMl: intake
  });
  today.totalMl += intake;
  testPreviewActive = false;
  scheduler.completeOrDismiss();
  saveStore();
  broadcastState();
  return buildStatePayload();
}

function syncStartupSetting(enable: boolean): void {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath
    });
  }
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    openSettingsWindow();
  });

  app.whenReady().then(() => {
    store = loadStore();
    scheduler = new ReminderScheduler(store.settings, () => {
      broadcastState();
    });

    createCompanionWindow();

    tray = new Tray(createTrayIcon());
    tray.on('double-click', () => openSettingsWindow());
    rebuildTrayMenu();

    schedulerInterval = setInterval(() => {
      scheduler.tick(new Date());
    }, 1_000);

    screen.on('display-metrics-changed', positionCompanionAboveTaskbar);
    screen.on('display-added', positionCompanionAboveTaskbar);
    screen.on('display-removed', positionCompanionAboveTaskbar);

    ipcMain.handle('aqua:get-state', () => buildStatePayload());

    ipcMain.handle('aqua:update-settings', (_e, partial: Partial<AquaSettings>) => {
      const nextRaw = { ...store.settings, ...partial };
      if (partial.companionEnabled !== undefined) {
        nextRaw.isPaused = !partial.companionEnabled;
      } else if (partial.isPaused !== undefined) {
        nextRaw.companionEnabled = !partial.isPaused;
      }
      store.settings = sanitizeSettings(nextRaw);
      saveStore();
      syncStartupSetting(store.settings.launchOnStartup);
      scheduler.updateSettings(store.settings);
      broadcastState();
      return buildStatePayload();
    });

    ipcMain.handle('aqua:confirm-drink', (_e, amountMl?: number) => recordDrink(amountMl));

    ipcMain.handle('aqua:snooze', (_e, customMinutes?: number) => {
      testPreviewActive = false;
      scheduler.snooze(Date.now(), customMinutes);
      broadcastState();
      return buildStatePayload();
    });

    ipcMain.handle('aqua:set-exact-next-time', (_e, hhmm: string) => {
      store.settings.companionEnabled = true;
      store.settings.isPaused = false;
      scheduler.setCustomTargetTime(hhmm, new Date());
      saveStore();
      broadcastState();
      return buildStatePayload();
    });

    ipcMain.handle('aqua:dismiss', () => {
      testPreviewActive = false;
      scheduler.completeOrDismiss();
      broadcastState();
      return buildStatePayload();
    });

    ipcMain.handle('aqua:test-companion', () => {
      testPreviewActive = true;
      broadcastState();
      return buildStatePayload();
    });

    ipcMain.handle('aqua:hide-test-companion', () => {
      testPreviewActive = false;
      broadcastState();
      return buildStatePayload();
    });

    ipcMain.handle('aqua:manual-trigger', () => {
      testPreviewActive = true;
      broadcastState();
      return buildStatePayload();
    });

    ipcMain.on('aqua:set-ignore-mouse', (_e, ignore: boolean) => {
      if (companionWindow && !companionWindow.isDestroyed()) {
        companionWindow.setIgnoreMouseEvents(ignore, { forward: true });
      }
    });

    ipcMain.on('aqua:open-settings', () => {
      openSettingsWindow();
    });
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  if (schedulerInterval) clearInterval(schedulerInterval);
});