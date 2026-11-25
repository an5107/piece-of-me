# Piece of Me.

**You want a piece of me, right?**

A responsive, editorial-style personal space for writing unfiltered thoughts, keeping a private gallery of selected entries, and building a year-by-year mixtape. Built with HTML, CSS, and vanilla JavaScript; it runs in the browser without a build step, account, server, or API.

## Features

- **Real Dirty Me:** Write timestamped entries, see newest first, undo the latest submission, delete individual entries, and add or remove any raw entry from On Display.
- **Gold Mining:** Two AI prototype demos in one section: concise quick-find insights and a casual Dig Deeper interaction for a promising rough thought. Save a Gold Piece to On Display or pass on it. Examples and responses are scripted and fictional; there is no real AI, no analysis of user notes, and no rewriting of raw thoughts.
- **On Display:** Keep raw entries and saved Gold Pieces together. Curating a Gold Piece never changes or removes its original note; raw notes can still be saved independently.
- **My Mixtape:** Browse a 12-track album for each year, with three-minute track placeholders and local beat selections from House Beats, Seasonal Beats, and Guest Producers. The album remains connected to raw notes, not just curated pieces.
- **Local persistence:** Original entries, gallery selections, Gold Mining demo choices, and monthly beat choices use browser `localStorage`.
- **Responsive layout:** Designed for desktop and mobile screens, with reduced-motion support.
- **Measured algorithm comparison:** A browser benchmark compares stack-based undo with a linear-search alternative. It runs automatically when the page loads and can be rerun. Results are measured in-browser and vary by device.

## Gold Mining prototype

The Quick Finds and Dig Deeper flows are clearly labeled prototypes using fixed sample text and scripted responses. They do not connect to an AI service or process a user's accumulated notes. Dig Deeper offers short, optional choices rather than a writing assignment. Gold Pieces and their demo source notes can be saved to or removed from On Display; passing dismisses a Quick Find locally. Your actual raw entries remain unchanged.

## Stack and complexity

The entry history is an array-backed LIFO `Stack` in `script.js`. New entries use `push`; Undo calls `pop` to remove the newest entry.

| Operation | Complexity |
| --- | --- |
| `push` a new entry | O(1) amortized |
| `pop` the latest entry for Undo | O(1) |
| Peek at the latest entry | O(1) |
| Delete an arbitrary entry | O(n) search and shifting |
| Linear-search comparison | O(n) per undo operation |

The built-in benchmark creates 10,000 synthetic items, times 250 undo operations using each method, and reports the median of three measured runs. Stack setup is outside the timed portion. The alternative scans the full list on each undo to locate the newest active item. These are synthetic browser-local measurements—not a promise of fixed speedups—and are not based on personal entries.

## Other future features—not working services

- Real AI conversation and insight extraction are future features. Gold Mining currently contains only the clearly labeled prototype demos described above.
- Music generation is a future feature; beat selections are text-only and do not play or generate audio.
- Physical album ordering is a future feature; the order preview is informational and does not collect details, accept payments, or place orders.

## Run locally

No dependencies or build tools are required. Open `index.html` in a browser, or serve this directory with any static file server. For example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to Netlify

This is a static site with no build process:

1. Import the repository into Netlify, or drag the project folder into Netlify's manual deploy interface.
2. Set the **publish directory** to the repository root (`.`).
3. Leave the **build command** empty.
4. Deploy. The site entry point is `index.html`.

## Privacy

No application data is sent to a backend: entries, gallery selections, Gold Mining demo choices, and beat selections remain in browser-local storage on the device. Anyone with access to the same browser profile may be able to access local storage, so this is not a secure vault. The page loads Space Grotesk and DM Mono from Google Fonts; use system font fallbacks or remove the font links if you need to avoid that third-party font request. No personal data or API keys are included in the repository.
