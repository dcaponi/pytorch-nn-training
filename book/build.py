#!/usr/bin/env python3
"""Build the book: concatenate chapter fragments into one self-contained page.

    python3 book/build.py           # writes book/index.html
    python3 book/build.py --check   # validate fragments, write nothing

Fragments live in book/chapters/*.html and are included in filename order.
Each fragment is a single <section class="chapter" id="..."> element whose
first child is an <h1>. Headings without an explicit id get a stable
auto-generated one (chapter id + slug) so cross-references never go stale.

No third-party dependencies -- standard library only.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

BOOK = Path(__file__).resolve().parent
CHAPTERS = BOOK / "chapters"
OUT = BOOK / "index.html"

TITLE = "Neural Networks by Hand and by PyTorch"
SUBTITLE = "A companion book for the pytorch_nn_training notebooks"


# --------------------------------------------------------------------------
# Heading extraction / anchor assignment
# --------------------------------------------------------------------------

HEADING_RE = re.compile(
    r"<(?P<tag>h[123])(?P<attrs>[^>]*)>(?P<text>.*?)</(?P=tag)>",
    re.DOTALL | re.IGNORECASE,
)
ID_RE = re.compile(r"""\bid\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
TAG_RE = re.compile(r"<[^>]+>")
SECTION_RE = re.compile(
    r"""<section\b[^>]*\bclass\s*=\s*["'][^"']*\bchapter\b[^"']*["'][^>]*>""",
    re.IGNORECASE,
)


def slugify(text: str) -> str:
    text = TAG_RE.sub("", text)
    text = html.unescape(text)
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:60]


@dataclass
class Heading:
    level: int
    anchor: str
    text: str


@dataclass
class Chapter:
    path: Path
    chap_id: str
    title: str
    body: str
    headings: list[Heading] = field(default_factory=list)


def strip_markup(text: str) -> str:
    return html.unescape(TAG_RE.sub("", text)).strip()


def process_fragment(path: Path) -> Chapter:
    raw = path.read_text(encoding="utf-8").strip()

    m = SECTION_RE.search(raw)
    if not m:
        raise SystemExit(
            f"{path.name}: must contain a <section class=\"chapter\" id=\"...\"> element"
        )
    id_match = ID_RE.search(m.group(0))
    if not id_match:
        raise SystemExit(f"{path.name}: the chapter <section> needs an id attribute")
    chap_id = id_match.group(1)

    headings: list[Heading] = []
    seen: set[str] = set()
    title = ""

    def replace(match: re.Match) -> str:
        nonlocal title
        tag = match.group("tag").lower()
        attrs = match.group("attrs")
        text = match.group("text")
        level = int(tag[1])

        existing = ID_RE.search(attrs)
        if existing:
            anchor = existing.group(1)
            new_attrs = attrs
        else:
            base = f"{chap_id}-{slugify(text)}" if level > 1 else chap_id
            anchor = base
            n = 2
            while anchor in seen:
                anchor = f"{base}-{n}"
                n += 1
            new_attrs = f' id="{anchor}"{attrs}'
        seen.add(anchor)

        plain = strip_markup(text)
        if "$" in plain:
            # headings become plain text in the sidebar, where KaTeX never runs
            print(
                f"warning: {path.name}: heading contains math, which will not "
                f"render in the table of contents: {plain!r}",
                file=sys.stderr,
            )
        if level == 1 and not title:
            title = plain
        headings.append(Heading(level, anchor, plain))

        link = f'<a class="anchor-link" href="#{anchor}" aria-label="Link to this section">#</a>'
        return f"<{tag}{new_attrs}>{text}{link}</{tag}>"

    body = HEADING_RE.sub(replace, raw)

    if not title:
        raise SystemExit(f"{path.name}: no <h1> found")

    return Chapter(path=path, chap_id=chap_id, title=title, body=body, headings=headings)


# --------------------------------------------------------------------------
# Python syntax highlighting (small, dependency-free)
# --------------------------------------------------------------------------

KEYWORDS = {
    "and", "as", "assert", "async", "await", "break", "class", "continue", "def",
    "del", "elif", "else", "except", "finally", "for", "from", "global", "if",
    "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise",
    "return", "try", "while", "with", "yield",
}
CONSTANTS = {"True", "False", "None", "self", "cls"}
BUILTINS = {
    "abs", "all", "any", "dict", "enumerate", "float", "int", "len", "list",
    "max", "min", "print", "range", "round", "set", "sorted", "str", "sum",
    "super", "tuple", "type", "zip", "isinstance", "getattr", "setattr",
}

CODE_BLOCK_RE = re.compile(
    r"<pre><code(?P<attrs>[^>]*)>(?P<code>.*?)</code></pre>", re.DOTALL
)
PY_TOKEN_RE = re.compile(
    r"""(?P<comment>\#[^\n]*)
      | (?P<string>[rbf]{0,2}(?:'''.*?'''|\"\"\".*?\"\"\"|'(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"))
      | (?P<decorator>@[A-Za-z_][\w.]*)
      | (?P<number>\b\d+\.?\d*(?:[eE][-+]?\d+)?\b)
      | (?P<name>\b[A-Za-z_]\w*\b)
    """,
    re.DOTALL | re.VERBOSE,
)


def highlight_python(code: str) -> str:
    """Token-colour already-escaped HTML source text."""
    out: list[str] = []
    pos = 0
    for m in PY_TOKEN_RE.finditer(code):
        out.append(code[pos : m.start()])
        pos = m.end()
        text = m.group(0)
        kind = m.lastgroup
        if kind == "name":
            if text in KEYWORDS:
                cls = "k"
            elif text in CONSTANTS:
                cls = "c"
            elif text in BUILTINS:
                cls = "b"
            else:
                cls = None
            out.append(f'<span class="t-{cls}">{text}</span>' if cls else text)
        else:
            short = {"comment": "cm", "string": "s", "decorator": "d", "number": "n"}[kind]
            out.append(f'<span class="t-{short}">{text}</span>')
    out.append(code[pos:])
    return "".join(out)


def highlight_blocks(body: str) -> str:
    def replace(m: re.Match) -> str:
        attrs = m.group("attrs")
        code = m.group("code")
        if "language-python" in attrs or "lang-python" in attrs:
            code = highlight_python(code)
        return f"<pre><code{attrs}>{code}</code></pre>"

    return CODE_BLOCK_RE.sub(replace, body)


# --------------------------------------------------------------------------
# Table of contents
# --------------------------------------------------------------------------


def render_toc(chapters: list[Chapter]) -> str:
    """Chapters and their h2s, with h3s nested one level deeper.

    The h3 entries are hidden by CSS until their h2 becomes the active section,
    which keeps the sidebar short without losing fine-grained navigation in the
    long chapters.
    """
    parts = ['<nav id="toc" aria-label="Table of contents"><ol class="toc-root">']
    for ch in chapters:
        parts.append('<li class="toc-chapter">')
        parts.append(
            f'<a class="toc-link toc-l1" href="#{ch.chap_id}">'
            f"{html.escape(ch.title)}</a>"
        )
        subs = [h for h in ch.headings if h.level in (2, 3)]
        if subs:
            parts.append('<ol class="toc-subs">')
            open_l2 = False
            for h in subs:
                if h.level == 2:
                    if open_l2:
                        parts.append("</ol></li>")
                    parts.append(f'<li class="toc-sec" data-sec="{h.anchor}">')
                    parts.append(
                        f'<a class="toc-link toc-l2" href="#{h.anchor}">'
                        f"{html.escape(h.text)}</a>"
                    )
                    parts.append('<ol class="toc-subsubs">')
                    open_l2 = True
                else:
                    if not open_l2:      # an h3 before any h2 in this chapter
                        continue
                    parts.append(
                        f'<li><a class="toc-link toc-l3" href="#{h.anchor}">'
                        f"{html.escape(h.text)}</a></li>"
                    )
            if open_l2:
                parts.append("</ol></li>")
            parts.append("</ol>")
        parts.append("</li>")
    parts.append("</ol></nav>")
    return "\n".join(parts)


# --------------------------------------------------------------------------
# Search index
# --------------------------------------------------------------------------

BLOCK_SPLIT_RE = re.compile(r"</(?:p|li|h[1-3]|pre|figcaption|td)>", re.IGNORECASE)


def build_search_index(chapters: list[Chapter]) -> str:
    """A flat list of {chapter, anchor, heading, text} records, one per block.

    Small enough to inline (a few hundred KB of plain text) and it keeps the page
    a single file, which is what lets it work from file:// as well as over http.
    """
    records = []
    for ch in chapters:
        current = Heading(1, ch.chap_id, ch.title)
        for chunk in BLOCK_SPLIT_RE.split(ch.body):
            hm = HEADING_RE.search(chunk + "</h2>")
            for h in ch.headings:
                if f'id="{h.anchor}"' in chunk:
                    current = h
                    break
            text = strip_markup(chunk)
            text = re.sub(r"\s+", " ", text).strip()
            if len(text) < 30:
                continue
            records.append({
                "c": ch.chap_id,
                "t": ch.title,
                "a": current.anchor,
                "h": current.text,
                "x": text[:220],
            })
    return json.dumps(records, separators=(",", ":"), ensure_ascii=False)


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------


def check_links(chapters: list[Chapter], full_html: str) -> list[str]:
    anchors = {h.anchor for ch in chapters for h in ch.headings}
    anchors |= set(re.findall(r'\bid="([^"]+)"', full_html))
    problems = []
    for ch in chapters:
        for target in re.findall(r'href="#([^"]+)"', ch.body):
            if target not in anchors:
                problems.append(f"{ch.path.name}: dangling cross-reference #{target}")
    return problems


# --------------------------------------------------------------------------
# Page assembly
# --------------------------------------------------------------------------

PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@</title>
<meta name="description" content="@@SUBTITLE@@">
<meta name="color-scheme" content="light dark">
<meta property="og:title" content="@@TITLE@@">
<meta property="og:description" content="@@SUBTITLE@@">
<meta property="og:type" content="book">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text y='14' font-size='14'>&#128218;</text></svg>">
<link rel="stylesheet" href="vendor/katex/katex.min.css">
<style>
@@CSS@@
</style>
</head>
<body>
<a class="skip-link" href="#ch00">Skip to first chapter</a>

<div id="reading-progress"><div id="reading-progress-bar"></div></div>

<button id="toc-toggle" aria-label="Toggle table of contents" aria-expanded="false">☰</button>

<aside id="sidebar">
  <div class="sidebar-head">
    <div class="book-title">@@TITLE@@</div>
    <div class="book-sub">@@SUBTITLE@@</div>
    <input id="toc-filter" type="search" placeholder="Search the book…"
           aria-label="Search the book" autocomplete="off">
    <div id="search-results" hidden></div>
  </div>
  @@TOC@@
  <div class="sidebar-foot">
    <button id="theme-toggle" aria-label="Toggle colour theme">◐ Theme</button>
    <button id="mode-toggle" aria-label="Toggle continuous reading mode">▤ One chapter</button>
  </div>
</aside>

<main id="content">
@@BODY@@
</main>

<nav id="chapter-nav" aria-label="Chapter navigation">
  <a id="prev-chapter" rel="prev"></a>
  <a id="next-chapter" rel="next"></a>
</nav>

<button id="back-btn" hidden>↩ Back to where you were</button>
<button id="to-top" aria-label="Back to top" hidden>↑</button>

<script defer src="vendor/katex/katex.min.js"></script>
<script defer src="vendor/katex/contrib/auto-render.min.js"></script>
<script>
@@JS@@
</script>
</body>
</html>
"""


def build(check_only: bool = False) -> int:
    if not CHAPTERS.is_dir():
        raise SystemExit(f"missing chapter directory: {CHAPTERS}")

    files = sorted(CHAPTERS.glob("*.html"))
    if not files:
        raise SystemExit(f"no chapter fragments found in {CHAPTERS}")

    chapters = [process_fragment(p) for p in files]

    ids = [c.chap_id for c in chapters]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise SystemExit(f"duplicate chapter ids: {', '.join(sorted(dupes))}")

    body = "\n\n".join(highlight_blocks(c.body) for c in chapters)
    index_js = "window.__BOOK_INDEX__ = " + build_search_index(chapters) + ";" 
    # str.format is unusable here: the CSS and JS are full of braces.
    page = PAGE
    for token, value in (
        ("@@TITLE@@", html.escape(TITLE)),
        ("@@SUBTITLE@@", html.escape(SUBTITLE)),
        ("@@TOC@@", render_toc(chapters)),
        ("@@BODY@@", body),
        ("@@CSS@@", (BOOK / "style.css").read_text(encoding="utf-8")),
        ("@@JS@@", index_js + "\n" + (BOOK / "book.js").read_text(encoding="utf-8")),
    ):
        page = page.replace(token, value)

    problems = check_links(chapters, page)
    for p in problems:
        print(f"warning: {p}", file=sys.stderr)

    if check_only:
        print(f"checked {len(chapters)} chapters, {len(problems)} problem(s)")
        return 1 if problems else 0

    OUT.write_text(page, encoding="utf-8")
    kb = len(page.encode("utf-8")) / 1024
    print(f"wrote {OUT.relative_to(BOOK.parent)}  ({kb:,.0f} KB, {len(chapters)} chapters)")
    for ch in chapters:
        n_sections = sum(1 for h in ch.headings if h.level == 2)
        print(f"  {ch.chap_id:<8} {ch.title[:52]:<54} {n_sections:>2} sections")
    return 1 if problems else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="validate only, write nothing")
    args = ap.parse_args()
    sys.exit(build(check_only=args.check))
