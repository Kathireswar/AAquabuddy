AquaBuddy – Free Water Reminder App for Windows 10 & 11
AquaBuddy is a free, open-source water reminder app for Windows 10 and Windows 11. It helps you remember to drink water while working, studying, or gaming by bringing an animated desktop companion onto your screen. Instead of relying only on easy-to-dismiss notifications, AquaBuddy walks above the Windows taskbar and displays an interactive reminder when it is time to hydrate.

Built with Electron, React, TypeScript, and Vite, AquaBuddy combines scheduled hydration reminders, daily water-intake logging, a customizable desktop pet, and a Studio Dashboard for managing character animations.
Windows compatibility: 64-bit Windows 10 and Windows 11
License: MIT
Project type: Open-source desktop hydration reminder

What makes AquaBuddy different?
Most basic water reminder apps use a notification or timer. AquaBuddy adds a visible animated companion to your Windows desktop, making hydration reminders easier to notice without requiring you to leave your current app.
- Animated desktop water reminder: A character walks along the bottom of your screen, just above the Windows taskbar.
- Interactive hydration prompts: Respond to a reminder, log water intake, or snooze it for later.
- Custom desktop characters: Use your own MP4, WebM, GIF, or PNG media.
- Green-screen removal: Remove supported green or white video backgrounds with real-time HTML Canvas HSV chroma keying.
- Click-through overlay: Interact with the character and reminder bubble while allowing clicks elsewhere on the screen to reach the apps underneath.
- Daily hydration history: Record water intake and keep a local history on your PC.
Key features
💧 Customizable water drinking reminders
Set your hydration reminder schedule in AquaBuddy Studio. When a reminder appears, the desktop companion pauses and asks, “Have you had some water?”
- Select Yes to log water intake. The default logged amount is 250 ml.
- Select Remind me later to snooze the prompt.
- View the next reminder time and countdown in the Studio Dashboard.
- Pause or resume reminders with the master ON/OFF switch.
🚶 Animated desktop companion for Windows
AquaBuddy displays an animated character near the bottom edge of your desktop, above the taskbar. The companion can walk from left to right and right to left, providing a visual cue to drink water during long computer sessions.
🖱️ Click-through transparent overlay
The companion uses Electron's setIgnoreMouseEvents API together with cursor hit-box detection. The character and reminder bubble can receive interaction, while areas outside the interactive regions allow clicks to pass through to the windows underneath.
🎬 Custom character animations and green-screen removal
Personalize the Windows desktop companion with supported media formats:
File format	Supported use
.mp4	Video character animations
.webm	Video character animations
.gif	Animated image or sprite
.png	Transparent image or character cutout


For supported video files, AquaBuddy provides an HTML Canvas HSV chroma-keying pipeline to remove green or white backgrounds. Adjustable key tolerance and edge de-spill controls help refine the visible character edges.
🎛️ AquaBuddy Studio Dashboard
Use the Studio Dashboard to configure the desktop companion:
- Master control: Turn the companion and reminders ON or OFF.
- Live reminder status: View the clock, next reminder, and countdown.
- Test mode: Preview character size, animation, and reminder bubbles without resetting the active countdown.
- Character manager: Select built-in media or upload custom MP4, WebM, GIF, and PNG files.
- Size controls: Adjust character scale from 50% to 300%.
- Motion controls: Customize walking speed.
- Hydration history: Review logged water intake.
📥 Windows system tray support
AquaBuddy can remain in the Windows system tray when the Studio Dashboard is closed, helping keep the main taskbar uncluttered.
How to install AquaBuddy on Windows 10 or Windows 11
A prebuilt Windows installer is not currently published in the GitHub Releases section. Until an installer is released, you can run AquaBuddy from source or build the Windows installer on your own PC using the steps below.
Run AquaBuddy from source
Requirements
- 64-bit Windows 10 or Windows 11
- Node.js 18 or later
- npm (included with Node.js)
- Git
1. Clone the repository
git clone https://github.com/Kathireswar/AAquabuddy.git
cd AAquabuddy
2. Install dependencies
npm install
3. Start the development version
npm run dev
Build the Windows installer
To package AquaBuddy as a Windows x64 installer, run:
npm run dist:win
The installer is configured to use the NSIS target. With the current package version and build configuration, generated files are placed under:
release/1.0.0/
The installer filename is configured as:
AquaBuddy-Setup-1.0.0.exe
Build output is generated locally and is not the same as a published GitHub Release. Check the Releases page for a downloadable installer after one has been published.
How to add a custom desktop character
AquaBuddy supports two ways to add custom character media.
Option 1: Use the Studio Dashboard
1. Open the AquaBuddy Studio Dashboard.
2. Find the custom character or media upload control.
3. Select an MP4, WebM, GIF, or PNG file.
4. Adjust the character size and walking speed.
5. For supported green-screen or white-background videos, tune the chroma-key tolerance and edge de-spill settings.
Option 2: Add media to the project character folder
Place supported character files in the project's public/characters/ directory. Available built-in media can then be exposed through the character selector, depending on the current build.
Where AquaBuddy stores settings and water intake history
AquaBuddy stores its application settings and daily hydration history locally in this file on Windows:
%APPDATA%\aquabuddy\aquabuddy-store.json
The file contains the saved preferences and water-intake records used by the application.
Technology stack
Technology	Purpose
Electron	Windows desktop application and native window management
React	Desktop interface and dashboard
TypeScript	Application logic and shared types
Vite	Development server and renderer build tooling
HTML Canvas	Video rendering and chroma-key background removal
Vitest	Unit testing


Project architecture
AquaBuddy uses a multi-window Electron architecture that separates the desktop companion, Studio Dashboard, scheduler, and renderer interface.
Component	Path	Responsibility
Electron main process	electron/main.ts	Creates and manages the transparent companion overlay and Studio Dashboard windows; handles display and taskbar positioning, scheduling, and persistence.
Preload bridge	electron/preload.ts	Exposes the typed window.aquaBuddy API through a context-isolated IPC bridge.
Hydration scheduler	src/core/scheduler.ts	Handles reminder timing and snooze scheduling.
Settings and storage	src/core/settings.ts	Manages configuration and local application data.
Companion renderer	src/renderer/CompanionView.tsx	Handles character movement, hit-box detection, and reminder speech bubbles.
Character renderer	src/renderer/components/AquaSprite.tsx	Renders supported media and the Canvas chroma-key effect.
Studio Dashboard	src/renderer/SettingsView.tsx	Provides reminder controls, character customization, test mode, and hydration tracking.
Shared types	src/shared/types.ts	Defines shared TypeScript interfaces for settings, IPC, and hydration records.


Electron is configured with contextIsolation: true and nodeIntegration: false in the preload architecture described by the project.
Project structure
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
Development commands
Run these commands from the repository directory:
# Start the development server
npm run dev

# Run ESLint
npm run lint

# Run unit tests
npm test

# Build the Windows x64 installer
npm run dist:win
Frequently asked questions
Is AquaBuddy a free water reminder app for Windows?
Yes. AquaBuddy is an open-source Windows desktop hydration reminder project released under the MIT License. You can inspect, run, and modify the source code. A prebuilt installer will be linked from GitHub Releases when a release is published.
Does AquaBuddy work on Windows 10 and Windows 11?
AquaBuddy is designed for 64-bit Windows 10 and Windows 11. Its desktop companion uses Windows display work-area and DPI information to position the overlay above the taskbar.
Does the desktop companion block clicks on other apps?
The overlay uses cursor hit-box detection and Electron's setIgnoreMouseEvents API so that non-interactive areas can pass clicks through to the applications underneath. The character and reminder bubble remain interactive.
Which custom character formats are supported?
AquaBuddy supports MP4 and WebM videos, animated GIFs, and PNG images. The Canvas chroma-key feature is intended for removing supported green or white video backgrounds.
Can I change the water reminder interval?
Reminder timing and the next scheduled reminder can be managed through the AquaBuddy Studio Dashboard.
Where are my settings and water-intake records saved?
The application stores them locally at %APPDATA%\aquabuddy\aquabuddy-store.json.
Is a Windows installer available to download?
There is currently no published installer in the repository's GitHub Releases section. You can build the Windows installer from source with npm run dist:win.
Contributing
Issues, feature suggestions, and pull requests are welcome. When reporting a bug, include your Windows version, steps to reproduce the issue, and relevant error messages where possible.
License
AquaBuddy is licensed under the MIT License.
Repository: github.com/Kathireswar/AAquabuddy
Releases: AquaBuddy GitHub Releases
