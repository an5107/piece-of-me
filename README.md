# Piece of Me.

**You want a piece of me, right?**

A responsive, browser-local personal space to write, collect, and soundtrack your own life. Built with static HTML, CSS, and vanilla JavaScript; no build process, account, backend, or API.

## Features

- **Real Dirty Me:** Text entry with “Come on. Spill it.” / “Drop it.” and one-tap voice recording with a recognizable microphone button / “Say it.” Recording uses browser-supported `getUserMedia` and `MediaRecorder`, starts only after the user taps the button, and shows a pulsing recording state and elapsed time. Stop, replay, save, or discard a take. Browser speech-to-text is optional, where supported; transcripts are not intentionally filtered or rewritten.
- **Optional original audio:** Audio retention is off by default. If enabled, recordings are stored on-device in IndexedDB. Browser compatibility, HTTPS requirements, and microphone permission errors are communicated in the interface. No audio is automatically uploaded.
- **Other sections:** Gold Mining demos, On Display, My Mixtape album visuals, beat selections, Stack-based Undo, localStorage, and the measured stack-vs-linear benchmark remain part of the site. AI insight generation, music generation, and physical album ordering are clearly marked as prototype/future features, not working services.

## Run locally

Open `index.html`, or serve the project directory with a static server:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`. Microphone recording requires a supported browser, microphone permission, and a secure origin (HTTPS or localhost). Speech-to-text support varies by browser.

## Deploy to Netlify

Import the repository or manually deploy the project folder. Use the repository root (`.`) as the publish directory and leave the build command empty. HTTPS is required for microphone access.

## Privacy

Text entries and app preferences use browser-local storage. If selected, original audio remains in this browser's IndexedDB and is not uploaded by the app. Speech recognition, if available, is provided by the browser; its handling depends on that browser. Browser storage is not a secure vault. No personal data or API keys are included in the repository.
