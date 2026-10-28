import { describe, expect, it, vi } from 'vitest';
import { isWithinQuietHours, ReminderScheduler } from '../src/core/scheduler';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../src/core/settings';

describe('AquaBuddy Settings Sanitization', () => {
  it('clamps out-of-range values and falls back safely', () => {
    const sanitized = sanitizeSettings({
      reminderIntervalMinutes: 1,
      snoozeDurationMinutes: 999,
      characterScale: 5,
      animationSpeed: 0.1
    });

    expect(sanitized.reminderIntervalMinutes).toBe(5);
    expect(sanitized.snoozeDurationMinutes).toBe(120);
    expect(sanitized.characterScale).toBe(1.5);
    expect(sanitized.animationSpeed).toBe(0.5);
  });
});

describe('Quiet Hours Evaluation', () => {
  it('correctly detects overnight quiet hours (22:00 -> 07:00)', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00'
    };

    expect(isWithinQuietHours(new Date('2026-10-20T23:15:00'), settings)).toBe(true);
    expect(isWithinQuietHours(new Date('2026-10-20T05:30:00'), settings)).toBe(true);
    expect(isWithinQuietHours(new Date('2026-10-20T14:00:00'), settings)).toBe(false);
  });
});

describe('ReminderScheduler State Machine', () => {
  it('fires callback when reminder interval elapses outside quiet hours', () => {
    const onDue = vi.fn();
    const startMs = new Date('2026-10-20T10:00:00').getTime();
    const settings = { ...DEFAULT_SETTINGS, reminderIntervalMinutes: 30, quietHoursEnabled: false };

    const scheduler = new ReminderScheduler(settings, onDue, startMs);
    expect(scheduler.isReminderActive()).toBe(false);

    expect(scheduler.tick(new Date(startMs + 29 * 60_000))).toBe(false);
    expect(onDue).not.toHaveBeenCalled();

    expect(scheduler.tick(new Date(startMs + 30 * 60_000))).toBe(true);
    expect(scheduler.isReminderActive()).toBe(true);
    expect(onDue).toHaveBeenCalledTimes(1);
  });

  it('defers reminder when due during quiet hours and fires after quiet hours end', () => {
    const onDue = vi.fn();
    const startMs = new Date('2026-10-20T21:45:00').getTime();
    const settings = {
      ...DEFAULT_SETTINGS,
      reminderIntervalMinutes: 30,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00'
    };

    const scheduler = new ReminderScheduler(settings, onDue, startMs);

    expect(scheduler.tick(new Date('2026-10-20T22:15:00'))).toBe(false);
    expect(scheduler.isReminderActive()).toBe(false);
    expect(onDue).not.toHaveBeenCalled();

    expect(scheduler.tick(new Date('2026-10-21T07:05:00'))).toBe(true);
    expect(scheduler.isReminderActive()).toBe(true);
    expect(onDue).toHaveBeenCalledTimes(1);
  });

  it('supports snoozing and completing reminders', () => {
    const onDue = vi.fn();
    const startMs = new Date('2026-10-20T12:00:00').getTime();
    const settings = { ...DEFAULT_SETTINGS, reminderIntervalMinutes: 45, snoozeDurationMinutes: 10 };

    const scheduler = new ReminderScheduler(settings, onDue, startMs);
    scheduler.triggerManual();
    expect(scheduler.isReminderActive()).toBe(true);

    scheduler.snooze(startMs);
    expect(scheduler.isReminderActive()).toBe(false);
    expect(scheduler.getNextReminderTimestamp()).toBe(startMs + 10 * 60_000);
  });
});