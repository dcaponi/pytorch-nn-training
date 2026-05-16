"""
Generate all updated lesson notebooks with:
  - Neural network architecture visualizations
  - Real NLTK corpora (movie_reviews, carroll-alice, shakespeare-macbeth)
  - MPS device support (Apple Silicon GPU)
"""

import nbformat
from pathlib import Path

BASE = Path(__file__).parent


def nb(cells):
    """Build a notebook from a list of (cell_type, source) tuples."""
    n = nbformat.v4.new_notebook()
    n.metadata.kernelspec = {
        "display_name": "Python 3",
        "language": "python",
        "name": "python3",
    }
    for cell_type, src in cells:
        if cell_type == "md":
            n.cells.append(nbformat.v4.new_markdown_cell(src))
        else:
            n.cells.append(nbformat.v4.new_code_cell(src))
    return n


def write(path, notebook):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        nbformat.write(notebook, f)
    print(f"  wrote {path}")


# ─────────────────────────────────────────────
# SHARED VISUALIZATION HELPERS (embedded verbatim in notebooks)
# ─────────────────────────────────────────────

VIZ_NETWORK = """\
import matplotlib.pyplot as plt
import numpy as np

def draw_network(layer_sizes, layer_labels=None, title='', figsize=(9, 5)):
    fig, ax = plt.subplots(figsize=figsize)
    ax.set_xlim(-0.05, 1.05)
    ax.set_ylim(-0.2, 1.2)
    ax.axis('off')
    if title:
        ax.set_title(title, fontsize=13, fontweight='bold')
    n = len(layer_sizes)
    xs = np.linspace(0.1, 0.9, n)
    max_n = max(layer_sizes)
    gap = min(0.15, 0.85 / max(max_n, 2))
    colors = ['#74b9ff', '#a29bfe', '#fd79a8', '#55efc4', '#ffeaa7']
    ys_all = []
    for sz in layer_sizes:
        ys = [0.5 + (i - (sz - 1) / 2) * gap for i in range(sz)]
        ys_all.append(ys)
    for li in range(n - 1):
        for ya in ys_all[li]:
            for yb in ys_all[li + 1]:
                ax.plot([xs[li], xs[li + 1]], [ya, yb], color='#dfe6e9', lw=0.8, zorder=1)
    for li, (x, ys) in enumerate(zip(xs, ys_all)):
        for y in ys:
            c = plt.Circle((x, y), 0.038, fc=colors[li % len(colors)], ec='#2d3436', lw=1.2, zorder=5)
            ax.add_patch(c)
        lab = layer_labels[li] if layer_labels else str(layer_sizes[li])
        ax.text(x, min(ys) - 0.1, lab, ha='center', fontsize=9, color='#636e72')
    plt.tight_layout()
    plt.show()
"""

VIZ_CNN = """\
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(14, 5))
ax.axis('off')
ax.set_title('CNN Architecture for Sentiment Analysis', fontsize=14, fontweight='bold')

components = [
    (0.06,  'Input\\n(200 words)',       '#dfe6e9'),
    (0.22,  'Embedding\\n64-dim',         '#74b9ff'),
    (0.40,  'Conv1d\\nFilters 3,4,5',    '#a29bfe'),
    (0.57,  'Global\\nMax Pool',          '#55efc4'),
    (0.73,  'Dropout\\n+ Concat\\n384-d', '#ffeaa7'),
    (0.90,  'Linear\\n→ Sigmoid',         '#fd79a8'),
]
for x, label, color in components:
    rect = mpatches.FancyBboxPatch(
        (x - 0.07, 0.3), 0.14, 0.4,
        boxstyle='round,pad=0.01',
        facecolor=color, edgecolor='#2d3436', linewidth=1.5,
        transform=ax.transAxes, clip_on=False
    )
    ax.add_patch(rect)
    ax.text(x, 0.5, label, ha='center', va='center', fontsize=9,
            transform=ax.transAxes, fontweight='bold')

for i in range(len(components) - 1):
    x0 = components[i][0] + 0.07
    x1 = components[i + 1][0] - 0.07
    ax.annotate('', xy=(x1, 0.5), xytext=(x0, 0.5),
                xycoords='axes fraction', textcoords='axes fraction',
                arrowprops=dict(arrowstyle='->', color='#636e72', lw=2))
plt.tight_layout()
plt.show()
"""

VIZ_RNN = """\
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

chars = ['A', 'l', 'i', 'c', 'e', '...']
fig, ax = plt.subplots(figsize=(13, 5))
ax.set_xlim(-1.2, 13.5)
ax.set_ylim(-0.5, 5.5)
ax.axis('off')
ax.set_title('Unrolled RNN — Character-by-Character Processing', fontsize=13, fontweight='bold')

xs = [i * 2.2 + 0.8 for i in range(len(chars))]
for i, (x, ch) in enumerate(zip(xs, chars)):
    # Input box
    r1 = mpatches.FancyBboxPatch((x - 0.5, 0.2), 1.0, 0.9, boxstyle='round,pad=0.05',
                                  facecolor='#74b9ff', edgecolor='#2d3436', lw=1.5)
    ax.add_patch(r1)
    ax.text(x, 0.65, f"x_{i}\\n'{ch}'", ha='center', va='center', fontsize=9, fontweight='bold')

    # RNN cell
    r2 = mpatches.FancyBboxPatch((x - 0.6, 1.9), 1.2, 1.2, boxstyle='round,pad=0.05',
                                  facecolor='#a29bfe', edgecolor='#2d3436', lw=1.5)
    ax.add_patch(r2)
    ax.text(x, 2.5, f'RNN\\nh_{i}', ha='center', va='center', fontsize=9, fontweight='bold')

    # Output box
    r3 = mpatches.FancyBboxPatch((x - 0.5, 3.7), 1.0, 0.9, boxstyle='round,pad=0.05',
                                  facecolor='#fd79a8', edgecolor='#2d3436', lw=1.5)
    ax.add_patch(r3)
    ax.text(x, 4.15, f"y_{i}", ha='center', va='center', fontsize=10, fontweight='bold')

    # Vertical arrows
    ax.annotate('', xy=(x, 1.9), xytext=(x, 1.1),
                arrowprops=dict(arrowstyle='->', color='#2d3436', lw=1.5))
    ax.annotate('', xy=(x, 3.7), xytext=(x, 3.1),
                arrowprops=dict(arrowstyle='->', color='#2d3436', lw=1.5))

    # Hidden state arrow
    if i > 0:
        ax.annotate('', xy=(x - 0.6, 2.5), xytext=(xs[i-1] + 0.6, 2.5),
                    arrowprops=dict(arrowstyle='->', color='#e17055', lw=2.5))

ax.text(-0.8, 0.65, 'Input', ha='center', fontsize=9, color='#636e72', style='italic')
ax.text(-0.8, 2.5,  'RNN\\ncell', ha='center', fontsize=9, color='#636e72', style='italic')
ax.text(-0.8, 4.15, 'Output', ha='center', fontsize=9, color='#636e72', style='italic')
ax.text(xs[2], -0.3, 'Hidden state flows forward → (orange arrows)', ha='center',
        fontsize=9, color='#e17055', style='italic')
plt.tight_layout()
plt.show()
"""

VIZ_LSTM = """\
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(14, 8))
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis('off')
ax.set_title('LSTM Cell: Gated Memory Mechanism', fontsize=14, fontweight='bold')

# Cell state highway (top)
ax.annotate('', xy=(13.5, 7.0), xytext=(0.5, 7.0),
            arrowprops=dict(arrowstyle='->', color='#e17055', lw=3))
ax.text(7, 7.4, 'Cell State  c_t  (“long-term memory”)', ha='center',
        fontsize=11, color='#e17055', fontweight='bold')

gates = [
    (2.5,  'Forget Gate\\n(σ)', '#FAD7A0',
     'What to ERASE\\nfrom memory\\nf = σ(W[h,x]+b)'),
    (5.5,  'Input Gate\\n(σ)', '#A9DFBF',
     'What NEW info\\nto WRITE\\ni = σ(W[h,x]+b)'),
    (8.5,  'Cell Update\\n(tanh)', '#AED6F1',
     'Candidate values\\nto add\\ng = tanh(W[h,x]+b)'),
    (11.5, 'Output Gate\\n(σ)', '#D7BDE2',
     'What to OUTPUT\\nas h_t\\no = σ(W[h,x]+b)'),
]
for x, label, color, desc in gates:
    rect = mpatches.FancyBboxPatch((x - 1.0, 3.6), 2.0, 1.8,
                                    boxstyle='round,pad=0.1',
                                    facecolor=color, edgecolor='#2d3436', lw=2)
    ax.add_patch(rect)
    ax.text(x, 4.6, label, ha='center', va='center', fontsize=10, fontweight='bold')
    ax.text(x, 3.2, desc, ha='center', va='top', fontsize=8, color='#636e72', linespacing=1.4)
    ax.annotate('', xy=(x, 6.8), xytext=(x, 5.4),
                arrowprops=dict(arrowstyle='->', color='#8e44ad', lw=1.5))

# h_{t-1} input
ax.annotate('', xy=(0.8, 4.5), xytext=(0.0, 4.5),
            arrowprops=dict(arrowstyle='->', color='#3498db', lw=2.5))
ax.text(-0.05, 4.5, 'h_{t-1}', ha='right', va='center', fontsize=10,
        color='#3498db', fontweight='bold')

# x_t inputs
ax.text(7, 2.1, 'x_t  (current input)', ha='center', fontsize=10,
        color='#27ae60', fontweight='bold')
for gx in [2.5, 5.5, 8.5, 11.5]:
    ax.annotate('', xy=(gx, 3.6), xytext=(gx, 2.7),
                arrowprops=dict(arrowstyle='->', color='#27ae60', lw=1.5))

# h_t output
ax.annotate('', xy=(14.0, 4.5), xytext=(13.0, 4.5),
            arrowprops=dict(arrowstyle='->', color='#3498db', lw=2.5))
ax.text(14.1, 4.5, 'h_t', ha='left', va='center', fontsize=10,
        color='#3498db', fontweight='bold')

plt.tight_layout()
plt.show()
"""


# ─────────────────────────────────────────────
# LESSON 01 — NN from Scratch  (solution only, add viz)
# ─────────────────────────────────────────────
print("Lesson 01 …")
cells_01_sol = [
    ("md", "# Neural Network From Scratch — XOR Problem (SOLUTION)\n\n"
           "Complete working implementation using only NumPy."),
    ("md", "## Step 1: Import Libraries"),
    ("code", "import numpy as np"),
    ("md", "## Step 2: Define the Dataset"),
    ("code",
     "# X: (4, 2)  — 4 training examples, 2 input features (the two XOR bits)\n"
     "X = np.array([[0,0],[0,1],[1,0],[1,1]], dtype=np.float64)\n"
     "# y: (4, 1)  — column vector keeps shapes consistent through backprop\n"
     "#             a row vector (4,) would cause silent broadcasting bugs\n"
     "y = np.array([[0],[1],[1],[0]], dtype=np.float64)\n"
     "print('X:', X)\nprint('y:', y)"),
    ("md", "## Step 3: Initialize Weights and Biases\n\n"
           "Network: 2 inputs → 4 hidden neurons → 1 output"),
    ("code",
     "np.random.seed(42)\n"
     "# Weight shape rule: (in_features, out_features)\n"
     "# W1: (2, 4) — each of the 2 inputs connects to each of the 4 hidden neurons\n"
     "#   Matrix mul: X @ W1 → (4,2)@(2,4) = (4,4)\n"
     "#   Result has 4 rows (one per sample) and 4 cols (one per hidden neuron)\n"
     "W1 = np.random.randn(2, 4)\n"
     "b1 = np.zeros((1, 4))  # (1, 4): one bias per hidden neuron; broadcasts over 4 samples\n"
     "# W2: (4, 1) — collapses the 4 hidden activations into 1 output value per sample\n"
     "#   Matrix mul: a1 @ W2 → (4,4)@(4,1) = (4,1), which matches y's shape exactly\n"
     "W2 = np.random.randn(4, 1)\n"
     "b2 = np.zeros((1, 1))  # (1, 1): one bias for the single output neuron\n"
     "print('W1:', W1.shape, ' b1:', b1.shape)\n"
     "print('W2:', W2.shape, ' b2:', b2.shape)"),
    ("md", "## Step 4: Activation Functions"),
    ("code",
     "def sigmoid(x):\n"
     "    return 1 / (1 + np.exp(-x))  # element-wise; output shape = input shape\n\n"
     "def sigmoid_derivative(x):\n"
     "    # shape unchanged; used in backprop to scale the flowing gradient\n"
     "    return sigmoid(x) * (1 - sigmoid(x))\n\n"
     "print(sigmoid(0))             # 0.5\n"
     "print(sigmoid_derivative(0))  # 0.25"),
    ("md", "## Step 5: Forward Pass"),
    ("code",
     "def forward(X, W1, b1, W2, b2):\n"
     "    z1 = X @ W1 + b1   # (4,2)@(2,4) + (1,4) → (4,4)  pre-activation hidden layer\n"
     "    a1 = sigmoid(z1)   # (4,4)  squash to (0,1); each row = one sample's hidden state\n"
     "    z2 = a1 @ W2 + b2  # (4,4)@(4,1) + (1,1) → (4,1)  4 hidden values → 1 logit/sample\n"
     "    a2 = sigmoid(z2)   # (4,1)  predicted probability ŷ, same shape as y\n"
     "    return z1, a1, z2, a2\n\n"
     "z1, a1, z2, a2 = forward(X, W1, b1, W2, b2)\n"
     "print('a2 shape:', a2.shape)\n"
     "print('initial predictions:', a2)"),
    ("md", "## Step 6: Compute Loss (Binary Cross-Entropy)"),
    ("code",
     "def compute_loss(y, a2):\n"
     "    # y, a2 both (4,1) — log is element-wise, np.mean averages all 4 values to a scalar\n"
     "    # +1e-8 prevents log(0); a perfect prediction of exactly 0 or 1 would blow up\n"
     "    return -np.mean(y * np.log(a2 + 1e-8) + (1 - y) * np.log(1 - a2 + 1e-8))\n\n"
     "print('Initial loss:', compute_loss(y, a2))"),
    ("md", "## Step 7: Backward Pass (Backpropagation)"),
    ("code",
     "def backward(X, y, z1, a1, z2, a2, W1, W2):\n"
     "    n = X.shape[0]  # 4 samples — divide by n so each gradient is a per-sample average\n"
     "    # --- Output layer ---\n"
     "    dL_da2 = -(y / (a2 + 1e-8) - (1 - y) / (1 - a2 + 1e-8)) / n  # (4,1)\n"
     "    dL_dz2 = dL_da2 * sigmoid_derivative(z2)    # (4,1) chain rule through output sigmoid\n"
     "    dW2    = a1.T @ dL_dz2   # (4,4).T @ (4,1) = (4,1) — same shape as W2 ✓\n"
     "    db2    = np.sum(dL_dz2, axis=0, keepdims=True)  # sum 4 rows → (1,1) = shape of b2 ✓\n"
     "    # --- Hidden layer ---\n"
     "    dL_da1 = dL_dz2 @ W2.T  # (4,1) @ (1,4) = (4,4) — distributes error to each hidden neuron\n"
     "    dL_dz1 = dL_da1 * sigmoid_derivative(z1)    # (4,4) chain rule through hidden sigmoid\n"
     "    dW1    = X.T @ dL_dz1   # (2,4).T = (4,2); wait — X is (4,2) so X.T is (2,4);\n"
     "                             # (2,4) @ (4,4) = (2,4) — same shape as W1 ✓\n"
     "    db1    = np.sum(dL_dz1, axis=0, keepdims=True)  # sum 4 rows → (1,4) = shape of b1 ✓\n"
     "    return dW1, db1, dW2, db2"),
    ("md", "## Step 8: Parameter Update"),
    ("code",
     "def update_params(W1, b1, W2, b2, dW1, db1, dW2, db2, lr=0.1):\n"
     "    # Subtract a fraction of the gradient; shapes are unchanged\n"
     "    # W1 stays (2,4), b1 stays (1,4), W2 stays (4,1), b2 stays (1,1)\n"
     "    return W1 - lr*dW1, b1 - lr*db1, W2 - lr*dW2, b2 - lr*db2"),
    ("md", "## Step 9: Training Loop"),
    ("code",
     "losses = []\n"
     "for epoch in range(10000):\n"
     "    z1, a1, z2, a2 = forward(X, W1, b1, W2, b2)           # X(4,2) → a2(4,1)\n"
     "    loss = compute_loss(y, a2)                              # scalar\n"
     "    losses.append(loss)\n"
     "    dW1, db1, dW2, db2 = backward(X, y, z1, a1, z2, a2, W1, W2)\n"
     "    W1, b1, W2, b2 = update_params(W1, b1, W2, b2, dW1, db1, dW2, db2)\n"
     "    if epoch % 1000 == 0:\n"
     "        print(f'Epoch {epoch:5d} | Loss: {loss:.4f}')"),
    ("md", "## Step 10: Evaluate Predictions"),
    ("code",
     "_, _, _, a2_final = forward(X, W1, b1, W2, b2)   # a2_final: (4,1) probabilities\n"
     "predictions = np.round(a2_final).astype(int)      # threshold at 0.5 → 0 or 1, shape (4,1)\n"
     "print('True y:   ', y.flatten().astype(int))\n"
     "print('Predicted:', predictions.flatten())\n"
     "print('Accuracy: ', np.mean(predictions.flatten() == y.flatten()))"),
    ("md", "## Step 11: Visualize the Network Architecture\n\n"
           "Each node represents a neuron. Line color/opacity represents connection strength."),
    ("code", VIZ_NETWORK + "\n"
     "draw_network(\n"
     "    [2, 4, 1],\n"
     "    layer_labels=['Input\\n(2)', 'Hidden\\n(4)', 'Output\\n(1)'],\n"
     "    title='XOR Network Architecture: 2 → 4 → 1'\n"
     ")"),
    ("md", "## Step 12: Plot Training Loss"),
    ("code",
     "import matplotlib.pyplot as plt\n"
     "plt.figure(figsize=(8, 4))\n"
     "plt.plot(losses, color='#a29bfe', linewidth=1.5)\n"
     "plt.xlabel('Epoch')\n"
     "plt.ylabel('BCE Loss')\n"
     "plt.title('Training Loss — XOR from Scratch')\n"
     "plt.grid(alpha=0.3)\n"
     "plt.tight_layout()\n"
     "plt.show()"),
]
write(BASE / "01_nn_from_scratch/solution.ipynb", nb(cells_01_sol))


# ─────────────────────────────────────────────
# LESSON 02 — PyTorch NN  (solution: add viz + MPS)
# ─────────────────────────────────────────────
print("Lesson 02 …")
cells_02_sol = [
    ("md", "# Neural Networks with PyTorch — XOR Problem (SOLUTION)"),
    ("md", "## Step 1: Imports"),
    ("code",
     "import torch\n"
     "import torch.nn as nn\n"
     "import torch.optim as optim\n"
     "import matplotlib.pyplot as plt\n\n"
     "device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')\n"
     "print('PyTorch:', torch.__version__, '| device:', device)"),
    ("md", "## Step 2: Dataset"),
    ("code",
     "# X: (4, 2) float32 — PyTorch linear layers require float; integers won't work\n"
     "X = torch.tensor([[0,0],[0,1],[1,0],[1,1]], dtype=torch.float32).to(device)\n"
     "# y: (4, 1) — BCELoss requires predictions and targets to have identical shapes\n"
     "y = torch.tensor([[0],[1],[1],[0]], dtype=torch.float32).to(device)\n"
     "print('X:', X)\nprint('y:', y)"),
    ("md", "## Step 3: Define the Network with nn.Module\n\n"
           "`nn.Module` is PyTorch's base class. Define layers in `__init__`, "
           "the forward pass in `forward()`."),
    ("code",
     "class XORNet(nn.Module):\n"
     "    def __init__(self):\n"
     "        super().__init__()\n"
     "        # nn.Linear(in, out) stores weight (out, in) and bias (out,) internally,\n"
     "        # but the layer handles the transpose — you just think: (B, in) → (B, out)\n"
     "        self.hidden = nn.Linear(2, 4)  # (B, 2) → (B, 4)\n"
     "        self.output = nn.Linear(4, 1)  # (B, 4) → (B, 1)\n\n"
     "    def forward(self, x):                        # x: (4, 2)\n"
     "        x = torch.sigmoid(self.hidden(x))         # → (4, 4)  hidden activations\n"
     "        return torch.sigmoid(self.output(x))      # → (4, 1)  output probability\n\n"
     "model = XORNet().to(device)\n"
     "print(model)\n"
     "print('Parameters:', sum(p.numel() for p in model.parameters()))"),
    ("md", "## Step 4: Loss Function and Optimizer"),
    ("code",
     "criterion = nn.BCELoss()\n"
     "optimizer = optim.SGD(model.parameters(), lr=0.1)"),
    ("md", "## Step 5: Training Loop\n\n"
           "5-step pattern every iteration: forward → loss → zero_grad → backward → step"),
    ("code",
     "losses = []\n"
     "for epoch in range(10000):\n"
     "    out  = model(X)           # (4, 1) predicted probabilities\n"
     "    loss = criterion(out, y)  # BCELoss compares (4,1) vs (4,1) → scalar\n"
     "    optimizer.zero_grad()     # clear accumulated gradients from the previous step\n"
     "    loss.backward()           # autograd fills .grad for every parameter\n"
     "    optimizer.step()          # SGD: param -= lr * param.grad\n"
     "    losses.append(loss.item())\n"
     "    if epoch % 1000 == 0:\n"
     "        print(f'Epoch {epoch:5d} | Loss: {loss.item():.4f}')"),
    ("md", "## Step 6: Evaluate"),
    ("code",
     "model.eval()\n"
     "with torch.no_grad():              # disable gradient tracking — saves memory at inference\n"
     "    preds = torch.round(model(X))  # model(X): (4,1); round thresholds at 0.5 → {0, 1}\n"
     "print('True:     ', y.cpu().flatten())\n"
     "print('Predicted:', preds.cpu().flatten())"),
    ("md", "## Step 7: Inspect Weights"),
    ("code", "print(model.state_dict())"),
    ("md", "## Step 8: Visualize the Network Architecture"),
    ("code", VIZ_NETWORK + "\n"
     "draw_network(\n"
     "    [2, 4, 1],\n"
     "    layer_labels=['Input\\n(2)', 'Hidden\\n(4)', 'Output\\n(1)'],\n"
     "    title='XOR Network: 2 → 4 → 1'\n"
     ")"),
    ("md", "## Step 9: Plot Training Loss"),
    ("code",
     "plt.figure(figsize=(8, 4))\n"
     "plt.plot(losses, color='#74b9ff', linewidth=1.5)\n"
     "plt.xlabel('Epoch')\n"
     "plt.ylabel('BCE Loss')\n"
     "plt.title('Training Loss — PyTorch XOR')\n"
     "plt.grid(alpha=0.3)\n"
     "plt.tight_layout()\n"
     "plt.show()"),
    ("md", "## Bonus: Adam optimizer"),
    ("code",
     "model2 = XORNet().to(device)\n"
     "opt2   = optim.Adam(model2.parameters(), lr=0.01)\n"
     "adam_losses = []\n"
     "for epoch in range(3000):\n"
     "    out  = model2(X)\n"
     "    loss = criterion(out, y)\n"
     "    opt2.zero_grad()\n"
     "    loss.backward()\n"
     "    opt2.step()\n"
     "    adam_losses.append(loss.item())\n"
     "    if epoch % 500 == 0:\n"
     "        print(f'Epoch {epoch:5d} | Loss: {loss.item():.4f}')\n\n"
     "plt.figure(figsize=(8, 4))\n"
     "plt.plot(losses[:3000], label='SGD', color='#74b9ff')\n"
     "plt.plot(adam_losses,   label='Adam', color='#fd79a8')\n"
     "plt.xlabel('Epoch')\nplt.ylabel('BCE Loss')\n"
     "plt.title('SGD vs Adam — first 3 000 epochs')\n"
     "plt.legend()\nplt.grid(alpha=0.3)\nplt.tight_layout()\nplt.show()"),
]
write(BASE / "02_nn_pytorch/solution.ipynb", nb(cells_02_sol))


# ─────────────────────────────────────────────
# LESSON 03 — CNN Sentiment  (FULL REWRITE, movie_reviews)
# ─────────────────────────────────────────────
print("Lesson 03 …")

INTRO_03 = (
    "# CNN for Sentiment Analysis — NLTK Movie Reviews\n\n"
    "A 1-D CNN slides filters over word embeddings to detect local phrases "
    "(e.g. \"highly recommend\", \"waste of time\") independent of position.\n\n"
    "**Dataset**: NLTK `movie_reviews` — 2 000 labelled reviews (1 000 pos / 1 000 neg).\n\n"
    "**Architecture**: Embedding → Conv1d (kernel sizes 3,4,5) → Global Max Pool → "
    "Dropout → Linear → Sigmoid"
)

# --- PROMPT ---
cells_03_prompt = [
    ("md", INTRO_03),
    ("md", "## Step 1: Imports"),
    ("code",
     "import torch\n"
     "import torch.nn as nn\n"
     "import torch.nn.functional as F\n"
     "import torch.optim as optim\n"
     "from torch.utils.data import TensorDataset, DataLoader\n"
     "import nltk\n"
     "import random\n"
     "from collections import Counter\n\n"
     "device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')\n"
     "print('device:', device)"),
    ("md",
     "## Step 2: Load the Movie Reviews Corpus\n\n"
     "NLTK's `movie_reviews` has 2 000 documents already split by `pos` / `neg` "
     "categories. Each document is pre-tokenised into a list of words."),
    ("code",
     "from nltk.corpus import movie_reviews\n\n"
     "random.seed(42)\n"
     "docs = [(movie_reviews.words(fid), cat)\n"
     "        for cat in movie_reviews.categories()\n"
     "        for fid in movie_reviews.fileids(cat)]\n"
     "random.shuffle(docs)\n\n"
     "print(f'Total reviews : {len(docs)}')\n"
     "print(f'Categories    : {movie_reviews.categories()}')\n"
     "print(f'First 10 words: {list(docs[0][0])[:10]}')\n"
     "print(f'Label         : {docs[0][1]}')"),
    ("md",
     "## Step 3: Build a Vocabulary\n\n"
     "Cap at `MAX_VOCAB = 10 000` most frequent words. Reserve index 0 for `<PAD>` "
     "and index 1 for `<UNK>` (unknown words)."),
    ("code",
     "MAX_VOCAB = 10000\n"
     "MAX_LEN   = 200   # words per review\n\n"
     "# TODO: count all lowercase words across all docs\n"
     "all_words = ...\n"
     "freq      = Counter(all_words)\n\n"
     "# TODO: build vocab dict {'<PAD>':0, '<UNK>':1, word:idx, ...}\n"
     "vocab = {'<PAD>': 0, '<UNK>': 1}\n"
     "# add the top MAX_VOCAB-2 words\n\n"
     "print(f'Vocab size: {len(vocab)}')\n"
     "print(f'Top 10   : {freq.most_common(10)}')"),
    ("md",
     "## Step 4: Encode Reviews and Pad/Truncate\n\n"
     "Map each word to its vocab index (1 = UNK if unseen). Pad with 0s or truncate "
     "so every review is exactly `MAX_LEN` words."),
    ("code",
     "def encode(words, vocab, max_len):\n"
     "    # TODO: convert words to indices; truncate/pad to max_len\n"
     "    tokens = ...\n"
     "    return tokens\n\n"
     "X_data = [encode(ws, vocab, MAX_LEN) for ws, _ in docs]\n"
     "y_data = [1 if label == 'pos' else 0 for _, label in docs]\n\n"
     "X_tensor = torch.tensor(X_data, dtype=torch.long)\n"
     "y_tensor = torch.tensor(y_data, dtype=torch.float32)\n"
     "print('X:', X_tensor.shape, '  y:', y_tensor.shape)"),
    ("md", "## Step 5: Train / Test Split and DataLoaders"),
    ("code",
     "split = int(0.8 * len(X_tensor))\n"
     "X_train, X_test = X_tensor[:split], X_tensor[split:]\n"
     "y_train, y_test = y_tensor[:split], y_tensor[split:]\n\n"
     "# TODO: wrap in TensorDataset and create DataLoaders\n"
     "# batch_size=32, shuffle train set\n"
     "train_loader = ...\n"
     "test_loader  = ...\n"
     "print(f'Train batches: {len(train_loader)}  Test batches: {len(test_loader)}')"),
    ("md",
     "## Step 6: Define the CNN Model\n\n"
     "- `nn.Embedding(vocab_size, embed_dim)` — learnable word vectors\n"
     "- `nn.Conv1d(embed_dim, num_filters, k)` — detect k-gram patterns (k=3,4,5)\n"
     "- Global max pool across sequence — captures the strongest signal\n"
     "- `nn.Dropout(0.5)` — regularisation\n"
     "- `nn.Linear(num_filters * num_kernels, 1)` + sigmoid\n\n"
     "⚠️ Embedding output is `(batch, seq, embed)` but Conv1d needs "
     "`(batch, embed, seq)` — remember to `.permute(0, 2, 1)`."),
    ("code",
     "class SentimentCNN(nn.Module):\n"
     "    def __init__(self, vocab_size, embed_dim=64, num_filters=128, kernel_sizes=(3,4,5)):\n"
     "        super().__init__()\n"
     "        # TODO: embedding, convs (ModuleList), dropout, fc\n"
     "        self.embedding = ...\n"
     "        self.convs      = ...\n"
     "        self.dropout    = ...\n"
     "        self.fc         = ...\n\n"
     "    def forward(self, x):\n"
     "        x = self.embedding(x)       # (B, L, E)\n"
     "        x = x.permute(0, 2, 1)     # (B, E, L)  for Conv1d\n"
     "        # TODO: conv+relu, global max pool, concat, dropout, fc, sigmoid\n"
     "        ...\n\n"
     "vocab_size = len(vocab)\n"
     "model = SentimentCNN(vocab_size).to(device)\n"
     "print(model)"),
    ("md", "## Step 7: Train the Model"),
    ("code",
     "criterion = nn.BCELoss()\n"
     "optimizer = optim.Adam(model.parameters(), lr=0.001)\n\n"
     "for epoch in range(10):\n"
     "    model.train()\n"
     "    total_loss = 0\n"
     "    for Xb, yb in train_loader:\n"
     "        Xb, yb = Xb.to(device), yb.to(device)\n"
     "        # TODO: forward, loss, zero_grad, backward, step\n"
     "        ...\n"
     "    print(f'Epoch {epoch+1:2d} | Loss: {total_loss/len(train_loader):.4f}')"),
    ("md", "## Step 8: Evaluate on Test Set"),
    ("code",
     "model.eval()\n"
     "correct = total = 0\n"
     "with torch.no_grad():\n"
     "    for Xb, yb in test_loader:\n"
     "        Xb, yb = Xb.to(device), yb.to(device)\n"
     "        # TODO: get predictions, count correct\n"
     "        ...\n"
     "print(f'Test accuracy: {correct/total*100:.1f}%')"),
    ("md", "## Step 9: Predict on a New Review"),
    ("code",
     "def predict(text, model, vocab, max_len, device):\n"
     "    model.eval()\n"
     "    with torch.no_grad():\n"
     "        tokens = [vocab.get(w.lower(), 1) for w in text.split()][:max_len]\n"
     "        tokens += [0] * (max_len - len(tokens))\n"
     "        x = torch.tensor([tokens], dtype=torch.long, device=device)\n"
     "        prob = model(x).item()\n"
     "        return f'positive ({prob:.2f})' if prob >= 0.5 else f'negative ({prob:.2f})'\n\n"
     "print(predict('This film was absolutely wonderful and moving', model, vocab, MAX_LEN, device))\n"
     "print(predict('Terrible waste of time, boring and predictable', model, vocab, MAX_LEN, device))"),
]
write(BASE / "03_cnn_sentiment/prompt.ipynb", nb(cells_03_prompt))

# --- SOLUTION ---
cells_03_sol = [
    ("md", INTRO_03 + "\n\n**(SOLUTION)**"),
    ("md", "## Step 1: Imports"),
    ("code",
     "import torch\n"
     "import torch.nn as nn\n"
     "import torch.nn.functional as F\n"
     "import torch.optim as optim\n"
     "from torch.utils.data import TensorDataset, DataLoader\n"
     "import nltk\n"
     "import random\n"
     "from collections import Counter\n"
     "import matplotlib.pyplot as plt\n\n"
     "device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')\n"
     "print('device:', device)"),
    ("md", "## Step 2: Load the Movie Reviews Corpus"),
    ("code",
     "from nltk.corpus import movie_reviews\n\n"
     "random.seed(42)\n"
     "docs = [(movie_reviews.words(fid), cat)\n"
     "        for cat in movie_reviews.categories()\n"
     "        for fid in movie_reviews.fileids(cat)]\n"
     "random.shuffle(docs)\n\n"
     "print(f'Total reviews : {len(docs)}')\n"
     "print(f'Categories    : {movie_reviews.categories()}')\n"
     "print(f'Sample words  : {list(docs[0][0])[:10]}')\n"
     "print(f'Label         : {docs[0][1]}')"),
    ("md", "## Step 3: Build a Vocabulary"),
    ("code",
     "MAX_VOCAB = 10000  # cap vocabulary; tail words are rare and add noise\n"
     "MAX_LEN   = 200    # truncate/pad all reviews to this length → fixed-size input tensor\n\n"
     "all_words = [w.lower() for ws, _ in docs for w in ws]\n"
     "freq      = Counter(all_words)\n"
     "# Index 0 = <PAD>: embedding's padding_idx=0 zeroes this vector out (no signal)\n"
     "# Index 1 = <UNK>: any word outside the top 9998 maps here\n"
     "vocab = {'<PAD>': 0, '<UNK>': 1}\n"
     "for w, _ in freq.most_common(MAX_VOCAB - 2):\n"
     "    vocab[w] = len(vocab)\n\n"
     "print(f'Vocab size: {len(vocab)}')\n"
     "print(f'Top 10   : {freq.most_common(10)}')"),
    ("md", "## Step 4: Encode and Pad"),
    ("code",
     "def encode(words, vocab, max_len):\n"
     "    tokens = [vocab.get(w.lower(), 1) for w in words][:max_len]  # truncate at 200\n"
     "    tokens += [0] * (max_len - len(tokens))  # pad shorter reviews with <PAD>=0\n"
     "    return tokens  # list of exactly max_len integers\n\n"
     "X_data = [encode(ws, vocab, MAX_LEN) for ws, _ in docs]\n"
     "y_data = [1 if label == 'pos' else 0 for _, label in docs]\n\n"
     "# X_tensor: (2000, 200) — 2000 reviews × 200 word indices; dtype=long for nn.Embedding\n"
     "X_tensor = torch.tensor(X_data, dtype=torch.long)\n"
     "# y_tensor: (2000,) — float32 scalar per review for BCELoss\n"
     "y_tensor = torch.tensor(y_data, dtype=torch.float32)\n"
     "print('X:', X_tensor.shape, '  y:', y_tensor.shape)"),
    ("md", "## Step 5: Train / Test Split and DataLoaders"),
    ("code",
     "split = int(0.8 * len(X_tensor))         # 1600 train / 400 test\n"
     "X_train, X_test = X_tensor[:split], X_tensor[split:]  # (1600,200) / (400,200)\n"
     "y_train, y_test = y_tensor[:split], y_tensor[split:]  # (1600,)   / (400,)\n\n"
     "# Each batch yields Xb (32, 200) word indices and yb (32,) labels\n"
     "train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=32, shuffle=True)\n"
     "test_loader  = DataLoader(TensorDataset(X_test,  y_test),  batch_size=32)\n"
     "print(f'Train batches: {len(train_loader)}  Test batches: {len(test_loader)}')"),
    ("md", "## Step 6: Define the CNN Model"),
    ("code",
     "class SentimentCNN(nn.Module):\n"
     "    def __init__(self, vocab_size, embed_dim=64, num_filters=128, kernel_sizes=(3,4,5)):\n"
     "        super().__init__()\n"
     "        # Embedding: lookup table shape (vocab_size, 64)\n"
     "        # maps each integer index → a 64-d learned vector: (B,200) → (B,200,64)\n"
     "        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)\n"
     "        # Conv1d(in_channels, out_channels, kernel_size)\n"
     "        #   in_channels = embed_dim (64) — one channel per embedding dimension\n"
     "        #   kernel_sizes 3,4,5 detect trigrams, 4-grams, 5-grams\n"
     "        self.convs      = nn.ModuleList(\n"
     "            [nn.Conv1d(embed_dim, num_filters, k) for k in kernel_sizes]\n"
     "        )\n"
     "        self.dropout = nn.Dropout(0.5)  # applied to the 384-d concatenated vector\n"
     "        # 128 filters × 3 kernel sizes = 384 total features → 1 output logit\n"
     "        self.fc      = nn.Linear(num_filters * len(kernel_sizes), 1)\n\n"
     "    def forward(self, x):                              # x: (B, 200) word indices\n"
     "        x = self.embedding(x)                          # → (B, 200, 64) word vectors\n"
     "        x = x.permute(0, 2, 1)                         # → (B, 64, 200) Conv1d needs (B,C,L)\n"
     "        # Conv1d kernel k: (B,64,200) → (B,128,200-k+1)\n"
     "        # .max(dim=-1).values: global max pool over length → (B, 128)\n"
     "        pooled = [F.relu(conv(x)).max(dim=-1).values for conv in self.convs]\n"
     "        cat = self.dropout(torch.cat(pooled, dim=1))   # cat 3×(B,128) → (B,384)\n"
     "        return torch.sigmoid(self.fc(cat))              # (B,384) → (B,1) probability\n\n"
     "vocab_size = len(vocab)\n"
     "model = SentimentCNN(vocab_size).to(device)\n"
     "print(model)"),
    ("md", "## Step 7: Train"),
    ("code",
     "criterion  = nn.BCELoss()\n"
     "optimizer  = optim.Adam(model.parameters(), lr=0.001)\n"
     "train_losses = []\n\n"
     "for epoch in range(10):\n"
     "    model.train()\n"
     "    total_loss = 0\n"
     "    for Xb, yb in train_loader:\n"
     "        Xb, yb = Xb.to(device), yb.to(device)  # Xb: (32,200)  yb: (32,)\n"
     "        out  = model(Xb).squeeze()  # model → (32,1); squeeze → (32,) to match yb\n"
     "        loss = criterion(out, yb)   # BCELoss: element-wise, then mean → scalar\n"
     "        optimizer.zero_grad()\n"
     "        loss.backward()\n"
     "        optimizer.step()\n"
     "        total_loss += loss.item()\n"
     "    avg = total_loss / len(train_loader)\n"
     "    train_losses.append(avg)\n"
     "    print(f'Epoch {epoch+1:2d} | Loss: {avg:.4f}')"),
    ("md", "## Step 8: Evaluate"),
    ("code",
     "model.eval()\n"
     "correct = total = 0\n"
     "with torch.no_grad():\n"
     "    for Xb, yb in test_loader:\n"
     "        Xb, yb = Xb.to(device), yb.to(device)\n"
     "        preds = torch.round(model(Xb).squeeze())  # (32,1)→(32,), threshold at 0.5\n"
     "        correct += (preds == yb).sum().item()       # count matches in this batch\n"
     "        total   += yb.size(0)                       # accumulate total samples\n"
     "print(f'Test accuracy: {correct/total*100:.1f}%')"),
    ("md", "## Step 9: Predict on a New Review"),
    ("code",
     "def predict(text, model, vocab, max_len, device):\n"
     "    model.eval()\n"
     "    with torch.no_grad():\n"
     "        tokens = [vocab.get(w.lower(), 1) for w in text.split()][:max_len]\n"
     "        tokens += [0] * (max_len - len(tokens))\n"
     "        x = torch.tensor([tokens], dtype=torch.long, device=device)\n"
     "        prob = model(x).item()\n"
     "        return f'positive ({prob:.2f})' if prob >= 0.5 else f'negative ({prob:.2f})'\n\n"
     "print(predict('This film was absolutely wonderful and moving', model, vocab, MAX_LEN, device))\n"
     "print(predict('Terrible waste of time, boring and predictable', model, vocab, MAX_LEN, device))"),
    ("md", "## Step 10: Visualize the CNN Architecture"),
    ("code", VIZ_CNN),
    ("md", "## Step 11: Plot Training Loss"),
    ("code",
     "plt.figure(figsize=(8, 4))\n"
     "plt.plot(range(1, len(train_losses)+1), train_losses, 'o-', color='#a29bfe', linewidth=2)\n"
     "plt.xlabel('Epoch')\n"
     "plt.ylabel('BCE Loss')\n"
     "plt.title('CNN Sentiment — Training Loss (movie_reviews)')\n"
     "plt.grid(alpha=0.3)\n"
     "plt.tight_layout()\n"
     "plt.show()"),
]
write(BASE / "03_cnn_sentiment/solution.ipynb", nb(cells_03_sol))


# ─────────────────────────────────────────────
# LESSON 04 — RNN  (FULL REWRITE, Alice in Wonderland, batched)
# ─────────────────────────────────────────────
print("Lesson 04 …")

INTRO_04 = (
    "# RNNs with PyTorch — Character-Level Language Model\n\n"
    "An RNN processes a sequence one step at a time, maintaining a **hidden state** "
    "that summarises past context: `h_t = f(x_t, h_{t-1})`.\n\n"
    "**Corpus**: *Alice's Adventures in Wonderland* (Lewis Carroll, 1865) via NLTK Gutenberg.\n\n"
    "We train a character-level model: given the last 100 characters, predict the next one. "
    "After training we can generate new text by feeding predictions back as input."
)

# --- PROMPT ---
cells_04_prompt = [
    ("md", INTRO_04),
    ("md", "## Step 1: Imports"),
    ("code",
     "import torch\n"
     "import torch.nn as nn\n"
     "import torch.optim as optim\n"
     "from torch.utils.data import TensorDataset, DataLoader\n"
     "from nltk.corpus import gutenberg\n\n"
     "device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')\n"
     "print('device:', device)"),
    ("md",
     "## Step 2: Load and Inspect the Corpus\n\n"
     "We take the first 80 000 characters of *Alice* — enough text to learn real "
     "English structure while keeping training fast."),
    ("code",
     "text = gutenberg.raw('carroll-alice.txt')[:80000]\n\n"
     "# Build character vocabulary\n"
     "char2idx = {ch: i for i, ch in enumerate(sorted(set(text)))}\n"
     "idx2char  = {i: ch for ch, i in char2idx.items()}\n"
     "vocab_size = len(char2idx)\n\n"
     "print(f'Characters : {len(text):,}')\n"
     "print(f'Vocab size : {vocab_size} unique chars')\n"
     "print(f'Sample     : {text[:120]!r}')"),
    ("md",
     "## Step 3: Create Training Sequences\n\n"
     "Slide a window of length `SEQ_LEN=100` across the text with step `STRIDE=5`, "
     "producing *(input, target)* pairs where target is the input shifted by one position."),
    ("code",
     "SEQ_LEN = 100\n"
     "STRIDE  = 5\n\n"
     "data = [char2idx[c] for c in text]\n\n"
     "# TODO: build X_seqs and y_seqs lists of lists\n"
     "# X_seqs[i] = data[i*STRIDE : i*STRIDE + SEQ_LEN]\n"
     "# y_seqs[i] = data[i*STRIDE+1 : i*STRIDE + SEQ_LEN + 1]\n"
     "X_seqs = ...\n"
     "y_seqs = ...\n\n"
     "X_tensor = torch.tensor(X_seqs, dtype=torch.long)\n"
     "y_tensor = torch.tensor(y_seqs, dtype=torch.long)\n"
     "print(f'Sequences: {len(X_seqs):,}  X:{X_tensor.shape}  y:{y_tensor.shape}')"),
    ("md",
     "## Step 4: DataLoader\n\n"
     "Batch the sequences. We shuffle here because the model will still see the "
     "correct temporal ordering *within* each sequence."),
    ("code",
     "# TODO: create TensorDataset + DataLoader with batch_size=128, shuffle=True\n"
     "train_loader = ...\n"
     "print(f'Batches per epoch: {len(train_loader)}')"),
    ("md",
     "## Step 5: Define the RNN Model\n\n"
     "Instead of one-hot encoding, we use `nn.Embedding` to map each character index "
     "to a learned dense vector. This is more compact and gives the model more expressive power.\n\n"
     "`nn.RNN(embed_dim, hidden_size, num_layers, batch_first=True)` returns "
     "`(output, h_n)` where `output` has shape `(batch, seq_len, hidden_size)`."),
    ("code",
     "class CharRNN(nn.Module):\n"
     "    def __init__(self, vocab_size, embed_dim=64, hidden_size=256, num_layers=2):\n"
     "        super().__init__()\n"
     "        self.hidden_size = hidden_size\n"
     "        self.num_layers  = num_layers\n"
     "        # TODO: embedding, rnn (with dropout=0.3), fc\n"
     "        self.embedding = ...\n"
     "        self.rnn       = ...\n"
     "        self.fc        = ...\n\n"
     "    def forward(self, x, hidden=None):\n"
     "        x = self.embedding(x)            # (B, L, E)\n"
     "        out, hidden = self.rnn(x, hidden) # out: (B, L, H)\n"
     "        # TODO: pass through fc to get logits (B, L, vocab_size)\n"
     "        logits = ...\n"
     "        return logits, hidden\n\n"
     "    def init_hidden(self, batch_size, device):\n"
     "        return torch.zeros(self.num_layers, batch_size, self.hidden_size, device=device)\n\n"
     "model = CharRNN(vocab_size).to(device)\n"
     "print(model)\n"
     "print('Parameters:', sum(p.numel() for p in model.parameters()))"),
    ("md",
     "## Step 6: Training Loop\n\n"
     "Key details:\n"
     "- Reshape logits to `(B*L, vocab_size)` and targets to `(B*L,)` for `CrossEntropyLoss`\n"
     "- **Gradient clipping** (`clip_grad_norm_`) prevents exploding gradients — a common "
     "  problem with RNNs on long sequences"),
    ("code",
     "criterion = nn.CrossEntropyLoss()\n"
     "optimizer = optim.Adam(model.parameters(), lr=0.002)\n\n"
     "for epoch in range(30):\n"
     "    model.train()\n"
     "    total_loss = 0\n"
     "    for Xb, yb in train_loader:\n"
     "        Xb, yb = Xb.to(device), yb.to(device)\n"
     "        # TODO: forward pass\n"
     "        logits, _ = ...\n"
     "        # TODO: reshape and compute loss\n"
     "        loss = ...\n"
     "        optimizer.zero_grad()\n"
     "        loss.backward()\n"
     "        # TODO: clip gradients (max_norm=1.0)\n"
     "        ...\n"
     "        optimizer.step()\n"
     "        total_loss += loss.item()\n"
     "    if (epoch + 1) % 5 == 0:\n"
     "        print(f'Epoch {epoch+1:2d} | Loss: {total_loss/len(train_loader):.4f}')"),
    ("md",
     "## Step 7: Generate Text\n\n"
     "Feed a seed string to warm up the hidden state, then sample "
     "character by character. The `temperature` parameter controls randomness: "
     "lower = more conservative, higher = more creative."),
    ("code",
     "def generate(model, seed_text, char2idx, idx2char, length=400,\n"
     "             temperature=0.8, device='cpu'):\n"
     "    model.eval()\n"
     "    with torch.no_grad():\n"
     "        hidden = model.init_hidden(1, device)\n"
     "        # Warm up with seed (all chars except last)\n"
     "        for ch in seed_text[:-1]:\n"
     "            # TODO: forward pass for each seed char\n"
     "            ...\n"
     "        result = seed_text\n"
     "        current = seed_text[-1]\n"
     "        for _ in range(length):\n"
     "            # TODO: encode current char, forward, sample next char\n"
     "            ...\n"
     "    return result\n\n"
     "print(generate(model, 'Alice ', char2idx, idx2char, length=400,\n"
     "               temperature=0.8, device=str(device)))"),
    ("md", "## Step 8: Experiment with Temperature"),
    ("code",
     "# Low temperature — more predictable / repetitive\n"
     "print('=== temperature=0.5 ===')\n"
     "print(generate(model, 'The ', char2idx, idx2char, 200, temperature=0.5, device=str(device)))\n\n"
     "# High temperature — more random / creative\n"
     "print('\\n=== temperature=1.2 ===')\n"
     "print(generate(model, 'The ', char2idx, idx2char, 200, temperature=1.2, device=str(device)))"),
]
write(BASE / "04_rnn_pytorch/prompt.ipynb", nb(cells_04_prompt))

# --- SOLUTION ---
cells_04_sol = [
    ("md", INTRO_04 + "\n\n**(SOLUTION)**"),
    ("md", "## Step 1: Imports"),
    ("code",
     "import torch\n"
     "import torch.nn as nn\n"
     "import torch.optim as optim\n"
     "from torch.utils.data import TensorDataset, DataLoader\n"
     "from nltk.corpus import gutenberg\n"
     "import matplotlib.pyplot as plt\n\n"
     "device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')\n"
     "print('device:', device)"),
    ("md", "## Step 2: Load Corpus"),
    ("code",
     "text = gutenberg.raw('carroll-alice.txt')[:80000]\n\n"
     "char2idx  = {ch: i for i, ch in enumerate(sorted(set(text)))}\n"
     "idx2char  = {i: ch for ch, i in char2idx.items()}\n"
     "vocab_size = len(char2idx)\n\n"
     "print(f'Characters : {len(text):,}')\n"
     "print(f'Vocab size : {vocab_size}')\n"
     "print(f'Sample     : {text[:120]!r}')"),
    ("md", "## Step 3: Create Training Sequences"),
    ("code",
     "SEQ_LEN = 100  # each sample = 100 chars; longer = more context but slower\n"
     "STRIDE  = 5    # slide window by 5 chars → lots of overlapping samples for training\n\n"
     "data   = [char2idx[c] for c in text]  # encode entire text as integer indices\n"
     "# X_seqs[i] = chars at positions i through i+99\n"
     "# y_seqs[i] = X_seqs[i] shifted right by 1 — the target at every step is the next char\n"
     "X_seqs = [data[i:i+SEQ_LEN]   for i in range(0, len(data)-SEQ_LEN-1, STRIDE)]\n"
     "y_seqs = [data[i+1:i+SEQ_LEN+1] for i in range(0, len(data)-SEQ_LEN-1, STRIDE)]\n\n"
     "# X_tensor: (num_seqs, 100) — dtype=long required by nn.Embedding\n"
     "# y_tensor: (num_seqs, 100) — dtype=long required by CrossEntropyLoss\n"
     "X_tensor = torch.tensor(X_seqs, dtype=torch.long)\n"
     "y_tensor = torch.tensor(y_seqs, dtype=torch.long)\n"
     "print(f'Sequences: {len(X_seqs):,}  X:{X_tensor.shape}  y:{y_tensor.shape}')"),
    ("md", "## Step 4: DataLoader"),
    ("code",
     "# Each batch: Xb (128, 100) char sequences, yb (128, 100) target sequences\n"
     "# shuffle=True is safe — temporal order is preserved *within* each 100-char sequence\n"
     "train_loader = DataLoader(\n"
     "    TensorDataset(X_tensor, y_tensor),\n"
     "    batch_size=128, shuffle=True\n"
     ")\n"
     "print(f'Batches per epoch: {len(train_loader)}')"),
    ("md", "## Step 5: Define the Model"),
    ("code",
     "class CharRNN(nn.Module):\n"
     "    def __init__(self, vocab_size, embed_dim=64, hidden_size=256, num_layers=2):\n"
     "        super().__init__()\n"
     "        self.hidden_size = hidden_size\n"
     "        self.num_layers  = num_layers\n"
     "        # Embedding: (vocab_size, 64) lookup table; (B,L) → (B,L,64)\n"
     "        self.embedding   = nn.Embedding(vocab_size, embed_dim)\n"
     "        # RNN: reads 64-d input, maintains 256-d hidden state, 2 stacked layers\n"
     "        # output: (B, L, 256)  hidden h: (num_layers, B, 256)\n"
     "        self.rnn         = nn.RNN(embed_dim, hidden_size, num_layers,\n"
     "                                  batch_first=True, dropout=0.3)\n"
     "        # fc maps each timestep's hidden state to a distribution over all characters\n"
     "        self.fc          = nn.Linear(hidden_size, vocab_size)  # (B,L,256)→(B,L,vocab_size)\n\n"
     "    def forward(self, x, hidden=None):    # x: (B, L) char indices\n"
     "        x      = self.embedding(x)         # → (B, L, 64)\n"
     "        out, h = self.rnn(x, hidden)       # out: (B,L,256)  h: (num_layers,B,256)\n"
     "        return self.fc(out), h             # logits: (B, L, vocab_size)\n\n"
     "    def init_hidden(self, batch_size, device):\n"
     "        # one hidden vector per layer per sample in the batch\n"
     "        return torch.zeros(self.num_layers, batch_size, self.hidden_size, device=device)\n\n"
     "model = CharRNN(vocab_size).to(device)\n"
     "print(model)\n"
     "print('Parameters:', sum(p.numel() for p in model.parameters()))"),
    ("md", "## Step 6: Training Loop"),
    ("code",
     "criterion   = nn.CrossEntropyLoss()\n"
     "optimizer   = optim.Adam(model.parameters(), lr=0.002)\n"
     "epoch_losses = []\n\n"
     "for epoch in range(30):\n"
     "    model.train()\n"
     "    total_loss = 0\n"
     "    for Xb, yb in train_loader:\n"
     "        Xb, yb = Xb.to(device), yb.to(device)    # Xb: (128,100)  yb: (128,100)\n"
     "        logits, _ = model(Xb)                      # logits: (128, 100, vocab_size)\n"
     "        # CrossEntropyLoss needs (N, C) logits and (N,) targets\n"
     "        # view(-1, vocab_size): (128*100, vocab_size) — flatten batch×time\n"
     "        # yb.view(-1):          (128*100,) — one target index per position\n"
     "        loss = criterion(logits.view(-1, vocab_size), yb.view(-1))\n"
     "        optimizer.zero_grad()\n"
     "        loss.backward()\n"
     "        # Gradient clipping: rescales gradients if their total norm > 1.0\n"
     "        # prevents the exploding gradient problem common in RNNs on long sequences\n"
     "        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)\n"
     "        optimizer.step()\n"
     "        total_loss += loss.item()\n"
     "    avg = total_loss / len(train_loader)\n"
     "    epoch_losses.append(avg)\n"
     "    if (epoch + 1) % 5 == 0:\n"
     "        print(f'Epoch {epoch+1:2d} | Loss: {avg:.4f}')"),
    ("md", "## Step 7: Generate Text"),
    ("code",
     "def generate(model, seed_text, char2idx, idx2char, length=400,\n"
     "             temperature=0.8, device='cpu'):\n"
     "    model.eval()\n"
     "    with torch.no_grad():\n"
     "        hidden = model.init_hidden(1, device)  # (2, 1, 256) — batch_size=1\n"
     "        # Feed seed chars to build a meaningful hidden state before generating\n"
     "        for ch in seed_text[:-1]:\n"
     "            x = torch.tensor([[char2idx.get(ch, 0)]], dtype=torch.long, device=device)  # (1,1)\n"
     "            _, hidden = model(x, hidden)  # discard logits, keep updated hidden state\n"
     "        result  = seed_text\n"
     "        current = seed_text[-1]\n"
     "        for _ in range(length):\n"
     "            x = torch.tensor([[char2idx.get(current, 0)]], dtype=torch.long, device=device)  # (1,1)\n"
     "            logits, hidden = model(x, hidden)   # logits: (1, 1, vocab_size)\n"
     "            # squeeze → (vocab_size,); divide by temperature to sharpen or soften distribution\n"
     "            probs  = torch.softmax(logits.squeeze() / temperature, dim=0)\n"
     "            next_i = torch.multinomial(probs, 1).item()  # sample (not argmax) for variety\n"
     "            current = idx2char[next_i]\n"
     "            result += current\n"
     "    return result\n\n"
     "print(generate(model, 'Alice ', char2idx, idx2char, 400, 0.8, str(device)))"),
    ("md", "## Step 8: Experiment with Temperature"),
    ("code",
     "print('=== temperature=0.5 (focused) ===')\n"
     "print(generate(model, 'The ', char2idx, idx2char, 200, 0.5, str(device)))\n\n"
     "print('\\n=== temperature=1.2 (creative) ===')\n"
     "print(generate(model, 'The ', char2idx, idx2char, 200, 1.2, str(device)))"),
    ("md", "## Step 9: Visualize the RNN Architecture"),
    ("code", VIZ_RNN),
    ("md", "## Step 10: Plot Training Loss"),
    ("code",
     "plt.figure(figsize=(8, 4))\n"
     "plt.plot(range(1, len(epoch_losses)+1), epoch_losses, 'o-', color='#55efc4', linewidth=2)\n"
     "plt.xlabel('Epoch')\n"
     "plt.ylabel('Cross-Entropy Loss')\n"
     "plt.title('RNN — Training Loss (Alice in Wonderland)')\n"
     "plt.grid(alpha=0.3)\n"
     "plt.tight_layout()\n"
     "plt.show()"),
]
write(BASE / "04_rnn_pytorch/solution.ipynb", nb(cells_04_sol))


# ─────────────────────────────────────────────
# LESSON 05 — LSTM  (solution: add viz + MPS)
# ─────────────────────────────────────────────
print("Lesson 05 …")
cells_05_sol = [
    ("md",
     "# LSTMs with PyTorch — Sine Wave Prediction (SOLUTION)\n\n"
     "LSTM adds a **cell state** `c_t` (long-term memory) and three gates to the "
     "vanilla RNN, solving the vanishing gradient problem.\n\n"
     "Primary task: **time-series regression** on a synthetic sine wave."),
    ("md", "## Step 1: Imports"),
    ("code",
     "import torch\n"
     "import torch.nn as nn\n"
     "import torch.optim as optim\n"
     "from torch.utils.data import TensorDataset, DataLoader\n"
     "import numpy as np\n"
     "import matplotlib.pyplot as plt\n\n"
     "device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')\n"
     "print('device:', device)"),
    ("md", "## Step 2: Generate Sine Wave"),
    ("code",
     "t    = np.linspace(0, 4 * np.pi, 200)  # 200 evenly spaced steps over two full cycles\n"
     "data = np.sin(t).astype(np.float32)    # (200,) float32; values in [-1.0, 1.0]\n"
     "print(f'data shape: {data.shape}  min={data.min():.2f}  max={data.max():.2f}')"),
    ("md", "## Step 3: Sliding Window Sequences"),
    ("code",
     "def create_sequences(data, seq_len=20):\n"
     "    xs, ys = [], []\n"
     "    for i in range(len(data) - seq_len):\n"
     "        xs.append(data[i:i+seq_len].reshape(seq_len, 1))  # (20, 1): 20 timesteps, 1 feature\n"
     "        ys.append(data[i+seq_len].reshape(1))              # (1,): scalar target value\n"
     "    return torch.tensor(np.array(xs)), torch.tensor(np.array(ys))\n\n"
     "X, y = create_sequences(data, seq_len=20)\n"
     "# X: (180, 20, 1) — 180 sliding windows, each 20 timesteps with 1 feature per step\n"
     "# y: (180, 1)     — one target (the 21st value) per window\n"
     "print('X:', X.shape, '  y:', y.shape)"),
    ("md", "## Step 4: Train / Test Split"),
    ("code",
     "split = int(0.8 * len(X))  # 144 train / 36 test\n"
     "X_train, X_test = X[:split].to(device), X[split:].to(device)  # (144,20,1) / (36,20,1)\n"
     "y_train, y_test = y[:split].to(device), y[split:].to(device)  # (144,1)    / (36,1)\n"
     "print(f'Train: {X_train.shape}  Test: {X_test.shape}')"),
    ("md",
     "## Step 5: Define the LSTM Model\n\n"
     "`nn.LSTM` returns `(output, (h_n, c_n))` — the extra `c_n` (cell state) is "
     "the key difference from `nn.RNN`."),
    ("code",
     "class SineLSTM(nn.Module):\n"
     "    def __init__(self, input_size=1, hidden_size=32, num_layers=2):\n"
     "        super().__init__()\n"
     "        # LSTM: input_size=1 (one value per timestep), hidden_size=32\n"
     "        # unlike nn.RNN, returns (output, (h_n, c_n)) — cell state c_n is the extra piece\n"
     "        # output: (B, seq_len, 32)  h_n and c_n: each (num_layers, B, 32)\n"
     "        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)\n"
     "        # We only need the last timestep's output for regression: 32 features → 1 value\n"
     "        self.fc   = nn.Linear(hidden_size, 1)\n\n"
     "    def forward(self, x):                    # x: (B, 20, 1)\n"
     "        out, _ = self.lstm(x)                # out: (B, 20, 32)  _=(h_n,c_n) discarded\n"
     "        return self.fc(out[:, -1, :])        # out[:,-1,:]: (B,32) → fc → (B,1)\n\n"
     "model = SineLSTM().to(device)\n"
     "print(model)"),
    ("md", "## Step 6: Train"),
    ("code",
     "train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=16, shuffle=True)\n"
     "criterion    = nn.MSELoss()   # regression loss: mean squared error over (B,1) predictions\n"
     "optimizer    = optim.Adam(model.parameters(), lr=0.001)\n"
     "epoch_losses = []\n\n"
     "for epoch in range(100):\n"
     "    model.train()\n"
     "    total = 0\n"
     "    for Xb, yb in train_loader:\n"
     "        pred = model(Xb)            # Xb: (16,20,1) → pred: (16,1)\n"
     "        loss = criterion(pred, yb)  # yb: (16,1) — MSELoss averages over all elements\n"
     "        optimizer.zero_grad()\n"
     "        loss.backward()\n"
     "        optimizer.step()\n"
     "        total += loss.item()\n"
     "    avg = total / len(train_loader)\n"
     "    epoch_losses.append(avg)\n"
     "    if epoch % 10 == 0:\n"
     "        print(f'Epoch {epoch:3d} | Loss: {avg:.6f}')"),
    ("md", "## Step 7: Evaluate"),
    ("code",
     "model.eval()\n"
     "with torch.no_grad():\n"
     "    test_pred = model(X_test)\n"
     "    test_loss = criterion(test_pred, y_test)\n"
     "print(f'Test MSE: {test_loss.item():.6f}')"),
    ("md", "## Step 8: Visualize Predictions vs Actuals"),
    ("code",
     "model.eval()\n"
     "with torch.no_grad():\n"
     "    preds   = model(X_test).cpu().squeeze().numpy()\n"
     "    actuals = y_test.cpu().squeeze().numpy()\n\n"
     "plt.figure(figsize=(12, 4))\n"
     "plt.plot(actuals, label='Actual',    linewidth=2, color='#74b9ff')\n"
     "plt.plot(preds,   label='Predicted', linewidth=2, linestyle='--', color='#fd79a8')\n"
     "plt.legend()\n"
     "plt.title('LSTM Sine Wave Prediction')\n"
     "plt.xlabel('Test timestep')\n"
     "plt.ylabel('Value')\n"
     "plt.grid(alpha=0.3)\n"
     "plt.tight_layout()\n"
     "plt.show()"),
    ("md", "## Step 9: Compare LSTM vs vanilla RNN"),
    ("code",
     "class SineRNN(nn.Module):\n"
     "    def __init__(self):\n"
     "        super().__init__()\n"
     "        # nn.RNN returns (output, h_n) — no cell state c_n, unlike LSTM\n"
     "        # same interface otherwise: output (B, 20, 32), same fc\n"
     "        self.rnn = nn.RNN(1, 32, 2, batch_first=True)\n"
     "        self.fc  = nn.Linear(32, 1)\n"
     "    def forward(self, x):              # x: (B, 20, 1)\n"
     "        out, _ = self.rnn(x)           # out: (B, 20, 32)\n"
     "        return self.fc(out[:, -1, :])  # → (B, 1)\n\n"
     "rnn_model = SineRNN().to(device)\n"
     "opt_rnn   = optim.Adam(rnn_model.parameters(), lr=0.001)\n"
     "rnn_losses = []\n\n"
     "for epoch in range(100):\n"
     "    rnn_model.train()\n"
     "    total = 0\n"
     "    for Xb, yb in train_loader:\n"
     "        pred = rnn_model(Xb)\n"
     "        loss = criterion(pred, yb)\n"
     "        opt_rnn.zero_grad()\n"
     "        loss.backward()\n"
     "        opt_rnn.step()\n"
     "        total += loss.item()\n"
     "    rnn_losses.append(total / len(train_loader))\n\n"
     "rnn_model.eval()\n"
     "with torch.no_grad():\n"
     "    rnn_test_loss = criterion(rnn_model(X_test), y_test)\n\n"
     "print(f'LSTM test MSE: {test_loss.item():.6f}')\n"
     "print(f'RNN  test MSE: {rnn_test_loss.item():.6f}')\n\n"
     "plt.figure(figsize=(8, 4))\n"
     "plt.plot(epoch_losses, label='LSTM', color='#74b9ff', linewidth=2)\n"
     "plt.plot(rnn_losses,   label='RNN',  color='#fd79a8', linewidth=2, linestyle='--')\n"
     "plt.xlabel('Epoch')\nplt.ylabel('MSE Loss')\n"
     "plt.title('LSTM vs RNN — Training Loss')\n"
     "plt.legend()\nplt.grid(alpha=0.3)\nplt.tight_layout()\nplt.show()"),
    ("md", "## Step 10: Visualize the LSTM Cell Architecture"),
    ("code", VIZ_LSTM),
    ("md", "## Bonus: Deep LSTM with Dropout"),
    ("code",
     "class SineLSTMDeep(nn.Module):\n"
     "    def __init__(self):\n"
     "        super().__init__()\n"
     "        self.lstm = nn.LSTM(1, 32, num_layers=3, batch_first=True, dropout=0.2)\n"
     "        self.fc   = nn.Linear(32, 1)\n"
     "    def forward(self, x):\n"
     "        out, _ = self.lstm(x)\n"
     "        return self.fc(out[:, -1, :])\n\n"
     "deep = SineLSTMDeep().to(device)\n"
     "opt_deep = optim.Adam(deep.parameters(), lr=0.001)\n"
     "deep_losses = []\n\n"
     "for epoch in range(100):\n"
     "    deep.train()\n"
     "    total = 0\n"
     "    for Xb, yb in train_loader:\n"
     "        pred = deep(Xb)\n"
     "        loss = criterion(pred, yb)\n"
     "        opt_deep.zero_grad()\n"
     "        loss.backward()\n"
     "        opt_deep.step()\n"
     "        total += loss.item()\n"
     "    deep_losses.append(total / len(train_loader))\n\n"
     "deep.eval()\n"
     "with torch.no_grad():\n"
     "    deep_loss = criterion(deep(X_test), y_test)\n"
     "print(f'Deep LSTM (3-layer, dropout=0.2) test MSE: {deep_loss.item():.6f}')"),
]
write(BASE / "05_lstm_pytorch/solution.ipynb", nb(cells_05_sol))

print("\nAll notebooks generated successfully.")
