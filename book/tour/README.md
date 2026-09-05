# Book tour and layout audit

Playwright scripts that need a real browser rather than jsdom. None of this is required
to build or read the book.

```bash
npm install
npx playwright install chromium

npm run voice      # 1. macOS `say` -> audio/<beat>.aiff + durations.json
npm run tour       # 2. records video/*.webm, paced by those durations, logs timeline.json
npm run mix        # 3. places each clip at its logged offset -> book-tour.mp4
npm run subs       # 4. optional: book-tour.srt

npm run overflow   # unrelated: reports elements wider than their column, per chapter
```

All scripts default to the deployed site. Point them elsewhere with `BOOK_URL`:

```bash
BOOK_URL="file://$(cd .. && pwd)/index.html" npm run overflow
```

## How the narration stays in sync

`beats.json` is the single source of truth: each beat has a `caption` (rendered on screen)
and a `speech` line (spoken). They cannot drift because both come from the same record.

The pacing runs audio-first. `voice.js` generates each clip and measures it; `tour.js`
holds each caption for exactly that long plus a little padding, and logs the real offset
at which the caption appeared; `mix.js` delays each clip to its logged offset and mixes
them over silence. The result is sample-accurate without hand-tuning any timings.

Verify a mux with:

```bash
ffmpeg -i book-tour.mp4 -map 0:a -ac 1 -ar 8000 -f wav /tmp/a.wav
# then check each beat is loud and each gap is silent
```

## Replacing the synthetic voice

`voice.js` uses macOS `say`, which is serviceable but plainly synthetic. To use a real
recording instead, keep the same file names — `audio/<beat-id>.aiff|wav|m4a` — regenerate
`durations.json` from your clips, and run `tour` and `mix` as usual. The pipeline does not
care where the audio came from, only how long each clip is.

`beats.json` doubles as the script to read from: the `speech` field, in order.

## overflow.js

Walks every chapter and reports elements wider than their container. This is the check
jsdom cannot do — it needs real layout. It found one over-wide display equation in
chapter 00; KaTeX does not wrap, so an equation past the measure is clipped rather than
scrolled into view.

`<pre>` blocks are expected to overflow: code scrolls horizontally by design. What should
always be zero is `page-h-scroll`.
