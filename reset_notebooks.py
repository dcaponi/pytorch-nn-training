#!/usr/bin/env python3
"""
Reset all prompt notebooks to their clean starter state.

Generated prompts (03, 04) are fully regenerated from source via generate_notebooks.py.
Hand-crafted prompts (01, 02, 05) have their cell outputs and execution counts cleared.

Usage:
    uv run python reset_notebooks.py
"""

import subprocess
import sys
from pathlib import Path

import nbformat

BASE = Path(__file__).parent

HANDCRAFTED_PROMPTS = [
    "01_nn_from_scratch",
    "02_nn_pytorch",
    "05_lstm_pytorch",
]


def clear_outputs(path: Path) -> None:
    with open(path) as f:
        nb = nbformat.read(f, as_version=4)
    for cell in nb.cells:
        if cell.cell_type == "code":
            cell.outputs = []
            cell.execution_count = None
    with open(path, "w") as f:
        nbformat.write(nb, f)
    print(f"  cleared  {path.relative_to(BASE)}")


print("Step 1 — regenerating lessons 03 and 04 prompt notebooks from source...")
result = subprocess.run([sys.executable, str(BASE / "generate_notebooks.py")])
if result.returncode != 0:
    sys.exit(result.returncode)

print("\nStep 2 — clearing outputs from hand-crafted prompt notebooks...")
for lesson in HANDCRAFTED_PROMPTS:
    path = BASE / lesson / "prompt.ipynb"
    if path.exists():
        clear_outputs(path)
    else:
        print(f"  WARNING: {path.relative_to(BASE)} not found, skipping")

print("\nAll prompt notebooks have been reset.")
print("Tip: to also reset any code you edited, run: git checkout -- '*/prompt.ipynb'")
