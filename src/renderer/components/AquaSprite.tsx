import React, { useEffect, useRef, useState } from 'react';
import {
  BuiltInCharacterId,
  CharacterState,
  CharacterTheme,
  ChromaKeyMode,
  MediaKind
} from '../../shared/types';

interface AquaSpriteProps {
  state: CharacterState;
  theme: CharacterTheme;
  builtInCharacter: BuiltInCharacterId;
  customAvatarDataUrl: string | null;
  customMediaKind: MediaKind;
  chromaKeyMode: ChromaKeyMode;
  chromaTolerance: number;
  chromaSpillSuppression: number;
  cutoutFrameStyle: 'circle' | 'full' | 'rounded';
  facingLeft: boolean;
  scale: number;
  animationSpeed: number;
  onDoubleClick: () => void;
}

export const BUILT_IN_GREEN_VIDEO_PATH = '/characters/1024%20green.mp4';
export const BUILT_IN_ACTRESS_PNG_PATH = '/characters/actress-water.png';

const THEME_PALETTES: Record<CharacterTheme, { primary: string; highlight: string; cheek: string }> = {
  aqua: { primary: '#38bdf8', highlight: '#bae6fd', cheek: '#f472b6' },
  mint: { primary: '#34d399', highlight: '#a7f3d0', cheek: '#fb7185' },
  coral: { primary: '#fb7185', highlight: '#fecdd3', cheek: '#fde047' },
  lavender: { primary: '#a78bfa', highlight: '#ddd6fe', cheek: '#f472b6' }
};

export const AquaSprite: React.FC<AquaSpriteProps> = ({
  state,
  theme,
  builtInCharacter,
  customAvatarDataUrl,
  customMediaKind,
  chromaKeyMode,
  chromaTolerance,
  chromaSpillSuppression,
  facingLeft,
  scale,
  animationSpeed,
  onDoubleClick
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const palette = THEME_PALETTES[theme] ?? THEME_PALETTES.aqua;

  const width = Math.round(150 * scale);
  const height = Math.round(255 * scale);

  const resolvedMedia = (() => {
    if (builtInCharacter === 'droplet') {
      return { src: null, kind: 'image' as MediaKind, keyMode: 'none' as ChromaKeyMode };
    }
    if (builtInCharacter === 'actress-water') {
      return {
        src: BUILT_IN_ACTRESS_PNG_PATH,
        kind: 'image' as MediaKind,
        keyMode: 'none' as ChromaKeyMode
      };
    }
    if (builtInCharacter === 'custom' && customAvatarDataUrl) {
      return {
        src: customAvatarDataUrl,
        kind: customMediaKind,
        keyMode: chromaKeyMode
      };
    }
    if (!videoFailed) {
      return {
        src: BUILT_IN_GREEN_VIDEO_PATH,
        kind: 'video' as MediaKind,
        keyMode: 'green' as ChromaKeyMode
      };
    }
    return {
      src: BUILT_IN_ACTRESS_PNG_PATH,
      kind: 'image' as MediaKind,
      keyMode: 'none' as ChromaKeyMode
    };
  })();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = Math.min(2.5, Math.max(0.5, animationSpeed));
    }
  }, [animationSpeed, resolvedMedia.src]);

  useEffect(() => {
    if (resolvedMedia.kind !== 'video' || resolvedMedia.keyMode === 'none') return;

    let rafId: number;
    const toleranceFactor = Math.max(10, Math.min(100, chromaTolerance)) / 100;
    const spillStrength = Math.max(0, Math.min(100, chromaSpillSuppression)) / 100;

    const innerThresh = 0.08 + (1 - toleranceFactor) * 0.22;
    const outerThresh = innerThresh + 0.18 + toleranceFactor * 0.16;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2 && !video.paused) {
        const vw = video.videoWidth || 380;
        const vh = video.videoHeight || 660;
        if (canvas.width !== vw || canvas.height !== vh) {
          canvas.width = vw;
          canvas.height = vh;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, vw, vh);
          const imgData = ctx.getImageData(0, 0, vw, vh);
          const d = imgData.data;

          if (resolvedMedia.keyMode === 'green') {
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i];
              const g = d[i + 1];
              const b = d[i + 2];

              const maxRB = r > b ? r : b;
              const greenExcess = (g - maxRB) / 255;
              const greenRatio = g / (maxRB + 1);

              if (greenExcess > outerThresh || (g > 55 && greenRatio > 1.45 - toleranceFactor * 0.3)) {
                d[i + 3] = 0;
                continue;
              }

              if (greenExcess > innerThresh) {
                const norm = (greenExcess - innerThresh) / (outerThresh - innerThresh);
                const smoothAlpha = Math.max(0, Math.min(1, 1 - norm * norm));
                d[i + 3] = Math.round(d[i + 3] * smoothAlpha);
              }

              if (g > maxRB && spillStrength > 0) {
                const neutralG = Math.round(r * 0.55 + b * 0.45);
                d[i + 1] = Math.round(g - (g - neutralG) * spillStrength);
                if (greenExcess > 0.04) {
                  const darken = Math.max(0.72, 1 - greenExcess * 0.85 * spillStrength);
                  d[i] = Math.round(d[i] * darken);
                  d[i + 1] = Math.round(d[i + 1] * darken);
                  d[i + 2] = Math.round(d[i + 2] * darken);
                }
              }
            }

            const w = vw;
            const h = vh;
            for (let y = 1; y < h - 1; y++) {
              const rowOffset = y * w * 4;
              for (let x = 1; x < w - 1; x++) {
                const idx = rowOffset + x * 4;
                const a = d[idx + 3];
                if (a > 0 && a < 210) {
                  const leftA = d[idx - 4 + 3];
                  const rightA = d[idx + 4 + 3];
                  const topA = d[idx - w * 4 + 3];
                  const botA = d[idx + w * 4 + 3];
                  if (leftA === 0 || rightA === 0 || topA === 0 || botA === 0) {
                    d[idx + 3] = Math.round(a * 0.35);
                  }
                }
              }
            }
          } else if (resolvedMedia.keyMode === 'white') {
            const whiteCutoff = 250 - Math.round(toleranceFactor * 45);
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i];
              const g = d[i + 1];
              const b = d[i + 2];
              const minRGB = Math.min(r, g, b);
              const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
              if (minRGB > whiteCutoff && maxDiff < 25) {
                d[i + 3] = 0;
              } else if (minRGB > whiteCutoff - 20 && maxDiff < 32) {
                const fade = (whiteCutoff - minRGB) / 20;
                d[i + 3] = Math.round(d[i + 3] * Math.max(0, Math.min(1, fade)));
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
        }
      }

      rafId = requestAnimationFrame(processFrame);
    };

    rafId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(rafId);
  }, [
    resolvedMedia.kind,
    resolvedMedia.src,
    resolvedMedia.keyMode,
    chromaTolerance,
    chromaSpillSuppression
  ]);

  return (
    <div
      onDoubleClick={onDoubleClick}
      title="Click to toggle popup • Double-click for Dashboard"
      style={{
        width: resolvedMedia.src ? width : Math.round(115 * scale),
        height: resolvedMedia.src ? height : Math.round(115 * scale),
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
        transition: 'transform 0.22s ease'
      }}
      className={`aqua-sprite state-${state}`}
    >
      {resolvedMedia.src ? (
        resolvedMedia.kind === 'video' ? (
          <>
            <video
              ref={videoRef}
              key={resolvedMedia.src}
              src={resolvedMedia.src}
              autoPlay
              loop
              muted
              playsInline
              onError={() => {
                if (builtInCharacter === 'actress-green-video') {
                  setVideoFailed(true);
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: resolvedMedia.keyMode === 'none' ? 'block' : 'none',
                filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.48))',
                pointerEvents: 'none'
              }}
            />
            {resolvedMedia.keyMode !== 'none' && (
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.48))',
                  pointerEvents: 'none'
                }}
              />
            )}
          </>
        ) : (
          <img
            key={resolvedMedia.src}
            src={resolvedMedia.src}
            alt="AquaBuddy Companion"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 10px 18px rgba(0, 0, 0, 0.48))',
              pointerEvents: 'none'
            }}
          />
        )
      ) : (
        <svg viewBox="0 0 120 120" width="100%" height="100%">
          <ellipse cx="60" cy="112" rx="28" ry="5" fill="rgba(15, 23, 42, 0.35)" />
          <ellipse className="foot-left" cx="46" cy="106" rx="9" ry="5" fill={palette.primary} />
          <ellipse className="foot-right" cx="74" cy="106" rx="9" ry="5" fill={palette.primary} />
          <path
            className="droplet-body"
            d="M60 12 C60 12 22 54 22 80 C22 100 39 108 60 108 C81 108 98 100 98 80 C98 54 60 12 60 12 Z"
            fill={palette.primary}
            stroke="#0f172a"
            strokeWidth="3"
          />
          <path
            d="M42 46 C34 58 32 70 35 80"
            stroke={palette.highlight}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
          <ellipse cx="38" cy="76" rx="5.5" ry="3.2" fill={palette.cheek} opacity="0.75" />
          <ellipse cx="82" cy="76" rx="5.5" ry="3.2" fill={palette.cheek} opacity="0.75" />
          <circle cx="46" cy="67" r="5" fill="#0f172a" />
          <circle cx="44.5" cy="65" r="1.8" fill="#ffffff" />
          <circle cx="74" cy="67" r="5" fill="#0f172a" />
          <circle cx="72.5" cy="65" r="1.8" fill="#ffffff" />
          <path d="M52 77 Q60 84 68 77" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      )}
    </div>
  );
};