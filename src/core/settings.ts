import { AquaSettings, DailyHistory } from '../shared/types';

export const DEFAULT_SETTINGS: AquaSettings = {
  companionEnabled: true,
  reminderIntervalMinutes: 45,
  snoozeDurationMinutes: 10,
  remindLaterMinutes: 15,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  animationSpeed: 1.0,
  characterScale: 1.35,
  characterTheme: 'aqua',
  builtInCharacter: 'actress-green-video',
  customAvatarDataUrl: null,
  customMediaKind: 'video',
  chromaKeyMode: 'green',
  chromaTolerance: 55,
  chromaSpillSuppression: 90,
  cutoutFrameStyle: 'full',
  dailyGoalMl: 2500,
  defaultDrinkMl: 250,
  launchOnStartup: false,
  isPaused: false
};

export function sanitizeSettings(raw: Partial<AquaSettings> | undefined): AquaSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  const companionEnabled =
    merged.companionEnabled !== undefined ? Boolean(merged.companionEnabled) : !merged.isPaused;

  return {
    companionEnabled,
    reminderIntervalMinutes: Math.min(240, Math.max(1, Number(merged.reminderIntervalMinutes) || 45)),
    snoozeDurationMinutes: Math.min(120, Math.max(1, Number(merged.snoozeDurationMinutes) || 10)),
    remindLaterMinutes: Math.min(180, Math.max(1, Number(merged.remindLaterMinutes) || 15)),
    quietHoursEnabled: Boolean(merged.quietHoursEnabled),
    quietHoursStart: /^\d{2}:\d{2}$/.test(merged.quietHoursStart) ? merged.quietHoursStart : '22:00',
    quietHoursEnd: /^\d{2}:\d{2}$/.test(merged.quietHoursEnd) ? merged.quietHoursEnd : '07:00',
    animationSpeed: Math.min(2.5, Math.max(0.5, Number(merged.animationSpeed) || 1.0)),
    characterScale: Math.min(3.0, Math.max(0.5, Number(merged.characterScale) || 1.35)),
    characterTheme: ['aqua', 'mint', 'coral', 'lavender'].includes(merged.characterTheme)
      ? merged.characterTheme
      : 'aqua',
    builtInCharacter: ['actress-green-video', 'actress-water', 'droplet', 'custom'].includes(
      merged.builtInCharacter
    )
      ? merged.builtInCharacter
      : 'actress-green-video',
    customAvatarDataUrl:
      typeof merged.customAvatarDataUrl === 'string' ? merged.customAvatarDataUrl : null,
    customMediaKind: ['image', 'gif', 'video'].includes(merged.customMediaKind)
      ? merged.customMediaKind
      : 'video',
    chromaKeyMode: ['none', 'green', 'white'].includes(merged.chromaKeyMode)
      ? merged.chromaKeyMode
      : 'green',
    chromaTolerance: Math.min(100, Math.max(10, Number(merged.chromaTolerance) || 55)),
    chromaSpillSuppression: Math.min(100, Math.max(0, Number(merged.chromaSpillSuppression) ?? 90)),
    cutoutFrameStyle: ['circle', 'full', 'rounded'].includes(merged.cutoutFrameStyle)
      ? merged.cutoutFrameStyle
      : 'full',
    dailyGoalMl: Math.min(6000, Math.max(500, Number(merged.dailyGoalMl) || 2500)),
    defaultDrinkMl: Math.min(1000, Math.max(50, Number(merged.defaultDrinkMl) || 250)),
    launchOnStartup: Boolean(merged.launchOnStartup),
    isPaused: !companionEnabled
  };
}

export function formatLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createEmptyDay(dateKey: string, goalMl: number): DailyHistory {
  return {
    date: dateKey,
    totalMl: 0,
    goalMl,
    entries: []
  };
}