# Book tour and layout audit

Two Playwright scripts. Neither is needed to build or read the book.

```bash
npm install
npx playwright install chromium

npm run tour        # records video/*.webm — a narrated walkthrough
npm run overflow    # reports any element that overflows its column, per chapter
```

Both default to the deployed site. Point them somewhere else with `BOOK_URL`:

```bash
BOOK_URL="file://$(cd .. && pwd)/index.html" npm run overflow
```

## tour.js

Drives the live book and records a ~2 minute walkthrough with narration captions
burned in, aimed at a graduate-level audience: the four registers, a derivation, an
interactive figure being dragged, a by-hand exercise, the library bridge, the
modern-stack appendix, search, and both themes.

Convert to mp4 with:

```bash
ffmpeg -i video/*.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart tour.mp4
```

## overflow.js

Walks every chapter and reports elements wider than their container. This is the check
that jsdom cannot do — it needs real layout. It found one over-wide display equation in
chapter 00; KaTeX does not wrap, so an equation past the measure is clipped rather than
scrolled into view.

`<pre>` blocks are expected to overflow: code scrolls horizontally by design. What should
always be zero is `page-h-scroll`.
