# PyTorch Neural Network Training

A hands-on curriculum for building intuition with neural networks and PyTorch, from
the probability behind a loss function to quantizing and LoRA-adapting a transformer
you trained yourself.

Two halves that are meant to be used together:

- **The notebooks** — thirteen lessons, each a pair of Jupyter notebooks: a
  **prompt** with guided `TODO`s and a **solution** that is complete and already
  executed, so you can read its outputs without running anything.
- **[The book](book/index.html)** — a single long-form companion volume you keep open
  beside the notebooks. It derives the mathematics, contains interactive figures, and
  sets pencil-and-paper exercises with worked solutions.

Everything runs on a MacBook Air with an M4 chip and 24 GB of memory. No
data-centre GPU, no API keys, no multi-gigabyte downloads.

---

## The Book

```bash
open book/index.html          # macOS — works straight off the filesystem
```

A single-page app: chapters are client-side routes (`#/ch06`, or `#/ch00/ch00-cross-entropy`
to land on a heading), with prev/next navigation, full-text search across every chapter,
dark mode, and a *back to where you were* button for following cross-references without
losing your place. A **continuous mode** toggle shows the whole book as one scroll, which
is what you want when you would rather Cmd+F than search.

Everything is in one file with no fetches, so it behaves identically opened from
`file://` and served over HTTP. Mathematics renders offline via a vendored KaTeX; the
interactive figures are canvas widgets computing the same arithmetic as the text beside
them. Around 850 KB, roughly 240 KB gzipped.

### Publishing it to GitHub Pages

`.github/workflows/pages.yml` builds and deploys `book/` on every push to `main` that
touches it. To turn it on: **Settings → Pages → Source → GitHub Actions**. The workflow
rebuilds `index.html`, fails the run if any cross-reference is dangling, and publishes
`index.html` plus `vendor/` with a `.nojekyll` marker.

All asset paths are relative and nothing is fetched from a third party, so it works
unchanged at a project URL like `https://<user>.github.io/pytorch_nn_training/`.

The routing is hash-based rather than path-based, which means no 404 fallback trick is
needed and deep links survive a refresh.

Every chapter carries **By hand** exercises — small calculations you do on paper
before writing code, with fully worked solutions folded up underneath. Chapter 00
alone has twenty-four. That step is the one people skip and the one that does the work:
a gradient you have computed once with a pencil stops being a symbol and becomes a
number you know how to check.

Each chapter also ends with an **In the wild** box showing the production equivalent of
whatever you just built by hand — `F.scaled_dot_product_attention` for your attention,
`peft` for your LoRA, `transformers` for your GPT — with what the library adds and what
it hides. Building it yourself is not an argument against the library; it is what lets
you use the library well, and debug it when it misbehaves.

The appendix goes past the end of the curriculum: a map from every hand-rolled
component to its production API, a guide to reading papers (with the papers behind each
chapter), and **the modern stack** — the roughly eight substitutions separating
Chapter 07's transformer from a current frontier model. RMSNorm, SwiGLU, RoPE,
GQA, latent attention, mixture-of-experts, FlashAttention, speculative decoding, and
preference optimisation, each with the one-line idea and which resource it buys back.
None of them needs mathematics beyond Chapter 00.

To edit it, change a fragment in `book/chapters/` and rebuild:

```bash
python3 book/build.py           # regenerate book/index.html
python3 book/build.py --check   # validate fragments and cross-references only
```

The build script is standard-library only — no dependencies, no toolchain. It assigns
stable heading anchors, checks every cross-reference, verifies that every lesson folder
the book names exists and is tracked by git, highlights Python code blocks, and emits the
search index the router uses.

The app itself has a headless test suite (`book/test/`, 33 assertions over routing,
search, navigation, and widget mounting) which CI runs before deploying:

```bash
cd book/test && npm install && npm test
```

`book/tour/` holds two Playwright scripts that need a real browser rather than jsdom:
`npm run overflow` reports any element wider than its column, per chapter — the check
that caught a clipped display equation — and `npm run tour` records a narrated
walkthrough of the book.

---

## What's Covered

### 00 — Mathematical Foundations
The four areas of mathematics the rest of the curriculum runs on, verified in code
rather than asserted. Trains no model; it is entirely about the mathematics.

- **Linear algebra** — dot products as similarity, the row *and column* readings of a
  matrix–vector product, the transpose in the backward pass derived from shapes alone,
  outer products and rank (the basis for LoRA), broadcasting traps
- **Calculus** — finite differences and gradient checking, the chain rule, summing over
  paths and the missing-`zero_grad()` bug it explains, the learning-rate convergence bound
- **Statistics** — expectation and variance, why `σ'(z)` *is* a Bernoulli variance,
  variance propagation through 20 layers (deriving Xavier and He initialisation, and
  watching the wrong scale saturate a network before training starts), the dot-product
  variance behind attention's `√d_k`, dropout's `1/(1-p)`, standard error over seeds
- **Probability and loss** — likelihood, why every loss is a negative log-likelihood,
  BCE / softmax / cross-entropy from their definitions, the `ŷ - y` gradient verified
  three ways, entropy, KL divergence, and perplexity
- **Recognising which tool applies** — the skill students actually lack. Four triggers
  (applied repeatedly → variance; measured once → standard error; rare → base rates;
  an output choice → likelihood), three guided diagnoses, and drills where the answer is
  the *category*, not a number

### 01 — Neural Network from Scratch
Build a 2-layer network (XOR) using **only NumPy**. Every operation — forward pass,
loss, backpropagation, gradient descent — implemented by hand.

- Why XOR needs a hidden layer, and why depth without non-linearity buys nothing
- Chain-rule derivations for every gradient in the network
- The `a2 - y` cancellation, and what MSE would have cost instead
- Saturation, and where the vanishing-gradient problem starts

### 02 — Neural Networks with PyTorch
Rebuild the same network with PyTorch's abstractions. Learn the idioms used in every
later lesson.

- `torch.Tensor`, autograd, and the dynamic computational graph
- `nn.Module`, parameter registration, and buffers
- The five-step training loop
- SGD vs Adam, and the 16-bytes-per-parameter rule
- Apple Silicon GPU (MPS) acceleration
- **Turning a problem statement into code** — five questions that take you from a
  sentence ("classify into 3 classes, two connected layers") to the model, the loss, and
  a target of the right shape *and dtype*, with four drills and a checker that catches
  the three mistakes which raise no error

### 03 — CNN for Sentiment Analysis
Train a convolutional network on the NLTK movie_reviews corpus (2,000 real reviews).

- `nn.Embedding` and why one-hot vectors are a bad encoding
- `nn.Conv1d` with multiple kernel widths, and the transpose everyone gets wrong
- Global max pooling, dropout, and the train/test split
- ~80% test accuracy, and where the architecture's ceiling comes from

### 04 — RNN for Character-Level Text Generation
Train a recurrent network on *Alice's Adventures in Wonderland*.

- Hidden state, weight sharing, backpropagation through time
- The vanishing gradient, derived and then measured
- Gradient clipping, and why it fixes explosion but not vanishing
- Temperature sampling

### 05 — LSTM for Time-Series Prediction
Predict a sine wave from sliding windows, then compare against the RNN.

- Cell state vs hidden state, and the additive gradient path
- Forget, input, and output gates read as behaviour
- `nn.LSTM` API details: `batch_first`, `out` vs `h_n`, inter-layer dropout
- Comparing architectures fairly at matched parameter counts

### 06 — Self-Attention from Scratch
Implement scaled dot-product and multi-head attention, applied to the movie reviews
from lesson 03 for a direct comparison.

- Queries, keys, and values as a soft dictionary lookup
- Why the `√d_k` scaling exists, shown by removing it
- Multi-head reshaping, and why `.contiguous()` is not optional
- Masking before the softmax, and the all-masked row that produces `nan`

### 07 — Transformers with PyTorch
Assemble a full encoder: positional encoding, residuals, layer norm, feed-forward.

- Attention is permutation-equivariant — the gap positional encoding fills
- Sinusoidal encodings, and why `PE(pos+k)` is linear in `PE(pos)`
- Residual connections as the same idea as the LSTM cell state
- Layer norm vs batch norm; post-norm vs pre-norm

### 08 — PyTorch in Practice
The craft that separates code that trains from code that trains reliably.

- Reusable `train_one_epoch` / `evaluate`, and the `.item()` memory leak
- Warmup and cosine schedules; why transformers need warmup
- Checkpointing state dicts, and keeping the *best* epoch rather than the last
- Length bucketing, reproducibility, and a symptom-to-cause debugging table
- Overfit eight examples first — the single best debugging move

### 09 — Encoder–Decoder Transformer for Translation
English→French on the NLTK comtrans corpus.

- Causal masking, and how it makes parallel training of a sequential model possible
- Cross-attention as learned alignment, visualised
- Teacher forcing, the shift, and the exposure bias it creates
- Autoregressive decoding, greedy vs beam search, BLEU

### 10 — GPT from Scratch
A decoder-only transformer trained on the same corpus as lesson 04.

- Why deleting the encoder is all it takes, and why supervision becomes free
- Pre-norm blocks, learned positions, weight tying, depth-scaled init
- Temperature, top-k, and nucleus sampling compared side by side
- A KV cache with a wall-clock measurement *and* an operation count — including why
  the two disagree at this scale

### 11 — Quantization, LoRA, and Fitting in Memory
Both techniques implemented from scratch — no `bitsandbytes`, no `peft`.

- Symmetric and per-channel quantization, and the outlier problem measured
- A bit-width sweep showing exactly where quality breaks
- LoRA, including why `B` starts at zero and `A` does not
- Adapting a Carroll-trained model to Shakespeare with under 2% of its parameters
- A rank sweep testing LoRA's low-rank claim empirically
- QLoRA, and why sequence length rather than parameter count exhausts your memory
- `torch.ao.quantization` measured against your fake quantization on real serialised
  bytes, and the `peft` merge operation verified numerically (including the scaling bug
  it catches)

### 12 — Capstone Projects
Five open-ended projects with specifications and no solutions: a translator, a text
generator, a multi-adapter assistant, a rigorous architecture comparison, and a paper
reproduction. Ships real scaffolding — vocabulary, training harness, BLEU, parameter
matching, and an A/B harness that reports error bars and tells you when a difference is
inside the noise — and leaves the architecture to you.

---

## Getting Started

**Requirements:** Python 3.13+, [uv](https://docs.astral.sh/uv/)

### 1. Install dependencies

```bash
cd pytorch_nn_training
uv sync
```

This creates a `.venv` with PyTorch, NumPy, Matplotlib, NLTK, and Jupyter.

### 2. Download NLTK data

```bash
uv run python -c "
import nltk
nltk.download('movie_reviews')
nltk.download('gutenberg')
nltk.download('comtrans')
nltk.download('punkt')
"
```

Corpora cache in `~/nltk_data/` and are downloaded automatically on first use, so
this step is optional — it just front-loads the wait.

### 3. Open the book and a notebook, side by side

```bash
open book/index.html
uv run jupyter notebook
```

### 4. Recommended order

Work through the lessons in numbered order — each builds on the previous one's
vocabulary. Read the book chapter first, do its by-hand exercise, then open the
notebook.

| Lesson | Notebook | Book chapter | Time |
|--------|----------|--------------|------|
| 00 | `00_math_foundations/prompt.ipynb` | Mathematical Foundations | 45–60 min |
| 01 | `01_nn_from_scratch/prompt.ipynb` | A Neural Network from Scratch | 45–60 min |
| 02 | `02_nn_pytorch/prompt.ipynb` | The Same Network in PyTorch | 30–45 min |
| 03 | `03_cnn_sentiment/prompt.ipynb` | Convolutions over Text | 45–60 min |
| 04 | `04_rnn_pytorch/prompt.ipynb` | Recurrence and Its Limits | 60–90 min |
| 05 | `05_lstm_pytorch/prompt.ipynb` | LSTMs: Gated Memory | 60–90 min |
| 06 | `06_self_attention/prompt.ipynb` | Self-Attention from Scratch | 60–90 min |
| 07 | `07_transformer_pytorch/prompt.ipynb` | The Transformer Encoder | 90 min |
| 08 | `08_pytorch_in_practice/prompt.ipynb` | PyTorch in Practice | 45–60 min |
| 09 | `09_seq2seq_translation/prompt.ipynb` | Encoder–Decoder Translation | 90 min |
| 10 | `10_gpt_from_scratch/prompt.ipynb` | GPT: A Decoder-Only Model | 90 min |
| 11 | `11_quantization_and_lora/prompt.ipynb` | Quantization, LoRA, and Memory | 90 min |
| 12 | `12_capstone_projects/prompt.ipynb` | Capstone Projects | open-ended |

Chapters 00–07 are a single argument and should be read in order. From 08 onward they
are more independent: 08 is practical craft you can read any time once you have
trained something, and 11 stands alone if you already know what a transformer is.

---

## Notes

- All lessons use the **Apple Silicon GPU (MPS)** when available and fall back to CPU
  otherwise, so everything runs unchanged on other hardware — just slower. For the
  smallest models MPS is actually *slower* than CPU; the benefit starts at lesson 03.
- Solution notebooks have already been executed. Lesson 12 has no solution notebook,
  because its projects have no single right answer.
- The book vendors KaTeX (`book/vendor/`, ~600 KB, woff2 only) so mathematics renders
  with no network connection.
- The largest training run in the curriculum is lesson 10, at about four minutes on an
  M4. Nothing here needs to run overnight.
- Apple-silicon gotchas — including MPS silently returning zeros for out-of-range
  embedding indices where CPU raises `IndexError` — are collected in the book's
  Appendix.
