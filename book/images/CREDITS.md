# Image provenance

Every file in this directory that the book did not draw itself is listed here, with
its source, licence, and the date it was retrieved. `book/build.py` refuses to build
if a chapter shows an image from `images/` without a visible `<p class="credit">`
naming the source in the rendered page, so this file is the long-form record and the
credit lines in the chapters are the short-form one.

Retrieved 2026-09-06.

---

## `alammar/` — Jay Alammar, *The Illustrated Transformer*

- **Source:** <https://jalammar.github.io/illustrated-transformer/>
- **Licence:** [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/),
  stated in the page footer.
- **Attribution, as the author requests it:** Alammar, J (2018). The Illustrated
  Transformer [Blog post]. Retrieved from
  <https://jalammar.github.io/illustrated-transformer/>

### Why this is allowed here

The three licence terms, against this book:

- **BY** — satisfied by the credit line on each figure and by this file.
- **NC** — this book is free, ad-free, and published from a public repository with no
  commercial component. *If that ever changes, these files must come out.*
- **SA** — the figures are reproduced **unmodified**. Under CC 4.0 §2(a) merely
  including unmodified material in a larger collection does not produce Adapted
  Material, so ShareAlike does not reach the rest of the book. Cropping, recolouring,
  relabelling, or redrawing any of these would change that answer — don't, without
  reading the licence again first.

### Files

| File | Used in |
| --- | --- |
| `transformer_self_attention_vectors.png` | ch06 — where q, k, v come from |
| `self-attention-matrix-calculation.png` | ch06 — X · W^Q in matrix form |
| `self-attention-matrix-calculation-2.png` | ch06 — the whole formula as one picture |
| `transformer_attention_heads_qkv.png` | ch06 — per-head projection matrices |
| `transformer_multi-headed_self-attention-recap.png` | ch06 — multi-head, end to end |
| `transformer_self-attention_visualization.png` | ch06 — "it" attending to "the animal" |
| `transformer_resideual_layer_norm_2.png` | ch07 — residual + LayerNorm placement |
| `transformer_positional_encoding_example.png` | ch07 — positional encodings added to embeddings |
| `The_transformer_encoder_decoder_stack.png` | ch09 — the six-and-six stack |
| `Transformer_decoder.png` | ch09 — the decoder's three sublayers |
| `transformer_decoding_1.gif` | ch09 — encoder output becomes cross-attention K and V |
| `transformer_decoding_2.gif` | ch09 — autoregressive decoding, step by step |
| `transformer_logits_output_and_label.png` | ch09b — where the gradient is born |
| `output_target_probability_distributions.png` | ch09b — target distributions per position |

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
  Interactive Visual Explanation and Experimentation.* CHI 2026.
  arXiv:2408.04619.

### Files

| File | Used in |
| --- | --- |
| `QKV.png` | ch06 — the fused QKV projection inside real GPT-2 |
| `attention.png` | ch06 — attention weights on a live model |
| `softmax.png` | ch09b — the softmax whose Jacobian we differentiate |
| `embedding.png` | ch07 — token + positional embedding in a real model |
| `mlp.png` | ch09b — the feed-forward head the gradient passes through |

---

## Christopher Olah, *Understanding LSTMs* — linked, not reproduced

- **Source:** <https://colah.github.io/posts/2015-08-Understanding-LSTMs/>
- **Licence:** none stated. There is no licence statement on the post, none on
  <https://colah.github.io/about.html>, and no `LICENSE` file in
  <https://github.com/colah/colah.github.io>. Absent a grant, the default is all
  rights reserved.

**So none of that post's diagrams are in this repository, and none should be added**
without written permission from the author. Chapter 05 instead links to the post and
uses a diagram drawn for this book, in this book's own visual language. The
"conveyor belt" reading of the cell state is Olah's framing and is credited to him in
the text.

If permission is ever obtained, record it here with the date and the wording of the
grant before adding any file.
