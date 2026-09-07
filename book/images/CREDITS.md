# Image provenance

Almost every figure in this book is drawn for it, as inline SVG inside
`book/chapters/*.html` — so it themes with the page, scales without blurring, costs a
couple of kilobytes, and carries no licence question. The handful of files in this
directory are the exceptions, and this is their record.

`book/build.py` refuses to build if a chapter shows an image from `images/` without a
visible `<p class="credit">` naming its source in the rendered page, so the credit
lines in the chapters and this file cannot drift apart silently.

Last reviewed 2026-09-07.

---

## `transformer-explainer/` — Polo Club of Data Science, *Transformer Explainer*

- **Source:** <https://github.com/poloclub/transformer-explainer> (files under
  `static/article_assets/`), live tool at
  <https://poloclub.github.io/transformer-explainer/>
- **Licence:** MIT. The full notice is kept verbatim in
  `transformer-explainer/LICENSE.txt`, which is what the licence requires of anyone
  redistributing the files; do not delete it.
- **Copyright:** (c) 2022 Polo Club of Data Science.
- **Paper:** Cho, A., Kim, G. C., Karpekov, A., Helbling, A., Wang, Z. J., Lee, S.,
  Hoover, B., and Chau, D. H. *Transformer Explainer: Learning LLM Transformers with
  Interactive Visual Explanation and Experimentation.* CHI 2026. arXiv:2408.04619.

These five are kept rather than redrawn for one reason: they show **real activations
from a real GPT-2**, which a drawing cannot honestly claim to do. Where a figure is
making a point about what actually happens inside a trained model — the raw score
range, the fused QKV projection, the learned position table — a schematic would be
weaker evidence, not just a different style.

| File | Used in |
| --- | --- |
| `QKV.png` | ch06 — the fused QKV projection inside real GPT-2 |
| `attention.png` | ch06 — measured score ranges, before and after the scaling |
| `embedding.png` | ch07 — learned position embeddings in a real model |
| `softmax.png` | ch09b — the output softmax at inference, temperature and top-k |
| `mlp.png` | ch09b — the residual stream drawn to scale |

---

## Drawn for this book

Everything else. The diagrams live as inline SVG in the chapter files and are generated
from a small shared vocabulary — see the colour roles below, which are kept consistent
across every figure so a reader learns them once:

| Role | Colour token |
| --- | --- |
| X, embeddings | `--notebook` (green) |
| Q, queries | `--accent` (purple) |
| K, keys | `--byhand` (orange) |
| V, values | `--source` (blue) |
| outputs | `--sayback` (pink) |
| scores, weights | `--concept` (teal) |

Two accessibility rules apply to all of them, and are worth keeping if you add more:

- **No text below 12 units.** Figures are drawn on a 760-unit canvas and render into a
  column narrower than that, so a nominal size is not what the reader sees. The
  `.figure.wide` class widens the column to about 0.96 scale, which puts the smallest
  label at roughly 11.5 rendered pixels — matching the book's own `figcaption`.
- **Every figure carries a `<title>` and a `<desc>`**, so it is not silent to a screen
  reader. The `desc` describes what the picture shows, not what it means; the meaning
  belongs in the caption, which is already readable.

---

## Linked, not reproduced

Two well-known explanations shaped how these diagrams are laid out, and are credited in
the text wherever their framing is used. Neither grants a licence that would allow
reproducing its figures here — Olah's states none at all, and absent a grant the default
is all rights reserved — so no image from either is in this repository, and none should
be added without written permission from the author.

- Christopher Olah, [*Understanding LSTMs*](https://colah.github.io/posts/2015-08-Understanding-LSTMs/).
  The "conveyor belt" reading of the cell state is his, and chapter 05 says so.
- Jay Alammar, [*The Illustrated Transformer*](https://jalammar.github.io/illustrated-transformer/).
  Linked from chapter 06 as further reading.

An earlier version of this book did reproduce fourteen of Alammar's diagrams under
CC BY-NC-SA 4.0. That was permitted, but the non-commercial term bound the whole
project in a way that would have had to be remembered for as long as the book existed.
They were replaced with drawings made for the book — which also removed 9.6 MB of
animated GIFs and made every figure theme-aware.
