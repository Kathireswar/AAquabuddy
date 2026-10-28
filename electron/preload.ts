import { contextBridge, ipcRenderer } from 'electron';
import { AppStatePayload, AquaBuddyBridge, AquaSettings } from '../src/shared/types';

const bridge: AquaBuddyBridge = {
  getState: () => ipcRenderer.invoke('aqua:get-state'),
  updateSettings: (partial: Partial<AquaSettings>) =>
    ipcRenderer.invoke('aqua:update-settings', partial),
  confirmDrink: (amountMl?: number) => ipcRenderer.invoke('aqua:confirm-drink', amountMl),
  snoozeReminder: (customMinutes?: number) => ipcRenderer.invoke('aqua:snooze', customMinutes),
  setExactNextReminderTime: (hhmm: string) =>
    ipcRenderer.invoke('aqua:set-exact-next-time', hhmm),
  dismissReminder: () => ipcRenderer.invoke('aqua:dismiss'),
  triggerManualReminder: () => ipcRenderer.invoke('aqua:manual-trigger'),
  testShowCompanion: () => ipcRenderer.invoke('aqua:test-companion'),
  hideTestCompanion: () => ipcRenderer.invoke('aqua:hide-test-companion'),
  setIgnoreMouseEvents: (ignore: boolean) => {
    ipcRenderer.send('aqua:set-ignore-mouse', ignore);
  },
  openSettings: () => {
    ipcRenderer.send('aqua:open-settings');
  },
  onStateChanged: (callback: (state: AppStatePayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: AppStatePayload) => {
      callback(payload);
    };
    ipcRenderer.on('aqua:state-changed', listener);
    return () => {
      ipcRenderer.removeListener('aqua:state-changed', listener);
    };
  }
};

contextBridge.exposeInMainWorld('aquaBuddy', bridge);