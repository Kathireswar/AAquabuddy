# AquaBuddy — Windows 11 Water Reminder Desktop Companion

AquaBuddy is an animated desktop companion for Windows 10 and
Windows 11 that walks along the bottom edge of your screen, above the
taskbar, and reminds you to stay hydrated throughout the day.

Unlike standard notifications that are easy to overlook, AquaBuddy
displays a customizable animated companion on your desktop. It supports
AI-generated green-screen walking videos (.mp4 and .webm), animated
GIF sprites, and transparent PNG cutouts.
✨ Key Features
- 🚶 Animated desktop companion: Walks left and right along the
  bottom of the screen, above the taskbar.
- 🖱️ Click-through transparency: Uses cursor hit-box detection and
  Electron's setIgnoreMouseEvents API so areas outside the character
  or reminder bubble can pass clicks through to underlying apps.
- 💬 Water reminders: When a reminder is due, a speech bubble
  asks, "Have you had some water?" and offers:
  - Yes: Logs water intake (250 ml by default) and hides the
    companion until the next reminder.
  - Remind me later: Snoozes the reminder until the snooze
    period ends.
- 🎬 Green-screen removal: Uses an HTML Canvas HSV chroma-keying
  pipeline to remove green or white backgrounds from supported videos,
  with edge de-spill processing.
- 🎛️ AquaBuddy Studio Dashboard:
  - Master ON/OFF switch.
  - Live clock and countdown.
  - Editable next water-drinking time.
  - Test mode to preview the companion without resetting the active
    countdown.
  - Built-in character selection and custom .mp4, .webm, .gif,
    or .png uploads.
  - Character size controls from 50% to 300% and walking-speed
    controls.
- 📥 System tray integration: Runs in the Windows system tray when
  the Settings Dashboard is closed.
⚙️ Architecture
AquaBuddy uses Electron, React, TypeScript, and Vite in a multi-window
desktop architecture.
1. Main process --- electron/main.ts
   - Manages the transparent, frameless, always-on-top companion
     overlay and the Studio Dashboard.
   - Uses display work-area information and display/DPI change events
     to help position the companion above the taskbar.
   - Runs the reminder scheduler and persists settings and daily
     hydration history under
     %APPDATA%\\aquabuddy\\aquabuddy-store.json.
2. Preload bridge --- electron/preload.ts
   - Uses contextIsolation: true and nodeIntegration: false.
   - Exposes a typed window.aquaBuddy IPC bridge to the renderer.
3. Renderer --- src/renderer/
   - CompanionView.tsx: Companion animation, pointer hit-box
     handling, and reminder bubble.
   - AquaSprite.tsx: Video, GIF, and PNG rendering, including
     chroma-key and de-spill processing.
   - SettingsView.tsx: Dashboard controls, reminder configuration,
     and hydration tracking.
🚀 Installation for Users
Option 1: Download a Windows installer
1. Open the repository's Releases page.
2. Download the latest AquaBuddy Windows installer, if a release is
   available.
3. Run the installer and follow the setup instructions.
4. Launch AquaBuddy. Its icon should appear in the Windows system tray.
Tip: Double-click the companion or right-click the AquaBuddy tray
icon and choose Open Studio Dashboard to customize reminders,
character size, and appearance.

🛠️ Setup for Developers
Prerequisites
- Windows 10 or Windows 11 (64-bit)
- Node.js v18 or later recommended
- Git
1. Clone the repository
git clone https://github.com/Kathireswar/AAquabuddy.git
cd AAquabuddy
2. Install dependencies
npm install
3. Run in development mode
npm run dev
4. Run linting and tests
npm run lint
npm test
5. Build the Windows installer
npm run dist:win
The installer output path depends on the build configuration. The
project is configured to use the release/ directory for packaged
output. Build artifacts are generated locally and should not be
committed to Git.
🎨 Adding Custom Characters
You can add characters in two ways:
1. Built-in characters: Place supported .mp4, .webm, .gif, or
   .png files in public/characters/. They can then be selected from
   the Studio Dashboard if supported by the current build.
2. Custom upload: Open the Studio Dashboard and use its custom
   character upload controls to select a video, GIF, or image. Adjust
   the green-key tolerance and edge de-spill settings when available.
📁 Project Structure
AAquabuddy/
├── electron/
│   ├── main.ts
│   └── preload.ts
├── public/
│   └── characters/
├── src/
│   ├── core/
│   │   ├── scheduler.ts
│   │   └── settings.ts
│   ├── renderer/
│   │   ├── components/
│   │   │   └── AquaSprite.tsx
│   │   ├── App.tsx
│   │   ├── CompanionView.tsx
│   │   ├── SettingsView.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   └── shared/
│       └── types.ts
├── tests/
│   └── scheduler.test.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
📄 License
This project is licensed under the MIT License. You are
welcome to fork, customize, and share your own desktop companions under
the terms of that license.
