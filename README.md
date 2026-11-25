# Piece of Me.

**You want a piece of me, right?**

A responsive, browser-local space to spill unfiltered thoughts, find prototype Gold Pieces, keep a personal gallery, and turn the whole year's raw notes into the idea of a twelve-track mixtape. Built with static HTML, CSS, and vanilla JavaScript; no build process, account, backend, or API.

## Sections

- **Real Dirty Me:** Timestamped raw entries, newest first; LIFO Stack `push`/`pop` undo; arbitrary delete; direct manual curation to On Display.
- **Gold Mining:** Quick Finds and a casual Dig Deeper flow, clearly identified as scripted AI prototype demos. Demo text is fictional, does not analyze or rewrite user entries, and can be saved to On Display.
- **On Display:** Independent gallery for either saved Gold Pieces or any raw entry.
- **My Mixtape:** Every calendar month is one 03:00 track representing that month's raw thoughts. Twelve locally styled miniature covers form the year album. The annual pressing artwork is generated with CSS, not copied album art; the vinyl sleeve, record and optional CD edition are collectible previews. Beat choices are available for House Beats, Seasonal Beats, and Guest Producers. Song generation and physical ordering are future features, not working services.
- **Persistence:** Raw notes, gallery selections, Gold Mining choices, and month-by-month beat selections use browser-local storage.
- **Performance comparison:** A measured browser benchmark compares stack-based undo with a linear scan; results vary by device and browser.

The Mixtape's monthly raw-thought counts are informational. The prototype does not generate audio or submit private notes to a service. Month-to-song transformation and annual physical ordering remain future concepts.

## Stack and complexity

The raw-entry history is an array-backed LIFO `Stack` in `script.js`. New thoughts use `push`; Undo calls `pop`.

| Operation | Complexity |
| --- | --- |
| `push` a new entry | O(1) amortized |
| `pop` latest entry for Undo | O(1) |
| Peek latest entry | O(1) |
| Delete arbitrary entry | O(n) search and shifting |
| Linear-search alternative | O(n) for each undo |

The benchmark creates 10,000 synthetic items, times 250 undo operations for each method, and reports the median of three runs. Setup is outside timed sections. The measurements use synthetic data, not personal notes.

## Run locally

Open `index.html`, or serve the project directory with a static server:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`.

## Deploy to Netlify

Import the repository or manually deploy the project folder. Use repository root (`.`) as the publish directory and leave the build command empty.

## Privacy and external services

Application data remains in browser-local storage; this is not a secure vault against other users of the same browser profile. Gold Mining uses fixed fictional examples and scripted demo choices only. No insight AI or music generation service is connected. Physical album order preview does not collect details or take payments. Space Grotesk and DM Mono load from Google Fonts; system font fallbacks are included in CSS. No personal data or API keys are part of the repository.
