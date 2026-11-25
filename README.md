# Piece of Me.

**You want a piece of me, right?**

A responsive, browser-local space for spontaneous unfiltered writing and voice notes, prototype Gold Pieces, a personal gallery, and a year-by-year mixtape. Built with static HTML, CSS, and vanilla JavaScript; no build process, account, backend, or API.

## Sections and features

- **Real Dirty Me:** Type with the placeholder “Come on. Spill it.” and submit with “Drop it.” Or record immediately with “Say it.” Both options are presented together. Text and saved voice transcripts join the same timestamped, newest-first entry Stack; Undo uses `pop`, and entries can be deleted or curated to On Display.
- **Voice recording:** Uses `getUserMedia` and `MediaRecorder` when supported. Recording starts only after an explicit button press, shows a timer and minimal waveform, and can be stopped, replayed, saved, or discarded. Browser speech recognition is used where available; its transcript is left as recognized and editable, with no intentional profanity filtering or rewriting. Recording requires a compatible browser, microphone access, and normally HTTPS (or localhost). Permission and compatibility errors are shown in the interface.
- **Optional original audio:** Audio retention is off by default. When enabled, recordings are stored locally in IndexedDB; transcripts and entry metadata remain in localStorage. Users can remove retained audio later. Voice notes have independent checkboxes to exclude them from future Gold Mining or My Mixtape use. Nothing is uploaded. Local browser storage is not a secure vault.
- **Gold Mining:** Quick Finds and a casual Dig Deeper flow are clearly labeled scripted AI prototype demos. They do not analyze or rewrite user entries.
- **On Display:** Independent gallery for saved Gold Pieces and any raw text entry.
- **My Mixtape:** Every calendar month is one 03:00 track representing that month's eligible raw thoughts. Twelve locally styled miniature covers form the year album. The sleeve, vinyl and optional CD edition use original CSS artwork. House Beats, Seasonal Beats, and Guest Producers remain as text-only selections. Music generation and physical ordering are future features, not working services.
- **Persistence:** Raw notes, gallery selections, Gold Mining choices, beat selections, and voice metadata use browser-local storage; retained original audio uses IndexedDB.
- **Performance comparison:** A measured browser benchmark compares stack-based undo with a linear scan; results vary by device and browser.

## Stack and complexity

Raw entries use an array-backed LIFO `Stack` in `script.js`. New thoughts use `push`; Undo calls `pop`.

| Operation | Complexity |
| --- | --- |
| `push` a new entry | O(1) amortized |
| `pop` latest entry for Undo | O(1) |
| Peek latest entry | O(1) |
| Delete arbitrary entry | O(n) search and shifting |
| Linear-search alternative | O(n) for each undo |

The benchmark creates 10,000 synthetic items, times 250 undo operations for each method, and reports the median of three runs. Setup is outside timed sections. Measurements use synthetic data, not personal notes.

## Run locally

Open `index.html`, or serve the project directory with a static server:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`. Microphone access works on secure origins (HTTPS) and localhost, subject to browser support and permission.

## Deploy to Netlify

Import the repository or manually deploy the project folder. Use repository root (`.`) as the publish directory and leave the build command empty. Netlify's HTTPS origin supports browser microphone permission prompts.

## Privacy and external services

Text, Gold Mining prototype choices, and preference metadata stay in localStorage. Audio is not retained unless users select “Keep original audio on this device”; retained clips stay in IndexedDB and can be removed from an entry. Speech recognition, when offered by the browser, is handled by that browser implementation; behavior and privacy depend on the browser. The app does not intentionally sanitize transcripts and does not send recordings to its own server. Gold Mining examples are fictional and scripted. Music generation and physical album ordering are not connected. Space Grotesk and DM Mono load from Google Fonts; system fallbacks are included. No personal data or API keys are included in the repository.
