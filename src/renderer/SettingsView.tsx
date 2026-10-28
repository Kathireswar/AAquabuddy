import React, { useEffect, useRef, useState } from 'react';
import {
  AppStatePayload,
  AquaSettings,
  BuiltInCharacterId,
  ChromaKeyMode,
  MediaKind
} from '../shared/types';
import {
  BUILT_IN_ACTRESS_PNG_PATH,
  BUILT_IN_GREEN_VIDEO_PATH
} from './components/AquaSprite';

export const SettingsView: React.FC<{ appState: AppStatePayload }> = ({ appState }) => {
  const { settings, todayHistory, reminderActive, nextReminderTimestamp } = appState;
  const [form, setForm] = useState<AquaSettings>(settings);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [testToast, setTestToast] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());
  const [isEditingNextTime, setIsEditingNextTime] = useState<boolean>(false);
  const [customNextTime, setCustomNextTime] = useState<string>('09:00');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    if (nextReminderTimestamp) {
      const d = new Date(nextReminderTimestamp);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setCustomNextTime(`${hh}:${mm}`);
    }
  }, [nextReminderTimestamp]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const patchAndApply = async (partial: Partial<AquaSettings>) => {
    const next = { ...form, ...partial };
    setForm(next);
    await window.aquaBuddy.updateSettings(partial);
  };

  const handleSaveAll = async () => {
    await window.aquaBuddy.updateSettings(form);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleTestShowCompanion = async () => {
    await window.aquaBuddy.testShowCompanion();
    setTestToast(true);
    setTimeout(() => setTestToast(false), 2200);
  };

  const handleSaveExactNextDrinkTime = async () => {
    await window.aquaBuddy.setExactNextReminderTime(customNextTime);
    setIsEditingNextTime(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type.toLowerCase();
    const detectedKind: MediaKind = mime.startsWith('video/')
      ? 'video'
      : mime === 'image/gif'
      ? 'gif'
      : 'image';

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        patchAndApply({
          builtInCharacter: 'custom',
          customMediaKind: detectedKind,
          customAvatarDataUrl: reader.result
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const selectBuiltInCharacter = (id: BuiltInCharacterId) => {
    if (id === 'actress-green-video') {
      patchAndApply({
        builtInCharacter: 'actress-green-video',
        chromaKeyMode: 'green'
      });
    } else {
      patchAndApply({ builtInCharacter: id });
    }
  };

  const currentTimeFormatted = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const nextDrinkTimeFormatted = (() => {
    if (!form.companionEnabled) return 'Companion Turned OFF';
    if (reminderActive) return 'Now (Reminder Active!)';
    if (!nextReminderTimestamp) return 'Scheduling...';
    return new Date(nextReminderTimestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  })();

  const liveCountdownFormatted = (() => {
    if (!form.companionEnabled) return 'OFF';
    if (reminderActive) return '00m 00s — Time to Drink Water!';
    if (!nextReminderTimestamp) return '--m --s';
    const diffSec = Math.max(0, Math.floor((nextReminderTimestamp - now.getTime()) / 1000));
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  })();

  return (
    <div className="settings-shell">
      <header className="settings-header">
        <div>
          <h1>AquaBuddy Studio Dashboard</h1>
          <p>Anti-Smudge Green Screen Engine • Live Water Timer • Dual Character Selector</p>
        </div>

        <div className="header-actions">
          <label className="master-toggle-pill" title="Turn Companion & Reminders ON or OFF">
            <span className="toggle-status-dot" data-on={form.companionEnabled} />
            <span className="toggle-text">
              {form.companionEnabled ? 'Companion ON' : 'Companion OFF'}
            </span>
            <input
              type="checkbox"
              checked={form.companionEnabled}
              onChange={(e) => patchAndApply({ companionEnabled: e.target.checked })}
            />
            <span className="switch-slider" />
          </label>

          <button
            className="btn-test-companion"
            onClick={handleTestShowCompanion}
            title="Pops up the character on your taskbar to test without changing your running countdown timer"
          >
            {testToast ? '👁️ Showing (Timer Intact!)' : '👁️ Test Show Companion'}
          </button>

          <button className="btn-save-main" onClick={handleSaveAll}>
            {savedToast ? '✔ Saved!' : '💾 Save Settings'}
          </button>
        </div>
      </header>

      <section className="timer-banner-grid">
        <div className="timer-stat-card">
          <span className="timer-label">🕒 Current Time</span>
          <span className="timer-value">{currentTimeFormatted}</span>
        </div>

        <div className="timer-stat-card highlight">
          <span className="timer-label">⏳ Water Drinking Countdown</span>
          <span className="timer-value accent">{liveCountdownFormatted}</span>
        </div>

        <div className="timer-stat-card">
          <div className="timer-card-header">
            <span className="timer-label">💧 Next Water Drinking Time</span>
            {!isEditingNextTime && (
              <button
                type="button"
                className="btn-mini-edit"
                onClick={() => setIsEditingNextTime(true)}
              >
                ✏️ Edit Time
              </button>
            )}
          </div>

          {!isEditingNextTime ? (
            <span className="timer-value">{nextDrinkTimeFormatted}</span>
          ) : (
            <div className="dashboard-time-editor">
              <input
                type="time"
                value={customNextTime}
                onChange={(e) => setCustomNextTime(e.target.value)}
              />
              <button
                type="button"
                className="btn-save-main"
                style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                onClick={handleSaveExactNextDrinkTime}
              >
                Set Time
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                onClick={() => setIsEditingNextTime(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="character-sections-grid">
        <section className="card">
          <div className="section-badge-row">
            <h2>1. Default In-Built Characters</h2>
            <span className="badge-tag">Pre-Installed</span>
          </div>
          <p className="sub-metric" style={{ marginBottom: '12px' }}>
            Click any default character below to activate it immediately on your desktop taskbar:
          </p>

          <div className="default-char-list">
            <div
              className={`char-select-card ${
                form.builtInCharacter === 'actress-green-video' ? 'active' : ''
              }`}
              onClick={() => selectBuiltInCharacter('actress-green-video')}
            >
              <div className="char-thumb">
                <video
                  src={BUILT_IN_GREEN_VIDEO_PATH}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="char-meta">
                <strong>🎬 Actress Walking Video (1024 green.mp4)</strong>
                <span>Built-in Green Screen Video • Auto De-Spill Active</span>
              </div>
              <span className="char-radio">
                {form.builtInCharacter === 'actress-green-video' ? '● Selected' : '○ Select'}
              </span>
            </div>

            <div
              className={`char-select-card ${
                form.builtInCharacter === 'actress-water' ? 'active' : ''
              }`}
              onClick={() => selectBuiltInCharacter('actress-water')}
            >
              <div className="char-thumb">
                <img src={BUILT_IN_ACTRESS_PNG_PATH} alt="Actress Cutout PNG" />
              </div>
              <div className="char-meta">
                <strong>🧍‍♀️ Actress Cutout PNG (actress-water.png)</strong>
                <span>Transparent Full-Body Cutout Image</span>
              </div>
              <span className="char-radio">
                {form.builtInCharacter === 'actress-water' ? '● Selected' : '○ Select'}
              </span>
            </div>

            <div
              className={`char-select-card ${
                form.builtInCharacter === 'droplet' ? 'active' : ''
              }`}
              onClick={() => selectBuiltInCharacter('droplet')}
            >
              <div className="char-thumb droplet-thumb">💧</div>
              <div className="char-meta">
                <strong>💧 Classic Aqua Droplet</strong>
                <span>Lightweight Animated Vector Companion</span>
              </div>
              <span className="char-radio">
                {form.builtInCharacter === 'droplet' ? '● Selected' : '○ Select'}
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="section-badge-row">
            <h2>2. Custom Character & Green BG Optimizer</h2>
            <span className="badge-tag accent">Custom & De-Spill</span>
          </div>
          <p className="sub-metric" style={{ marginBottom: '12px' }}>
            Upload your own <code>.mp4</code>, <code>.webm</code>, <code>.gif</code>, or <code>.png</code> and eliminate green edge smudges:
          </p>

          <div className="custom-upload-box">
            <div className="avatar-preview-box">
              {form.customAvatarDataUrl ? (
                form.customMediaKind === 'video' ? (
                  <video
                    src={form.customAvatarDataUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <img src={form.customAvatarDataUrl} alt="Custom Companion" />
                )
              ) : (
                <span className="avatar-placeholder">No Custom File Uploaded</span>
              )}
            </div>

            <div className="custom-upload-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,image/gif,image/png,image/webp,image/jpeg"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                className="btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                📂 Upload Custom Video / GIF / Photo...
              </button>

              {form.customAvatarDataUrl && (
                <button
                  className={`btn-secondary ${
                    form.builtInCharacter === 'custom' ? 'active-custom-btn' : ''
                  }`}
                  onClick={() => patchAndApply({ builtInCharacter: 'custom' })}
                >
                  {form.builtInCharacter === 'custom'
                    ? '● Using Custom Character'
                    : 'Use Uploaded Custom File'}
                </button>
              )}
            </div>
          </div>

          <hr className="divider" />

          <label className="field-row">
            <span>Background Removal Mode</span>
            <select
              style={{ width: '210px' }}
              value={form.chromaKeyMode}
              onChange={(e) =>
                patchAndApply({ chromaKeyMode: e.target.value as ChromaKeyMode })
              }
            >
              <option value="green">Green Screen (#00FF00 De-Spill)</option>
              <option value="white">White Background Removal</option>
              <option value="none">None (Already Transparent)</option>
            </select>
          </label>

          <label className="field-row">
            <span>Green Key Tolerance ({form.chromaTolerance}%)</span>
            <input
              type="range"
              min={15}
              max={95}
              step={1}
              value={form.chromaTolerance}
              onChange={(e) =>
                patchAndApply({ chromaTolerance: Number(e.target.value) })
              }
            />
          </label>

          <label className="field-row">
            <span>Edge Green Smudge De-Spill ({form.chromaSpillSuppression}%)</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.chromaSpillSuppression}
              onChange={(e) =>
                patchAndApply({ chromaSpillSuppression: Number(e.target.value) })
              }
            />
          </label>
        </section>
      </div>

      <div className="settings-grid" style={{ marginTop: '18px' }}>
        <section className="card">
          <h2>Reminder & Snooze Schedule</h2>
          <label className="field-row">
            <span>Remind Time Interval (minutes)</span>
            <input
              type="number"
              min={1}
              max={240}
              value={form.reminderIntervalMinutes}
              onChange={(e) =>
                patchAndApply({ reminderIntervalMinutes: Number(e.target.value) })
              }
            />
          </label>

          <label className="field-row">
            <span>Snooze Button Time (minutes)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={form.snoozeDurationMinutes}
              onChange={(e) =>
                patchAndApply({ snoozeDurationMinutes: Number(e.target.value) })
              }
            />
          </label>

          <label className="field-row">
            <span>&quot;Remind Later&quot; Time (minutes)</span>
            <input
              type="number"
              min={1}
              max={180}
              value={form.remindLaterMinutes}
              onChange={(e) =>
                patchAndApply({ remindLaterMinutes: Number(e.target.value) })
              }
            />
          </label>

          <label className="field-row">
            <span>Water Drink Amount (ml)</span>
            <input
              type="number"
              step={50}
              min={50}
              max={1000}
              value={form.defaultDrinkMl}
              onChange={(e) =>
                patchAndApply({ defaultDrinkMl: Number(e.target.value) })
              }
            />
          </label>
        </section>

        <section className="card">
          <h2>Character Size & Movement</h2>
          <div className="field-row">
            <span>Character Size ({Math.round(form.characterScale * 100)}%)</span>
            <div className="size-stepper">
              <button
                type="button"
                onClick={() =>
                  patchAndApply({
                    characterScale: Math.max(0.5, Number((form.characterScale - 0.15).toFixed(2)))
                  })
                }
              >
                − Smaller
              </button>
              <button
                type="button"
                onClick={() =>
                  patchAndApply({
                    characterScale: Math.min(3.0, Number((form.characterScale + 0.15).toFixed(2)))
                  })
                }
              >
                + Increase Size
              </button>
            </div>
          </div>

          <label className="field-row">
            <span>Size Slider (50% - 300%)</span>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.05}
              value={form.characterScale}
              onChange={(e) => patchAndApply({ characterScale: Number(e.target.value) })}
            />
          </label>

          <label className="field-row">
            <span>Walking Speed ({form.animationSpeed.toFixed(1)}x)</span>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.1}
              value={form.animationSpeed}
              onChange={(e) => patchAndApply({ animationSpeed: Number(e.target.value) })}
            />
          </label>

          <div className="hydration-summary" style={{ marginTop: '14px' }}>
            <span className="sub-metric">
              Today&apos;s Intake: <strong>{todayHistory.totalMl} / {form.dailyGoalMl} ml</strong>
            </span>
            <button className="btn-save-main" onClick={handleSaveAll}>
              {savedToast ? '✔ Saved!' : '💾 Save Settings'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};