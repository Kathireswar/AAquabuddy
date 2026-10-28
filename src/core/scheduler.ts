import { AquaSettings } from '../shared/types';

export function parseTimeMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

export function isWithinQuietHours(now: Date, settings: AquaSettings): boolean {
  if (!settings.quietHoursEnabled) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeMinutes(settings.quietHoursStart);
  const endMinutes = parseTimeMinutes(settings.quietHoursEnd);

  if (startMinutes === endMinutes) return false;

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export class ReminderScheduler {
  private settings: AquaSettings;
  private reminderActive = false;
  private nextReminderTimestamp: number | null = null;
  private onDueCallback: () => void;

  constructor(settings: AquaSettings, onDueCallback: () => void, nowMs: number = Date.now()) {
    this.settings = settings;
    this.onDueCallback = onDueCallback;
    this.scheduleNext(settings.reminderIntervalMinutes, nowMs);
  }

  public updateSettings(newSettings: AquaSettings, nowMs: number = Date.now()): void {
    const intervalChanged =
      newSettings.reminderIntervalMinutes !== this.settings.reminderIntervalMinutes;
    const pauseChanged = newSettings.isPaused !== this.settings.isPaused;
    this.settings = newSettings;

    if (this.settings.isPaused) {
      this.nextReminderTimestamp = null;
      this.reminderActive = false;
      return;
    }

    if (pauseChanged || intervalChanged || this.nextReminderTimestamp === null) {
      this.scheduleNext(this.settings.reminderIntervalMinutes, nowMs);
    }
  }

  public scheduleNext(minutesFromNow: number, nowMs: number = Date.now()): void {
    if (this.settings.isPaused) {
      this.nextReminderTimestamp = null;
      return;
    }
    this.nextReminderTimestamp = nowMs + minutesFromNow * 60_000;
  }

  public setCustomTargetTime(hhmm: string, now: Date = new Date()): void {
    const [hours, minutes] = hhmm.split(':').map((v) => parseInt(v, 10));
    if (isNaN(hours) || isNaN(minutes)) return;

    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);

    // If the selected clock time has already passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    this.settings.isPaused = false;
    this.reminderActive = false;
    this.nextReminderTimestamp = target.getTime();
  }

  public triggerManual(): void {
    this.reminderActive = true;
    this.nextReminderTimestamp = null;
    this.onDueCallback();
  }

  public snooze(nowMs: number = Date.now(), customMinutes?: number): void {
    this.reminderActive = false;
    const mins = customMinutes ?? this.settings.snoozeDurationMinutes;
    this.scheduleNext(mins, nowMs);
  }

  public completeOrDismiss(nowMs: number = Date.now()): void {
    this.reminderActive = false;
    this.scheduleNext(this.settings.reminderIntervalMinutes, nowMs);
  }

  public tick(now: Date = new Date()): boolean {
    if (this.settings.isPaused || this.reminderActive || this.nextReminderTimestamp === null) {
      return false;
    }

    const nowMs = now.getTime();
    if (nowMs >= this.nextReminderTimestamp) {
      if (isWithinQuietHours(now, this.settings)) {
        this.nextReminderTimestamp = nowMs + 5 * 60_000;
        return false;
      }
      this.reminderActive = true;
      this.nextReminderTimestamp = null;
      this.onDueCallback();
      return true;
    }
    return false;
  }

  public isReminderActive(): boolean {
    return this.reminderActive;
  }

  public getNextReminderTimestamp(): number | null {
    return this.nextReminderTimestamp;
  }
}