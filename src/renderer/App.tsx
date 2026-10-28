import React, { useEffect, useState } from 'react';
import { AppStatePayload, AquaBuddyBridge } from '../shared/types';
import { CompanionView } from './CompanionView';
import { SettingsView } from './SettingsView';

declare global {
  interface Window {
    aquaBuddy: AquaBuddyBridge;
  }
}

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppStatePayload | null>(null);
  const route = window.location.hash.replace('#', '') || '/companion';

  useEffect(() => {
    window.aquaBuddy.getState().then(setAppState);
    const unsubscribe = window.aquaBuddy.onStateChanged((next) => {
      setAppState(next);
    });
    return unsubscribe;
  }, []);

  if (!appState) return null;

  return route === '/settings' ? (
    <SettingsView appState={appState} />
  ) : (
    <CompanionView appState={appState} />
  );
};