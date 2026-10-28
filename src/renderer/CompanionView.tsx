import React, { useEffect, useRef, useState } from 'react';
import { AppStatePayload } from '../shared/types';
import { AquaSprite } from './components/AquaSprite';

// ============================================================================
// 🎯 POPUP POSITION CONTROLS — CHANGE THESE VALUES TO MOVE THE WHITE POPUP
// ============================================================================
const POPUP_LAYOUT = {
  // Choose one:
  // 'upper-side'     -> Floats beside her head / shoulder level (Recommended)
  // 'top-above-head' -> Centered directly above her head like a comic bubble
  // 'bottom-side'    -> Sits low near the taskbar beside her feet
  mode: 'upper-side' as 'upper-side' | 'top-above-head' | 'bottom-side',

  // Move popup UP or DOWN (in pixels from the bottom of the screen):
  // Increase number to move HIGHER up; decrease to move LOWER down
  offsetY: 165,

  // Horizontal gap between character and popup (in pixels):
  offsetX: 10
};

export const CompanionView: React.FC<{ appState: AppStatePayload }> = ({ appState }) => {
  const {
    settings,
    reminderActive,
    testPreviewActive
  } = appState;

  const [xPos, setXPos] = useState<number>(220);
  const [facingLeft, setFacingLeft] = useState<boolean>(false);
  const [hiddenUntilDue, setHiddenUntilDue] = useState<boolean>(false);
  const [bubbleVisible, setBubbleVisible] = useState<boolean>(true);

  const interactiveZoneRef = useRef<HTMLDivElement | null>(null);
  const bubbleZoneRef = useRef<HTMLDivElement | null>(null);
  const lastMouseIgnoreRef = useRef<boolean>(true);

  useEffect(() => {
    if (reminderActive || testPreviewActive) {
      setHiddenUntilDue(false);
      setBubbleVisible(true);
    }
  }, [reminderActive, testPreviewActive]);

  const isCompanionHidden =
    !testPreviewActive && (!settings.companionEnabled || hiddenUntilDue);

  // Horizontal walking movement
  useEffect(() => {
    if (isCompanionHidden) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let direction = facingLeft ? -1 : 1;

    const step = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      const spriteWidth = Math.round(150 * settings.characterScale);
      const maxRight = Math.max(260, window.innerWidth - spriteWidth - 260);
      const minLeft = 40;
      const pixelsPerSecond = 56 * settings.animationSpeed;

      setXPos((prev) => {
        let next = prev + direction * pixelsPerSecond * dt;
        if (next >= maxRight) {
          next = maxRight;
          direction = -1;
          setFacingLeft(true);
        } else if (next <= minLeft) {
          next = minLeft;
          direction = 1;
          setFacingLeft(false);
        }
        return next;
      });

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isCompanionHidden, facingLeft, settings.animationSpeed, settings.characterScale]);

  // Pass clicks through transparent areas outside the character and white popup
  useEffect(() => {
    if (isCompanionHidden) {
      lastMouseIgnoreRef.current = true;
      window.aquaBuddy.setIgnoreMouseEvents(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const charRect = interactiveZoneRef.current?.getBoundingClientRect();
      const bubbleRect = bubbleZoneRef.current?.getBoundingClientRect();

      const inRect = (r?: DOMRect) =>
        Boolean(
          r &&
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
        );

      const hoveringInteractive =
        inRect(charRect) || (bubbleVisible && inRect(bubbleRect));
      const shouldIgnore = !hoveringInteractive;

      if (shouldIgnore !== lastMouseIgnoreRef.current) {
        lastMouseIgnoreRef.current = shouldIgnore;
        window.aquaBuddy.setIgnoreMouseEvents(shouldIgnore);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isCompanionHidden, bubbleVisible]);

  const handleYesDrinked = async () => {
    setBubbleVisible(false);
    setHiddenUntilDue(true);
    window.aquaBuddy.setIgnoreMouseEvents(true);
    await window.aquaBuddy.confirmDrink(settings.defaultDrinkMl);
  };

  const handleRemindMeLater = async () => {
    setBubbleVisible(false);
    setHiddenUntilDue(true);
    window.aquaBuddy.setIgnoreMouseEvents(true);
    await window.aquaBuddy.snoozeReminder(settings.remindLaterMinutes);
  };

  const handleOpenSettingsAndHideBubble = () => {
    setBubbleVisible(false);
    window.aquaBuddy.setIgnoreMouseEvents(true);
    window.aquaBuddy.openSettings();
  };

  if (isCompanionHidden) {
    return <div className="companion-stage" />;
  }

  const placeBubbleOnLeft = xPos > window.innerWidth - 360;
  const isTopMode = POPUP_LAYOUT.mode === 'top-above-head';

  return (
    <div className="companion-stage">
      <div
        className="companion-anchor"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          display: 'flex',
          flexDirection: isTopMode
            ? 'column-reverse'
            : placeBubbleOnLeft
            ? 'row-reverse'
            : 'row',
          alignItems: isTopMode ? 'center' : 'flex-end',
          gap: `${POPUP_LAYOUT.offsetX}px`,
          transform: `translate3d(${Math.round(xPos)}px, 0, 0)`,
          pointerEvents: 'none'
        }}
      >
        <div
          ref={interactiveZoneRef}
          className="sprite-hit-box"
          onClick={() => setBubbleVisible((prev) => !prev)}
          title="Click to toggle popup • Double-click for Dashboard"
          style={{ pointerEvents: 'auto' }}
        >
          <AquaSprite
            state="walk"
            theme={settings.characterTheme}
            builtInCharacter={settings.builtInCharacter}
            customAvatarDataUrl={settings.customAvatarDataUrl}
            customMediaKind={settings.customMediaKind}
            chromaKeyMode={settings.chromaKeyMode}
            chromaTolerance={settings.chromaTolerance}
            chromaSpillSuppression={settings.chromaSpillSuppression}
            cutoutFrameStyle={settings.cutoutFrameStyle}
            facingLeft={facingLeft}
            scale={settings.characterScale}
            animationSpeed={settings.animationSpeed}
            onDoubleClick={handleOpenSettingsAndHideBubble}
          />
        </div>

        {/* PURE WHITE MINIMAL POPUP */}
        {bubbleVisible && (
          <div
            ref={bubbleZoneRef}
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: '16px',
              padding: '14px 16px',
              width: '230px',
              marginBottom:
                POPUP_LAYOUT.mode === 'top-above-head'
                  ? '8px'
                  : POPUP_LAYOUT.mode === 'upper-side'
                  ? `${Math.round(POPUP_LAYOUT.offsetY * settings.characterScale)}px`
                  : '24px',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              pointerEvents: 'auto',
              flexShrink: 0
            }}
          >
            <p
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: '0 0 12px 0'
              }}
            >
              Are you drinked water?
            </p>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center'
              }}
            >
              <button
                type="button"
                onClick={handleYesDrinked}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Yes
              </button>

              <button
                type="button"
                onClick={handleRemindMeLater}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flex: 1.4
                }}
              >
                Remind me later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};