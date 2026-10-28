export type CharacterState = 'idle' | 'walk' | 'reminder' | 'drink' | 'celebrate';
export type CharacterTheme = 'aqua' | 'mint' | 'coral' | 'lavender';
export type BuiltInCharacterId = 'actress-green-video' | 'actress-water' | 'droplet' | 'custom';
export type MediaKind = 'image' | 'gif' | 'video';
export type ChromaKeyMode = 'none' | 'green' | 'white';

export interface AquaSettings {
  companionEnabled: boolean;
  reminderIntervalMinutes: number;
  snoozeDurationMinutes: number;
  remindLaterMinutes: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  animationSpeed: number;
  characterScale: number;
  characterTheme: CharacterTheme;
  builtInCharacter: BuiltInCharacterId;
  customAvatarDataUrl: string | null;
  customMediaKind: MediaKind;
  chromaKeyMode: ChromaKeyMode;
  chromaTolerance: number; // 10 to 100
  chromaSpillSuppression: number; // 0 to 100
  cutoutFrameStyle: 'circle' | 'full' | 'rounded';
  dailyGoalMl: number;
  defaultDrinkMl: number;
  launchOnStartup: boolean;
  isPaused: boolean;
}

export interface IntakeEntry {
  id: string;
  timestamp: number;
  amountMl: number;
}

export interface DailyHistory {
  date: string;
  totalMl: number;
  goalMl: number;
  entries: IntakeEntry[];
}

export interface AppStatePayload {
  settings: AquaSettings;
  todayHistory: DailyHistory;
  recentDays: DailyHistory[];
  reminderActive: boolean;
  testPreviewActive: boolean;
  nextReminderTimestamp: number | null;
}

export interface AquaBuddyBridge {
  getState: () => Promise<AppStatePayload>;
  updateSettings: (partial: Partial<AquaSettings>) => Promise<AppStatePayload>;
  confirmDrink: (amountMl?: number) => Promise<AppStatePayload>;
  snoozeReminder: (customMinutes?: number) => Promise<AppStatePayload>;
  setExactNextReminderTime: (hhmm: string) => Promise<AppStatePayload>;
  dismissReminder: () => Promise<AppStatePayload>;
  triggerManualReminder: () => Promise<AppStatePayload>;
  testShowCompanion: () => Promise<AppStatePayload>;
  hideTestCompanion: () => Promise<AppStatePayload>;
  setIgnoreMouseEvents: (ignore: boolean) => void;
  openSettings: () => void;
  onStateChanged: (callback: (state: AppStatePayload) => void) => () => void;
}