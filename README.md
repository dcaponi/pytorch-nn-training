# PyTorch Neural Network Training

A hands-on curriculum for building intuition with neural networks and PyTorch. Each lesson is a pair of Jupyter notebooks: a **prompt** (guided exercises with TODOs) and a **solution** (complete, executed code).

---

## What's Covered

### 01 — Neural Network from Scratch
Build a 2-layer network (XOR problem) using **only NumPy**. Every operation — forward pass, loss, backpropagation, gradient descent — is implemented by hand so you understand exactly what frameworks do for you.

- Matrix multiplications and sigmoid activation
- Binary cross-entropy loss
- Chain rule and backpropagation derivations
- Gradient descent parameter updates
- Network architecture visualization

### 02 — Neural Networks with PyTorch
Rebuild the same XOR network using PyTorch's core abstractions. Learn the idioms you'll use in every subsequent lesson.

- `torch.Tensor` vs NumPy arrays
- `nn.Module` and `nn.Linear`
- Autograd: how `loss.backward()` computes all gradients
- The 5-step training loop (forward → loss → zero_grad → backward → step)
- SGD vs Adam optimizers
- Apple Silicon GPU (MPS) acceleration

### 03 — CNN for Sentiment Analysis
Train a convolutional network on the **NLTK movie_reviews corpus** (2,000 real film reviews). CNNs detect local phrase patterns regardless of position — the same idea that makes them work on images applies to sequences of words.

- `nn.Embedding`: learned word representations
- `nn.Conv1d` with multiple kernel sizes (bigrams, trigrams, 4-grams)
- Global max pooling and dropout regularization
- Vocabulary building and sequence encoding
- Evaluating on a held-out test set (~80%+ accuracy)

### 04 — RNN for Character-Level Text Generation
Train a recurrent network on *Alice's Adventures in Wonderland* (Lewis Carroll, via NLTK Gutenberg) to generate new text one character at a time.

- Hidden state and temporal dependencies
- Efficient batched training with overlapping sequence windows
- `nn.Embedding` as a replacement for one-hot encoding
- Truncated backpropagation through time and gradient clipping
- Sampling with temperature to control creativity
- Unrolled RNN architecture diagram

### 05 — LSTM for Time-Series Prediction
Use an LSTM to predict a sine wave from sliding windows of past values, then compare against a vanilla RNN to see why gated memory matters.

- Cell state vs hidden state (long-term vs short-term memory)
- Forget, input, output, and cell-update gates
- `nn.LSTM` vs `nn.RNN` API differences
- Regression with MSELoss
- Stacked layers and inter-layer dropout
- LSTM cell architecture diagram

---

## Getting Started

**Requirements:** Python 3.10+, [uv](https://docs.astral.sh/uv/)

### 1. Install dependencies

```bash
cd pytorch_nn_training
uv sync
```

This creates a `.venv` with PyTorch, NumPy, Matplotlib, NLTK, and Jupyter.

### 2. Download NLTK data (lessons 03 and 04)

```bash
uv run python -c "
import nltk
nltk.download('movie_reviews')
nltk.download('gutenberg')
nltk.download('punkt')
"
```

### 3. Open Jupyter

```bash
uv run jupyter notebook
```

Then navigate to a lesson folder and open `prompt.ipynb` to work through the exercises, or `solution.ipynb` to see the complete working code.

### 4. Recommended order

Work through the lessons in numbered order — each one builds on the vocabulary of the last.

| Lesson | Notebook | Time estimate |
|--------|----------|---------------|
| 01 | `01_nn_from_scratch/prompt.ipynb` | 45–60 min |
| 02 | `02_nn_pytorch/prompt.ipynb` | 30–45 min |
| 03 | `03_cnn_sentiment/prompt.ipynb` | 45–60 min |
| 04 | `04_rnn_pytorch/prompt.ipynb` | 60–90 min |
| 05 | `05_lstm_pytorch/prompt.ipynb` | 60–90 min |

---

## Notes

- All lessons automatically use the **Apple Silicon GPU (MPS)** when available. On CPU the training times will be longer but all notebooks still complete.
- The solution notebooks have already been executed — you can read the outputs without running anything.
- NLTK corpora are downloaded to `~/nltk_data/` the first time and cached for subsequent runs.
