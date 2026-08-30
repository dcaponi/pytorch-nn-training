/* ==========================================================================
   Neural Networks by Hand and by PyTorch — book runtime
   Inlined into index.html by build.py. Edit here, not there.

   Three jobs:
     1. navigation  — scroll-spy TOC, filter, theme, "back to where you were"
     2. math        — KaTeX auto-render over the whole document
     3. widgets     — small canvas demos declared as <div data-widget="...">
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var fmt = function (v, n) { return (v < 0 ? '' : ' ') + v.toFixed(n === undefined ? 3 : n); };

  /* ======================================================================
     1. Navigation
     ====================================================================== */

  var sidebar = $('#sidebar');
  var body = document.body;

  /* -- theme -------------------------------------------------------------- */
  var THEME_KEY = 'nnbook-theme';
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    if (typeof markWidgetsStale === 'function') markWidgetsStale();
    if (typeof redrawVisibleWidgets === 'function') redrawVisibleWidgets();
  }
  try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (e) { /* private mode */ }

  var themeBtn = $('#theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next;
      if (!cur) next = systemDark ? 'light' : 'dark';
      else if (cur === 'dark') next = 'light';
      else next = 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (!document.documentElement.getAttribute('data-theme')) redrawAllWidgets();
  });

  /* -- mobile TOC --------------------------------------------------------- */
  var tocToggle = $('#toc-toggle');
  if (tocToggle) {
    tocToggle.addEventListener('click', function () {
      var open = body.classList.toggle('toc-open');
      tocToggle.setAttribute('aria-expanded', String(open));
    });
  }
  if (sidebar) {
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth < 1088) body.classList.remove('toc-open');
    });
  }

  /* -- scroll-spy --------------------------------------------------------- */
  var links = {};
  $$('.toc-link').forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    links[id] = a;
  });
  var allSpyTargets = $$('h1[id], h2[id], h3[id]').filter(function (h) { return links[h.id]; });
  var spyTargets = allSpyTargets;

  function refreshSpyTargets() {
    // headings inside a hidden chapter have offsetTop 0 and would confuse the spy
    spyTargets = allSpyTargets.filter(function (h) {
      var sec = h.closest('.chapter');
      return !sec || !sec.hidden;
    });
  }
  var activeLink = null;
  var expandedSec = null;

  function setActive(id) {
    var a = links[id];
    if (!a || a === activeLink) return;
    if (activeLink) activeLink.classList.remove('active');
    a.classList.add('active');
    activeLink = a;

    // reveal the third-level entries for whichever section you are reading, and
    // collapse the previous one, so the sidebar stays short in a long chapter
    var sec = a.closest('.toc-sec');
    if (sec !== expandedSec) {
      if (expandedSec) expandedSec.classList.remove('expanded');
      if (sec) sec.classList.add('expanded');
      expandedSec = sec;
    }

    // keep the active entry visible without yanking the whole page
    var top = a.offsetTop, view = sidebar.scrollTop, h = sidebar.clientHeight;
    if (top < view + 60 || top > view + h - 60) sidebar.scrollTop = top - h / 2;
  }

  var progressBar = $('#reading-progress-bar');
  var toTop = $('#to-top');

  function onScroll() {
    refreshSpyTargets();
    var y = window.scrollY + 90;
    var current = spyTargets.length ? spyTargets[0].id : null;
    for (var i = 0; i < spyTargets.length; i++) {
      if (spyTargets[i].offsetTop <= y) current = spyTargets[i].id;
      else break;
    }
    if (current) setActive(current);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    if (toTop) toTop.hidden = window.scrollY < 800;
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });

  if (toTop) {
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* -- "back to where you were" ------------------------------------------
     Jumping to an earlier chapter to re-read a definition should not cost
     you your place. Any in-page jump remembers the scroll position it left. */
  var backBtn = $('#back-btn');
  var returnTo = null;
  var backTimer = null;

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var raw = a.getAttribute('href').slice(1);
    if (!raw) return;

    // route-shaped links (#/ch03[/anchor]) are handled by the hashchange listener
    if (raw.charAt(0) === '/') {
      returnTo = { chapter: currentChapter, y: window.scrollY };
      showBack();
      return;
    }

    var target = document.getElementById(raw);
    if (!target) return;
    if (a.classList.contains('anchor-link')) return;   // copying a link, not travelling

    e.preventDefault();
    returnTo = { chapter: currentChapter, y: window.scrollY };
    showBack();
    location.hash = routeFor(raw);
  });

  function showBack() {
    if (!backBtn) return;
    backBtn.hidden = false;
    clearTimeout(backTimer);
    backTimer = setTimeout(function () { backBtn.hidden = true; }, 20000);
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (!returnTo) return;
      var dest = returnTo;
      returnTo = null;
      backBtn.hidden = true;
      if (dest.chapter && dest.chapter !== currentChapter) {
        try { history.replaceState(null, '', '#/' + dest.chapter); }
        catch (e) { location.hash = '#/' + dest.chapter; }
        showChapter(dest.chapter, null, { keepScroll: true });
      }
      window.scrollTo({ top: dest.y, behavior: 'smooth' });
    });
  }


  /* ======================================================================
     1b. Router — a hash-routed SPA that also works from file://
     ======================================================================

     Routes look like  #/ch03  or  #/ch03/ch03-global-max-pooling
     Legacy anchors    #ch03   or  #ch03-global-max-pooling      still work and
     are rewritten, so every link written before the router existed survives.

     All chapters stay in the DOM. Navigation hides and shows sections rather
     than fetching, which keeps the whole book in one file — the thing that makes
     it work equally from a GitHub Pages URL and from a local file:// path, with
     no server and no build step beyond build.py.
  */

  var chapters = $$('#content > .chapter');
  var chapterIds = chapters.map(function (c) { return c.id; });
  var byId = {};
  chapters.forEach(function (c) { byId[c.id] = c; });

  var MODE_KEY = 'nnbook-mode';
  var continuous = false;
  try { continuous = localStorage.getItem(MODE_KEY) === 'continuous'; } catch (e) {}

  var currentChapter = null;

  function anchorChapter(id) {
    // an element id belongs to whichever chapter section contains it
    var el = document.getElementById(id);
    if (!el) return null;
    var sec = el.closest('.chapter');
    return sec ? sec.id : null;
  }

  function parseHash() {
    var h = (location.hash || '').replace(/^#/, '');
    if (!h) return { chapter: chapterIds[0], anchor: null };

    if (h.charAt(0) === '/') {                       // #/chapter[/anchor]
      var parts = h.slice(1).split('/');
      var ch = parts[0] || chapterIds[0];
      return { chapter: byId[ch] ? ch : chapterIds[0], anchor: parts[1] || null };
    }
    // legacy: #ch03 or #ch03-some-heading
    if (byId[h]) return { chapter: h, anchor: null };
    var owner = anchorChapter(h);
    if (owner) return { chapter: owner, anchor: h };
    return { chapter: chapterIds[0], anchor: null };
  }

  function routeFor(id) {
    var owner = byId[id] ? id : anchorChapter(id);
    if (!owner) return '#/' + chapterIds[0];
    return owner === id ? '#/' + owner : '#/' + owner + '/' + id;
  }

  var chapterNav = $('#chapter-nav');
  var prevLink = $('#prev-chapter');
  var nextLink = $('#next-chapter');

  function updateChapterNav(id) {
    var i = chapterIds.indexOf(id);
    if (!prevLink || !nextLink) return;
    if (i > 0) {
      prevLink.href = '#/' + chapterIds[i - 1];
      prevLink.innerHTML = '<span class="nav-dir">← Previous</span><span class="nav-title">' +
        byId[chapterIds[i - 1]].querySelector('h1').firstChild.textContent.trim() + '</span>';
      prevLink.hidden = false;
    } else prevLink.hidden = true;

    if (i > -1 && i < chapterIds.length - 1) {
      nextLink.href = '#/' + chapterIds[i + 1];
      nextLink.innerHTML = '<span class="nav-dir">Next →</span><span class="nav-title">' +
        byId[chapterIds[i + 1]].querySelector('h1').firstChild.textContent.trim() + '</span>';
      nextLink.hidden = false;
    } else nextLink.hidden = true;

    chapterNav.hidden = continuous;
  }

  function showChapter(id, anchor, opts) {
    opts = opts || {};
    if (!byId[id]) id = chapterIds[0];

    // Always reassert visibility. Skipping this when id === currentChapter looks
    // like a cheap optimisation but breaks the continuous-mode toggle, which
    // changes what should be visible without changing which chapter is current.
    chapters.forEach(function (c) {
      c.hidden = continuous ? false : (c.id !== id);
    });
    currentChapter = id;

    // recompute widget canvases that were hidden (clientWidth was 0 while hidden)
    if (!opts.noRedraw) redrawVisibleWidgets();

    updateChapterNav(id);
    document.title = (byId[id].querySelector('h1').firstChild.textContent.trim()
                      || 'Book') + ' · ' + BOOK_TITLE;

    if (!opts.keepScroll) {
      var target = anchor && document.getElementById(anchor);
      if (target) {
        if (typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: opts.smooth ? 'smooth' : 'auto', block: 'start' });
        } else if (typeof target.offsetTop === 'number') {
          window.scrollTo({ top: Math.max(0, target.offsetTop - 20), behavior: 'auto' });
        }
        flash(target);
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
    onScroll();
  }

  function flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth;                 // restart the animation
    el.classList.add('flash');
    setTimeout(function () { el.classList.remove('flash'); }, 1800);
  }

  function onRoute(opts) {
    var r = parseHash();
    // normalise a legacy hash into the canonical route without adding history
    var canonical = r.anchor ? '#/' + r.chapter + '/' + r.anchor : '#/' + r.chapter;
    if (location.hash !== canonical) {
      // replaceState can be restricted on file:// in some browsers; falling back to
      // assigning the hash costs an extra history entry but always works
      try { history.replaceState(null, '', canonical); }
      catch (e) { location.hash = canonical; }
    }
    showChapter(r.chapter, r.anchor, opts);
  }

  window.addEventListener('hashchange', function () { onRoute({ smooth: false }); });

  var BOOK_TITLE = document.title;

  /* continuous-mode toggle: restores the single-scroll reading experience, which
     is what makes Cmd+F work across the whole book */
  var modeBtn = $('#mode-toggle');
  function applyMode() {
    if (modeBtn) {
      modeBtn.textContent = continuous ? '▤ Continuous' : '▤ One chapter';
      modeBtn.title = continuous
        ? 'Showing every chapter — Cmd+F searches the whole book'
        : 'Showing one chapter at a time';
    }
    document.body.classList.toggle('continuous', continuous);
    showChapter(currentChapter || parseHash().chapter, null, { keepScroll: true });
  }
  if (modeBtn) {
    modeBtn.addEventListener('click', function () {
      continuous = !continuous;
      try { localStorage.setItem(MODE_KEY, continuous ? 'continuous' : 'single'); } catch (e) {}
      applyMode();
    });
  }

  /* ----------------------------------------------------------------------
     Search across every chapter, since one-chapter-at-a-time breaks Cmd+F
     ---------------------------------------------------------------------- */

  var searchBox = $('#toc-filter');
  var searchResults = $('#search-results');
  var tocEl = $('#toc');
  var INDEX = window.__BOOK_INDEX__ || [];

  function escapeHtml(t) {
    return t.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function runSearch(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    var hits = [];
    for (var i = 0; i < INDEX.length && hits.length < 400; i++) {
      var rec = INDEX[i];
      var hay = (rec.x + ' ' + rec.h + ' ' + rec.t).toLowerCase();
      var score = 0, ok = true;
      for (var j = 0; j < terms.length; j++) {
        var at = hay.indexOf(terms[j]);
        if (at === -1) { ok = false; break; }
        score += 1;
        if (rec.h.toLowerCase().indexOf(terms[j]) !== -1) score += 3;   // heading match
        if (rec.t.toLowerCase().indexOf(terms[j]) !== -1) score += 1;   // chapter title
      }
      if (ok) hits.push({ rec: rec, score: score });
    }
    hits.sort(function (a, b) { return b.score - a.score; });
    return hits.slice(0, 30);
  }

  function snippet(text, terms) {
    var lower = text.toLowerCase();
    var at = -1;
    for (var i = 0; i < terms.length && at === -1; i++) at = lower.indexOf(terms[i]);
    if (at === -1) at = 0;
    var start = Math.max(0, at - 40);
    var frag = (start > 0 ? '…' : '') + text.slice(start, start + 150) +
               (text.length > start + 150 ? '…' : '');
    var out = escapeHtml(frag);
    terms.forEach(function (t) {
      out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'),
                        '<mark>$1</mark>');
    });
    return out;
  }

  function renderSearch(q) {
    if (!searchResults) return;
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) {
      searchResults.hidden = true;
      if (tocEl) tocEl.hidden = false;
      return;
    }
    var hits = runSearch(q);
    if (tocEl) tocEl.hidden = true;
    searchResults.hidden = false;
    if (!hits.length) {
      searchResults.innerHTML = '<p class="search-empty">No matches for “' +
        escapeHtml(q) + '”.</p>';
      return;
    }
    searchResults.innerHTML =
      '<p class="search-count">' + hits.length + ' result' + (hits.length === 1 ? '' : 's') + '</p>' +
      hits.map(function (h) {
        var r = h.rec;
        return '<a class="search-hit" href="' + routeFor(r.a) + '">' +
               '<span class="search-chapter">' + escapeHtml(r.t) + '</span>' +
               '<span class="search-heading">' + escapeHtml(r.h) + '</span>' +
               '<span class="search-snippet">' + snippet(r.x, terms) + '</span></a>';
      }).join('');
  }

  if (searchBox) {
    var searchTimer = null;
    searchBox.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var q = searchBox.value.trim();
      searchTimer = setTimeout(function () { renderSearch(q); }, 90);
    });
    searchBox.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { searchBox.value = ''; renderSearch(''); searchBox.blur(); }
      if (e.key === 'Enter') {
        var first = searchResults && searchResults.querySelector('.search-hit');
        if (first) first.click();
      }
    });
  }

  // "/" focuses search, like every documentation site
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== searchBox &&
        !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      if (searchBox) searchBox.focus();
    }
    if (continuous) return;
    if (e.key === 'ArrowLeft' && e.altKey && prevLink && !prevLink.hidden) prevLink.click();
    if (e.key === 'ArrowRight' && e.altKey && nextLink && !nextLink.hidden) nextLink.click();
  });

  /* ======================================================================
     2. Math
     ====================================================================== */

  function renderMath() {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(document.getElementById('content'), {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$',  right: '$',  display: false },
        { left: '\\(', right: '\\)', display: false }
      ],
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'],
      throwOnError: false
    });
    markWidgetsStale();
    redrawVisibleWidgets();   // KaTeX changed the layout, so canvas widths moved
    onScroll();
  }

  /* ======================================================================
     3. Widgets
     ====================================================================== */

  var widgets = [];       // { el, draw }
  var REGISTRY = {};

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function palette() {
    return {
      ink: css('--ink'), soft: css('--ink-soft'), faint: css('--ink-faint'),
      rule: css('--rule'), ruleStrong: css('--rule-strong'),
      bg: css('--bg-raised'), sunken: css('--bg-sunken'),
      accent: css('--accent'), concept: css('--concept'),
      byhand: css('--byhand'), notebook: css('--notebook'), warn: css('--warn')
    };
  }

  /* -- tiny canvas plotting helper --------------------------------------- */
  function Plot(canvas, opts) {
    opts = opts || {};
    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
    var cssH = opts.height || 220;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.height = cssH + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var pad = Object.assign({ l: 42, r: 12, t: 12, b: 28 }, opts.pad || {});
    var W = cssW, H = cssH;
    var p = palette();

    var xr = opts.xrange || [0, 1];
    var yr = opts.yrange || [0, 1];

    var self = {
      ctx: ctx, W: W, H: H, pad: pad, p: p,
      X: function (x) { return pad.l + (x - xr[0]) / (xr[1] - xr[0]) * (W - pad.l - pad.r); },
      Y: function (y) { return H - pad.b - (y - yr[0]) / (yr[1] - yr[0]) * (H - pad.t - pad.b); },
      invX: function (px) { return xr[0] + (px - pad.l) / (W - pad.l - pad.r) * (xr[1] - xr[0]); },
      xrange: xr, yrange: yr
    };

    self.axes = function (o) {
      o = o || {};
      ctx.strokeStyle = p.rule; ctx.lineWidth = 1;
      ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = p.faint;

      var xt = o.xticks || 5, yt = o.yticks || 4, i, v;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (i = 0; i <= yt; i++) {
        v = yr[0] + (yr[1] - yr[0]) * i / yt;
        var y = self.Y(v);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
        ctx.fillText(o.yfmt ? o.yfmt(v) : v.toFixed(o.ydec === undefined ? 1 : o.ydec), pad.l - 6, y);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (i = 0; i <= xt; i++) {
        v = xr[0] + (xr[1] - xr[0]) * i / xt;
        var x = self.X(v);
        ctx.fillText(o.xfmt ? o.xfmt(v) : v.toFixed(o.xdec === undefined ? 1 : o.xdec), x, H - pad.b + 6);
      }
      // zero lines
      ctx.strokeStyle = p.ruleStrong; ctx.lineWidth = 1;
      if (yr[0] < 0 && yr[1] > 0) {
        ctx.beginPath(); ctx.moveTo(pad.l, self.Y(0)); ctx.lineTo(W - pad.r, self.Y(0)); ctx.stroke();
      }
      if (xr[0] < 0 && xr[1] > 0) {
        ctx.beginPath(); ctx.moveTo(self.X(0), pad.t); ctx.lineTo(self.X(0), H - pad.b); ctx.stroke();
      }
      if (o.xlabel) {
        ctx.fillStyle = p.faint; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(o.xlabel, (pad.l + W - pad.r) / 2, H - 1);
      }
    };

    self.curve = function (f, color, width, dash) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width || 2;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      var n = 260, started = false;
      for (var i = 0; i <= n; i++) {
        var x = xr[0] + (xr[1] - xr[0]) * i / n;
        var y = f(x);
        if (!isFinite(y)) { started = false; continue; }
        y = clamp(y, yr[0] - 10, yr[1] + 10);
        if (!started) { ctx.moveTo(self.X(x), self.Y(y)); started = true; }
        else ctx.lineTo(self.X(x), self.Y(y));
      }
      ctx.stroke();
      ctx.restore();
    };

    self.dot = function (x, y, color, r) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(self.X(x), self.Y(y), r || 4.5, 0, 6.284); ctx.fill();
    };

    self.line = function (x1, y1, x2, y2, color, width, dash) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width || 1;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(self.X(x1), self.Y(y1)); ctx.lineTo(self.X(x2), self.Y(y2)); ctx.stroke();
      ctx.restore();
    };

    self.label = function (text, x, y, color, align) {
      ctx.fillStyle = color; ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(text, self.X(x), self.Y(y));
    };

    self.legend = function (items) {
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      var x = pad.l + 8, y = pad.t + 10;
      items.forEach(function (it) {
        ctx.fillStyle = it[1];
        ctx.fillRect(x, y - 4, 14, 3);
        ctx.fillStyle = p.soft;
        ctx.fillText(it[0], x + 20, y);
        x += 26 + ctx.measureText(it[0]).width;
      });
    };

    return self;
  }

  /* -- widget scaffolding ------------------------------------------------- */

  function build(el, spec) {
    // spec: { title, height, controls: [...], draw(ctx, vals), readout(vals) }
    var title = document.createElement('div');
    title.className = 'widget-title';
    title.textContent = spec.title;
    el.appendChild(title);

    var canvas = document.createElement('canvas');
    el.appendChild(canvas);

    var vals = {};
    var controls = document.createElement('div');
    controls.className = 'controls';

    (spec.controls || []).forEach(function (c) {
      vals[c.name] = c.value;
      var wrap = document.createElement('div');
      wrap.className = 'control';

      if (c.type === 'button') {
        var btn = document.createElement('button');
        btn.textContent = c.label;
        btn.addEventListener('click', function () { c.onclick(vals, draw); });
        wrap.appendChild(btn);
      } else if (c.type === 'select') {
        var lab = document.createElement('label');
        lab.textContent = c.label;
        var sel = document.createElement('select');
        c.options.forEach(function (o) {
          var opt = document.createElement('option');
          opt.value = o[0]; opt.textContent = o[1];
          if (o[0] === c.value) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener('change', function () { vals[c.name] = sel.value; draw(); });
        wrap.appendChild(lab); wrap.appendChild(sel);
      } else if (c.type === 'check') {
        var l2 = document.createElement('label');
        var cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = !!c.value;
        cb.addEventListener('change', function () { vals[c.name] = cb.checked; draw(); });
        l2.appendChild(cb); l2.appendChild(document.createTextNode(' ' + c.label));
        wrap.appendChild(l2);
      } else {
        var l3 = document.createElement('label');
        l3.textContent = c.label;
        var input = document.createElement('input');
        input.type = 'range';
        input.min = c.min; input.max = c.max; input.step = c.step; input.value = c.value;
        var out = document.createElement('output');
        var show = function () { out.textContent = c.fmt ? c.fmt(vals[c.name]) : String(vals[c.name]); };
        input.addEventListener('input', function () {
          vals[c.name] = parseFloat(input.value);
          show(); draw();
        });
        show();
        wrap.appendChild(l3); wrap.appendChild(input); wrap.appendChild(out);
      }
      controls.appendChild(wrap);
    });

    if (controls.children.length) el.appendChild(controls);

    var readout = null;
    if (spec.readout) {
      readout = document.createElement('div');
      readout.className = 'readout';
      el.appendChild(readout);
    }

    function draw() {
      // ranges may be functions of the current control values, so a widget can
      // rescale its axes without rebuilding the plot inside its own draw()
      var pick = function (r) { return typeof r === 'function' ? r(vals) : r; };
      var plot = Plot(canvas, {
        height: spec.height || 220, pad: spec.pad,
        xrange: pick(spec.xrange), yrange: pick(spec.yrange)
      });
      spec.draw(plot, vals, canvas);
      if (readout) readout.innerHTML = spec.readout(vals);
    }

    var rec = { el: el, draw: draw, drawn: false, stale: false };
    widgets.push(rec);
    var sec = el.closest('.chapter');
    if (!sec || !sec.hidden) { draw(); rec.drawn = true; }
    return draw;
  }

  function redrawAllWidgets() {
    widgets.forEach(function (w) {
      try { w.draw(); } catch (e) { /* keep the page alive */ }
    });
  }

  function redrawVisibleWidgets() {
    widgets.forEach(function (w) {
      var sec = w.el.closest('.chapter');
      if (sec && sec.hidden) return;             // canvas has no width while hidden
      if (w.drawn && !w.stale) return;
      try { w.draw(); w.drawn = true; w.stale = false; } catch (e) {}
    });
  }

  function markWidgetsStale() {
    widgets.forEach(function (w) { w.stale = true; });
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      markWidgetsStale();
      redrawVisibleWidgets();
    }, 120);
  });

  /* ----------------------------------------------------------------------
     Widget: probability distributions, entropy, surprisal   (chapter 00)
     ---------------------------------------------------------------------- */

  REGISTRY['surprisal'] = function (el) {
    build(el, {
      title: 'Surprisal and cross-entropy: −log p',
      height: 230,
      xrange: [0.001, 1], yrange: [0, 7],
      controls: [
        { name: 'p', label: 'p assigned to the true label', type: 'range', min: 0.01, max: 1, step: 0.01, value: 0.6,
          fmt: function (v) { return v.toFixed(2); } }
      ],
      draw: function (g, v) {
        g.axes({ xticks: 5, yticks: 7, xdec: 1, ydec: 0, xlabel: 'probability assigned to the correct class' });
        g.curve(function (x) { return -Math.log(x); }, g.p.accent, 2.5);
        var loss = -Math.log(v.p);
        g.line(v.p, 0, v.p, Math.min(loss, 7), g.p.warn, 1.5, [4, 3]);
        g.dot(v.p, Math.min(loss, 7), g.p.warn, 5);
        g.label('−log p', 0.62, 1.1, g.p.accent);
      },
      readout: function (v) {
        var l = -Math.log(v.p);
        var bits = l / Math.LN2;
        return '<b>p = ' + v.p.toFixed(2) + '</b>   loss = −log p = <b>' + l.toFixed(3) + '</b> nats = ' +
          bits.toFixed(2) + ' bits\n' +
          'A confident-and-right model pays almost nothing. A confident-and-wrong one pays without bound —\n' +
          'that asymmetry is the whole reason cross-entropy trains classifiers better than squared error.';
      }
    });
  };

  REGISTRY['entropy'] = function (el) {
    build(el, {
      title: 'Entropy of a coin, and the cost of believing the wrong q',
      height: 240,
      xrange: [0, 1], yrange: [0, 3],
      controls: [
        { name: 'q', label: 'model belief q(heads)', type: 'range', min: 0.02, max: 0.98, step: 0.01, value: 0.5,
          fmt: function (v) { return v.toFixed(2); } },
        { name: 'p', label: 'true p(heads)', type: 'range', min: 0.02, max: 0.98, step: 0.01, value: 0.7,
          fmt: function (v) { return v.toFixed(2); } }
      ],
      draw: function (g, v) {
        g.axes({ xticks: 5, yticks: 6, ydec: 1, xlabel: 'true p(heads)' });
        var H = function (p) { return -(p * Math.log(p) + (1 - p) * Math.log(1 - p)); };
        var q = v.q;
        var CE = function (p) { return -(p * Math.log(q) + (1 - p) * Math.log(1 - q)); };
        g.curve(H, g.p.concept, 2.5);
        g.curve(CE, g.p.warn, 2, [5, 4]);
        g.dot(v.p, H(v.p), g.p.concept, 4.5);
        g.dot(v.p, Math.min(CE(v.p), 3), g.p.warn, 4.5);
        g.legend([['H(p) — irreducible', g.p.concept], ['H(p,q) — what you pay with belief q', g.p.warn]]);
      },
      readout: function (v) {
        var p = v.p, q = v.q;
        var H = -(p * Math.log(p) + (1 - p) * Math.log(1 - p));
        var CE = -(p * Math.log(q) + (1 - p) * Math.log(1 - q));
        return 'H(p) = <b>' + H.toFixed(3) + '</b>   H(p,q) = <b>' + CE.toFixed(3) + '</b>   ' +
          'KL(p‖q) = H(p,q) − H(p) = <b>' + (CE - H).toFixed(3) + '</b>\n' +
          'The gap is zero only when q = p. Training minimises H(p,q); since H(p) is fixed by the data,\n' +
          'minimising cross-entropy is exactly minimising KL divergence from the truth.';
      }
    });
  };

  REGISTRY['loss-shapes'] = function (el) {
    build(el, {
      title: 'MSE vs MAE vs Huber: how hard does an outlier pull?',
      height: 240,
      xrange: [-3, 3],
      yrange: function (v) { return v.grad ? [-3, 3] : [0, 4.5]; },
      controls: [
        { name: 'delta', label: 'Huber δ', type: 'range', min: 0.2, max: 2.5, step: 0.1, value: 1,
          fmt: function (v) { return v.toFixed(1); } },
        { name: 'grad', label: 'show gradients instead', type: 'check', value: false }
      ],
      draw: function (g, v) {
        var d = v.delta;
        var mse  = function (e) { return e * e; };
        var mae  = function (e) { return Math.abs(e); };
        var hub  = function (e) { return Math.abs(e) <= d ? 0.5 * e * e / 1 : d * (Math.abs(e) - 0.5 * d); };
        var dmse = function (e) { return 2 * e; };
        var dmae = function (e) { return e === 0 ? 0 : Math.sign(e); };
        var dhub = function (e) { return Math.abs(e) <= d ? e : d * Math.sign(e); };

        if (v.grad) {
          g.axes({ xticks: 6, yticks: 6, ydec: 0, xlabel: 'error  e = prediction − target' });
          g.curve(dmse, g.p.warn, 2.5);
          g.curve(dmae, g.p.concept, 2.5);
          g.curve(dhub, g.p.accent, 2, [5, 4]);
          g.legend([['d/de MSE', g.p.warn], ['d/de MAE', g.p.concept], ['d/de Huber', g.p.accent]]);
          return;
        }
        g.axes({ xticks: 6, yticks: 3, ydec: 1, xlabel: 'error  e = prediction − target' });
        g.curve(mse, g.p.warn, 2.5);
        g.curve(mae, g.p.concept, 2.5);
        g.curve(hub, g.p.accent, 2, [5, 4]);
        g.legend([['MSE', g.p.warn], ['MAE', g.p.concept], ['Huber', g.p.accent]]);
      },
      readout: function (v) {
        return 'At e = 3 the MSE gradient is <b>6</b>; MAE\'s is <b>1</b>; Huber\'s saturates at δ = <b>' +
          v.delta.toFixed(1) + '</b>.\nOne mislabelled example with a large error dominates an MSE batch and barely ' +
          'registers under MAE.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: activations                                     (chapters 01–02)
     ---------------------------------------------------------------------- */

  REGISTRY['activation'] = function (el) {
    // the tanh approximation to GELU, named so its derivative can reference it
    function gelu(x) {
      return 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));
    }
    var fns = {
      sigmoid: [function (x) { return 1 / (1 + Math.exp(-x)); },
                function (x) { var s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }, 'σ(x) = 1/(1+e^−x)'],
      tanh:    [Math.tanh, function (x) { var t = Math.tanh(x); return 1 - t * t; }, 'tanh(x)'],
      relu:    [function (x) { return Math.max(0, x); }, function (x) { return x > 0 ? 1 : 0; }, 'max(0, x)'],
      gelu:    [gelu,
                function (x) { var h = 1e-4; return (gelu(x + h) - gelu(x - h)) / (2 * h); },
                'x·Φ(x), the transformer default']
    };

    build(el, {
      title: 'Activation functions and their derivatives',
      height: 250,
      xrange: [-6, 6], yrange: [-1.2, 1.6],
      controls: [
        { name: 'fn', label: 'function', type: 'select', value: 'sigmoid',
          options: [['sigmoid', 'sigmoid'], ['tanh', 'tanh'], ['relu', 'ReLU'], ['gelu', 'GELU']] },
        { name: 'x', label: 'input x', type: 'range', min: -6, max: 6, step: 0.1, value: 0,
          fmt: function (v) { return v.toFixed(1); } }
      ],
      draw: function (g, v) {
        var f = fns[v.fn][0], df = fns[v.fn][1];
        g.axes({ xticks: 6, yticks: 7, ydec: 1, xlabel: 'x' });
        g.curve(f, g.p.accent, 2.5);
        g.curve(df, g.p.warn, 2, [5, 4]);
        g.dot(v.x, f(v.x), g.p.accent, 5);
        g.dot(v.x, df(v.x), g.p.warn, 4);
        g.legend([[fns[v.fn][2], g.p.accent], ['derivative', g.p.warn]]);
      },
      readout: function (v) {
        var f = fns[v.fn][0], df = fns[v.fn][1];
        var d = df(v.x);
        var note = d < 0.02
          ? '  ← saturated: gradients vanish here, and every layer below gets multiplied by this'
          : '';
        return 'f(' + v.x.toFixed(1) + ') = <b>' + f(v.x).toFixed(4) + '</b>    ' +
               'f′(' + v.x.toFixed(1) + ') = <b>' + d.toFixed(4) + '</b>' + note;
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: gradient descent stepper                        (chapter 01)
     ---------------------------------------------------------------------- */

  REGISTRY['gradient-descent'] = function (el) {
    var state = { w: -2.4, path: [-2.4] };
    var L  = function (w) { return 0.25 * w * w * w * w - 0.9 * w * w + 0.4 * w + 2.2; };
    var dL = function (w) { return w * w * w - 1.8 * w + 0.4; };

    var draw = build(el, {
      title: 'Gradient descent, one step at a time',
      height: 250,
      xrange: [-2.6, 2.6], yrange: [0, 5],
      controls: [
        { name: 'lr', label: 'learning rate', type: 'range', min: 0.01, max: 0.75, step: 0.01, value: 0.12,
          fmt: function (v) { return v.toFixed(2); } },
        { type: 'button', label: 'Step', onclick: function (vals, d) {
            state.w = state.w - vals.lr * dL(state.w);
            state.w = clamp(state.w, -12, 12);
            state.path.push(state.w);
            if (state.path.length > 60) state.path.shift();
            d();
          } },
        { type: 'button', label: '× 20 steps', onclick: function (vals, d) {
            for (var i = 0; i < 20; i++) {
              state.w = clamp(state.w - vals.lr * dL(state.w), -12, 12);
              state.path.push(state.w);
            }
            if (state.path.length > 80) state.path = state.path.slice(-80);
            d();
          } },
        { type: 'button', label: 'Reset', onclick: function (vals, d) {
            state.w = -2.4; state.path = [-2.4]; d();
          } }
      ],
      draw: function (g) {
        g.axes({ xticks: 6, yticks: 5, ydec: 1, xlabel: 'parameter w' });
        g.curve(L, g.p.accent, 2.5);
        state.path.forEach(function (w, i) {
          var a = (i + 1) / state.path.length;
          g.ctx.globalAlpha = 0.18 + 0.7 * a;
          g.dot(w, L(clamp(w, -2.6, 2.6)), i === state.path.length - 1 ? g.p.warn : g.p.faint,
                i === state.path.length - 1 ? 6 : 3);
          g.ctx.globalAlpha = 1;
        });
        // tangent at the current point
        var w = clamp(state.w, -2.5, 2.5), slope = dL(w), y = L(w);
        g.line(w - 0.55, y - 0.55 * slope, w + 0.55, y + 0.55 * slope, g.p.warn, 1.5, [4, 3]);
      },
      readout: function (vals) {
        var g = dL(state.w);
        var diverging = Math.abs(state.w) > 3;
        return 'w = <b>' + fmt(state.w) + '</b>   L(w) = <b>' + fmt(L(state.w)) + '</b>   ' +
          'dL/dw = <b>' + fmt(g) + '</b>   step = −lr·dL/dw = <b>' + fmt(-vals.lr * g) + '</b>\n' +
          (diverging
            ? 'Diverging — the step overshot the valley and each step now makes things worse. Lower the rate and reset.'
            : 'Two minima. Where you land depends only on where you started and how big your steps are.');
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: softmax + temperature + sampling            (chapters 00, 04, 10)
     ---------------------------------------------------------------------- */

  function barChart(canvas, height, labels, values, colors, opts) {
    opts = opts || {};
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.clientWidth || 600, H = height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var p = palette();

    var padL = 8, padR = 8, padT = 16, padB = 34;
    var n = values.length;
    var slot = (W - padL - padR) / n;
    var bw = Math.min(slot * 0.72, 64);
    var max = opts.max || Math.max.apply(null, values.concat([1e-6]));

    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
    for (var i = 0; i < n; i++) {
      var cx = padL + slot * (i + 0.5);
      var h = (values[i] / max) * (H - padT - padB);
      ctx.fillStyle = colors[i] || p.accent;
      ctx.globalAlpha = opts.alpha ? opts.alpha[i] : 1;
      var y = H - padB - h;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx - bw / 2, y, bw, h, [4, 4, 0, 0]);
      else ctx.rect(cx - bw / 2, y, bw, h);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = p.soft; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(opts.vfmt ? opts.vfmt(values[i]) : values[i].toFixed(2), cx, y - 3);
      ctx.fillStyle = p.faint; ctx.textBaseline = 'top';
      ctx.fillText(labels[i], cx, H - padB + 6);
    }
    ctx.strokeStyle = p.rule;
    ctx.beginPath(); ctx.moveTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
  }

  function softmax(logits, T) {
    var m = Math.max.apply(null, logits);
    var ex = logits.map(function (z) { return Math.exp((z - m) / T); });
    var s = ex.reduce(function (a, b) { return a + b; }, 0);
    return ex.map(function (e) { return e / s; });
  }

  REGISTRY['softmax'] = function (el) {
    var labels = ['cat', 'dog', 'fox', 'owl', 'ant'];
    var logits = [2.4, 1.9, 0.6, -0.4, -1.2];
    build(el, {
      title: 'Softmax: logits → a probability distribution',
      height: 210,
      controls: [
        { name: 'T', label: 'temperature T', type: 'range', min: 0.1, max: 4, step: 0.05, value: 1,
          fmt: function (v) { return v.toFixed(2); } }
      ],
      draw: function (g, v, canvas) {
        var probs = softmax(logits, v.T);
        var p = palette();
        var cols = probs.map(function (_, i) { return i === 0 ? p.accent : p.concept; });
        barChart(canvas, 210, labels, probs, cols, { max: 1, vfmt: function (x) { return x.toFixed(3); } });
      },
      readout: function (v) {
        var probs = softmax(logits, v.T);
        var H = -probs.reduce(function (a, p) { return a + (p > 0 ? p * Math.log(p) : 0); }, 0);
        return 'logits z = [' + logits.join(', ') + ']   T = <b>' + v.T.toFixed(2) + '</b>\n' +
          'p = [' + probs.map(function (x) { return x.toFixed(3); }).join(', ') + ']   ' +
          'entropy = <b>' + H.toFixed(3) + '</b>\n' +
          'T → 0 collapses onto the argmax (greedy); T → ∞ flattens towards uniform. The ranking never changes — ' +
          'only the confidence does.';
      }
    });
  };

  REGISTRY['sampling'] = function (el) {
    var labels = ['the', 'a', 'my', 'his', 'one', 'seven', 'quantum', 'refrigerator'];
    var logits = [4.1, 3.4, 2.6, 2.3, 1.1, -0.2, -1.4, -2.6];
    build(el, {
      title: 'Decoding: temperature, top-k, and nucleus (top-p)',
      height: 215,
      controls: [
        { name: 'T', label: 'temperature', type: 'range', min: 0.1, max: 2, step: 0.05, value: 1,
          fmt: function (v) { return v.toFixed(2); } },
        { name: 'k', label: 'top-k (0 = off)', type: 'range', min: 0, max: 8, step: 1, value: 0,
          fmt: function (v) { return v === 0 ? 'off' : String(v); } },
        { name: 'p', label: 'top-p', type: 'range', min: 0.1, max: 1, step: 0.01, value: 1,
          fmt: function (v) { return v.toFixed(2); } }
      ],
      draw: function (g, v, canvas) {
        var probs = softmax(logits, v.T);
        var idx = probs.map(function (p, i) { return i; })
                       .sort(function (a, b) { return probs[b] - probs[a]; });
        var keep = {};
        var cum = 0, kept = 0;
        for (var r = 0; r < idx.length; r++) {
          var i = idx[r];
          if (v.k > 0 && r >= v.k) break;
          keep[i] = true; kept++;
          cum += probs[i];
          if (cum >= v.p) break;
        }
        var pal = palette();
        var cols = probs.map(function (_, i) { return keep[i] ? pal.accent : pal.faint; });
        var alpha = probs.map(function (_, i) { return keep[i] ? 1 : 0.22; });
        // renormalise over the kept set, which is what actually gets sampled
        var Z = probs.reduce(function (a, p, i) { return a + (keep[i] ? p : 0); }, 0);
        var shown = probs.map(function (p, i) { return keep[i] ? p / Z : p; });
        barChart(canvas, 215, labels, shown, cols, { max: 1, alpha: alpha, vfmt: function (x) { return x.toFixed(2); } });
      },
      readout: function (v) {
        var probs = softmax(logits, v.T);
        var idx = probs.map(function (p, i) { return i; }).sort(function (a, b) { return probs[b] - probs[a]; });
        var cum = 0, kept = [];
        for (var r = 0; r < idx.length; r++) {
          if (v.k > 0 && r >= v.k) break;
          kept.push(labels[idx[r]]); cum += probs[idx[r]];
          if (cum >= v.p) break;
        }
        return 'candidate pool: <b>' + kept.join(', ') + '</b>  (' + kept.length + ' of 8 tokens, ' +
          (cum * 100).toFixed(1) + '% of the mass)\n' +
          'Faded bars are truncated away and can never be sampled — that is how nucleus sampling keeps ' +
          '"refrigerator" out of your sentence while leaving genuine choices intact.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: matrix multiply stepper                          (chapter 01)
     ---------------------------------------------------------------------- */

  REGISTRY['matmul'] = function (el) {
    var A = [[1, 0], [0, 1], [1, 1]];
    var B = [[0.5, -1.2, 2.0], [1.5, 0.3, -0.7]];
    var total = A.length * B[0].length;

    build(el, {
      title: 'Matrix multiply, cell by cell: (3×2) @ (2×3) → (3×3)',
      height: 250,
      controls: [
        { name: 'step', label: 'output cell', type: 'range', min: 0, max: total - 1, step: 1, value: 0,
          fmt: function (v) { return (Math.floor(v / 3) + 1) + ',' + (v % 3 + 1); } }
      ],
      draw: function (g, v, canvas) {
        var dpr = window.devicePixelRatio || 1;
        var W = canvas.clientWidth || 600, H = 250;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var p = palette();

        var i = Math.floor(v.step / 3), j = v.step % 3;
        var cell = 34, gap = 4;

        function grid(x0, y0, M, hlRow, hlCol, title) {
          ctx.font = '11px ui-monospace, monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          for (var r = 0; r < M.length; r++) {
            for (var c = 0; c < M[0].length; c++) {
              var x = x0 + c * (cell + gap), y = y0 + r * (cell + gap);
              var hot = (hlRow === r) || (hlCol === c);
              ctx.fillStyle = hot ? p.accent : p.sunken;
              ctx.globalAlpha = hot ? 0.22 : 1;
              ctx.fillRect(x, y, cell, cell);
              ctx.globalAlpha = 1;
              ctx.strokeStyle = hot ? p.accent : p.rule;
              ctx.lineWidth = hot ? 1.5 : 1;
              ctx.strokeRect(x, y, cell, cell);
              ctx.fillStyle = hot ? p.ink : p.soft;
              ctx.fillText(M[r][c].toFixed(1), x + cell / 2, y + cell / 2);
            }
          }
          ctx.fillStyle = p.faint; ctx.font = '10px ui-sans-serif, sans-serif';
          ctx.fillText(title, x0 + (M[0].length * (cell + gap)) / 2 - gap / 2, y0 - 12);
        }

        var C = A.map(function (row, r) {
          return B[0].map(function (_, c) {
            return row.reduce(function (a, av, k) { return a + av * B[k][c]; }, 0);
          });
        });

        var y0 = 56;
        grid(14, y0, A, i, null, 'A  (3×2)');
        ctx.fillStyle = p.faint; ctx.font = '15px ui-sans-serif, sans-serif';
        ctx.fillText('@', 14 + 2 * (cell + gap) + 12, y0 + cell);
        grid(14 + 2 * (cell + gap) + 28, y0 - (cell + gap), B, null, j, 'B  (2×3)');
        ctx.fillStyle = p.faint; ctx.font = '15px ui-sans-serif, sans-serif';
        var cx = 14 + 2 * (cell + gap) + 28 + 3 * (cell + gap) + 14;
        ctx.fillText('=', cx, y0 + cell);

        // output grid, only cells computed so far
        var x0 = cx + 24;
        ctx.font = '11px ui-monospace, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var r = 0; r < 3; r++) {
          for (var c = 0; c < 3; c++) {
            var x = x0 + c * (cell + gap), y = y0 + r * (cell + gap);
            var done = r * 3 + c <= v.step;
            var cur = (r === i && c === j);
            ctx.fillStyle = cur ? p.warn : p.sunken;
            ctx.globalAlpha = cur ? 0.25 : 1;
            ctx.fillRect(x, y, cell, cell);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = cur ? p.warn : p.rule;
            ctx.lineWidth = cur ? 1.5 : 1;
            ctx.strokeRect(x, y, cell, cell);
            if (done) {
              ctx.fillStyle = cur ? p.ink : p.soft;
              ctx.fillText(C[r][c].toFixed(1), x + cell / 2, y + cell / 2);
            }
          }
        }
        ctx.fillStyle = p.faint; ctx.font = '10px ui-sans-serif, sans-serif';
        ctx.fillText('C  (3×3)', x0 + 1.5 * (cell + gap) - gap / 2, y0 - 12);
      },
      readout: function (v) {
        var i = Math.floor(v.step / 3), j = v.step % 3;
        var terms = A[i].map(function (a, k) {
          return a.toFixed(1) + '×' + B[k][j].toFixed(1);
        }).join(' + ');
        var val = A[i].reduce(function (acc, a, k) { return acc + a * B[k][j]; }, 0);
        return 'C[' + (i + 1) + ',' + (j + 1) + '] = row ' + (i + 1) + ' of A · column ' + (j + 1) + ' of B = ' +
          terms + ' = <b>' + val.toFixed(2) + '</b>\n' +
          'Every output cell is one dot product. A linear layer is exactly this, with B = Wᵀ.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: 1D convolution over a sentence                   (chapter 03)
     ---------------------------------------------------------------------- */

  REGISTRY['conv1d'] = function (el) {
    var tokens = ['a', 'genuinely', 'not', 'bad', 'film', 'at', 'all'];
    var emb = [0.2, 0.8, -0.9, -0.6, 0.4, 0.1, 0.0];   // 1-d "sentiment" embedding
    build(el, {
      title: 'A 1-D convolution sliding over a sentence',
      height: 200,
      controls: [
        { name: 'K', label: 'kernel width', type: 'range', min: 2, max: 4, step: 1, value: 3,
          fmt: function (v) { return String(v); } },
        { name: 'pos', label: 'window start', type: 'range', min: 0, max: 5, step: 1, value: 0,
          fmt: function (v) { return String(v); } },
        { name: 'w0', label: 'w₁', type: 'range', min: -2, max: 2, step: 0.1, value: -1,
          fmt: function (v) { return v.toFixed(1); } },
        { name: 'w1', label: 'w₂', type: 'range', min: -2, max: 2, step: 0.1, value: 1.2,
          fmt: function (v) { return v.toFixed(1); } }
      ],
      draw: function (g, v, canvas) {
        var dpr = window.devicePixelRatio || 1;
        var W = canvas.clientWidth || 600, H = 200;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var p = palette();

        var K = v.K;
        var maxStart = tokens.length - K;
        var start = Math.min(v.pos, maxStart);
        var slot = W / tokens.length;

        // token row
        ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var i = 0; i < tokens.length; i++) {
          var x = slot * (i + 0.5);
          var inWin = i >= start && i < start + K;
          ctx.fillStyle = inWin ? p.accent : p.sunken;
          ctx.globalAlpha = inWin ? 0.2 : 1;
          ctx.fillRect(x - slot * 0.42, 26, slot * 0.84, 30);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = inWin ? p.accent : p.rule;
          ctx.lineWidth = inWin ? 1.6 : 1;
          ctx.strokeRect(x - slot * 0.42, 26, slot * 0.84, 30);
          ctx.fillStyle = inWin ? p.ink : p.soft;
          ctx.fillText(tokens[i], x, 41);
          ctx.fillStyle = p.faint; ctx.font = '10px ui-monospace, monospace';
          ctx.fillText(emb[i].toFixed(1), x, 66);
          ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
        }

        // feature map
        var ws = [v.w0, v.w1, 0.5, -0.3].slice(0, K);
        var outs = [];
        for (var s = 0; s <= maxStart; s++) {
          var acc = 0;
          for (var k = 0; k < K; k++) acc += ws[k] * emb[s + k];
          outs.push(Math.max(0, acc));            // ReLU
        }
        var maxOut = Math.max.apply(null, outs.concat([0.1]));
        var base = 168;
        for (var s2 = 0; s2 < outs.length; s2++) {
          var cx = slot * (s2 + K / 2);
          var h = (outs[s2] / maxOut) * 68;
          var hot = s2 === start;
          ctx.fillStyle = hot ? p.warn : p.concept;
          ctx.globalAlpha = hot ? 1 : 0.45;
          ctx.fillRect(cx - 13, base - h, 26, h);
          ctx.globalAlpha = 1;
          ctx.fillStyle = hot ? p.ink : p.faint;
          ctx.font = '10px ui-monospace, monospace';
          ctx.fillText(outs[s2].toFixed(2), cx, base - h - 8);
        }
        ctx.strokeStyle = p.rule;
        ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base); ctx.stroke();
        ctx.fillStyle = p.faint; ctx.font = '10px ui-sans-serif, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('feature map after ReLU — global max pool takes the tallest bar', 4, base + 14);
      },
      readout: function (v) {
        var K = v.K, start = Math.min(v.pos, tokens.length - K);
        var ws = [v.w0, v.w1, 0.5, -0.3].slice(0, K);
        var terms = [], acc = 0;
        for (var k = 0; k < K; k++) {
          terms.push(ws[k].toFixed(1) + '×' + emb[start + k].toFixed(1));
          acc += ws[k] * emb[start + k];
        }
        return 'window "<b>' + tokens.slice(start, start + K).join(' ') + '</b>" → ' + terms.join(' + ') +
          ' = ' + acc.toFixed(2) + ' → ReLU → <b>' + Math.max(0, acc).toFixed(2) + '</b>\n' +
          'The same weights are reused at every position. That is what "translation invariant" buys you: ' +
          '"not bad" fires wherever it appears.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: attention                                     (chapters 06–07, 09)
     ---------------------------------------------------------------------- */

  REGISTRY['attention'] = function (el) {
    var tokens = ['the', 'animal', 'crossed', 'the', 'road', 'because', 'it', 'was', 'tired'];
    // hand-tuned pseudo-scores so the demo tells a true story about coreference
    var affinity = [
      [3, 1, 0, 2, 0, 0, 0, 0, 0],
      [1, 3, 1, 0, 1, 0, 2, 0, 1],
      [0, 1, 3, 0, 2, 1, 0, 0, 0],
      [2, 0, 0, 3, 2, 0, 0, 0, 0],
      [0, 1, 2, 2, 3, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 3, 1, 1, 1],
      [0, 3, 0, 0, 1, 1, 3, 1, 1],
      [0, 1, 0, 0, 0, 1, 1, 3, 2],
      [0, 2, 0, 0, 0, 1, 1, 2, 3]
    ];
    build(el, {
      title: 'Scaled dot-product attention: who looks at whom',
      height: 300,
      controls: [
        { name: 'scale', label: '√dₖ scaling', type: 'check', value: true },
        { name: 'causal', label: 'causal mask (decoder)', type: 'check', value: false },
        { name: 'dk', label: 'dₖ', type: 'range', min: 1, max: 128, step: 1, value: 16,
          fmt: function (v) { return String(v); } }
      ],
      draw: function (g, v, canvas) {
        var dpr = window.devicePixelRatio || 1;
        var W = canvas.clientWidth || 600, H = 300;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var p = palette();

        var n = tokens.length;
        var padL = 78, padT = 46;
        var cell = Math.min((W - padL - 16) / n, (H - padT - 20) / n, 26);

        var denom = v.scale ? Math.sqrt(v.dk) : 1;
        // scores are affinity * dk / 4 so that raising dk really does inflate the dot product
        var rows = affinity.map(function (row, i) {
          var scores = row.map(function (a, j) {
            if (v.causal && j > i) return -Infinity;
            return (a * v.dk / 4) / denom;
          });
          return softmax(scores.map(function (s) { return s === -Infinity ? -1e9 : s; }), 1);
        });

        ctx.font = '10px ui-sans-serif, system-ui, sans-serif';
        for (var i = 0; i < n; i++) {
          for (var j = 0; j < n; j++) {
            var w = rows[i][j];
            var x = padL + j * cell, y = padT + i * cell;
            ctx.fillStyle = p.accent;
            ctx.globalAlpha = clamp(w * 1.6, 0.02, 1);
            ctx.fillRect(x, y, cell - 1.5, cell - 1.5);
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = p.soft; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.fillText(tokens[i], padL - 6, padT + i * cell + cell / 2);
        }
        ctx.save();
        for (var j2 = 0; j2 < n; j2++) {
          ctx.save();
          ctx.translate(padL + j2 * cell + cell / 2, padT - 6);
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = p.faint; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(tokens[j2], 0, 0);
          ctx.restore();
        }
        ctx.restore();
        ctx.fillStyle = p.faint; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('rows = queries (who is asking)   columns = keys (what is being read)', 4, H - 16);
      },
      readout: function (v) {
        var i = 6; // "it"
        var denom = v.scale ? Math.sqrt(v.dk) : 1;
        var scores = affinity[i].map(function (a, j) {
          return (v.causal && j > i) ? -1e9 : (a * v.dk / 4) / denom;
        });
        var w = softmax(scores, 1);
        var best = w.indexOf(Math.max.apply(null, w));
        var maxw = Math.max.apply(null, w);
        return 'Query "<b>it</b>" attends most to "<b>' + tokens[best] + '</b>" (weight ' + maxw.toFixed(3) + ').\n' +
          (v.scale
            ? 'With √dₖ scaling the row stays soft as dₖ grows.'
            : 'Without scaling, raise dₖ and watch the row collapse to one-hot — softmax saturates and gradients die.');
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: positional encoding                              (chapter 07)
     ---------------------------------------------------------------------- */

  REGISTRY['posenc'] = function (el) {
    build(el, {
      title: 'Sinusoidal positional encoding',
      height: 230,
      controls: [
        { name: 'd', label: 'd_model', type: 'range', min: 8, max: 64, step: 8, value: 32,
          fmt: function (v) { return String(v); } },
        { name: 'pos', label: 'inspect position', type: 'range', min: 0, max: 39, step: 1, value: 3,
          fmt: function (v) { return String(v); } }
      ],
      draw: function (g, v, canvas) {
        var dpr = window.devicePixelRatio || 1;
        var W = canvas.clientWidth || 600, H = 230;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var p = palette();

        var L = 40, d = v.d;
        var padL = 34, padT = 22, padB = 26;
        var cw = (W - padL - 10) / d, ch = (H - padT - padB) / L;

        function pe(pos, i) {
          var k = Math.floor(i / 2);
          var ang = pos / Math.pow(10000, (2 * k) / d);
          return i % 2 === 0 ? Math.sin(ang) : Math.cos(ang);
        }

        for (var pos = 0; pos < L; pos++) {
          for (var i = 0; i < d; i++) {
            var val = pe(pos, i);
            ctx.fillStyle = val >= 0 ? p.accent : p.warn;
            ctx.globalAlpha = Math.abs(val) * 0.9 + 0.05;
            ctx.fillRect(padL + i * cw, padT + pos * ch, Math.max(cw - 0.5, 1), Math.max(ch - 0.4, 1));
            ctx.globalAlpha = 1;
          }
          if (pos === v.pos) {
            ctx.strokeStyle = p.ink; ctx.lineWidth = 1.2;
            ctx.strokeRect(padL - 1, padT + pos * ch - 1, d * cw + 2, ch + 2);
          }
        }
        ctx.fillStyle = p.faint; ctx.font = '10px ui-sans-serif, sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (var t = 0; t < L; t += 8) ctx.fillText(String(t), padL - 6, padT + (t + 0.5) * ch);
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('embedding dimension  →', padL + (d * cw) / 2, H - 14);
        ctx.textAlign = 'left';
        ctx.fillText('position ↓', 2, 6);
      },
      readout: function (v) {
        var d = v.d, pos = v.pos;
        function pe(pos, i) {
          var k = Math.floor(i / 2);
          var ang = pos / Math.pow(10000, (2 * k) / d);
          return i % 2 === 0 ? Math.sin(ang) : Math.cos(ang);
        }
        var vec = [];
        for (var i = 0; i < Math.min(6, d); i++) vec.push(pe(pos, i).toFixed(3));
        return 'PE(' + pos + ')[0:6] = [' + vec.join(', ') + ' …]\n' +
          'Left columns spin fast (they encode fine position), right columns spin slowly (coarse position). ' +
          'Every position gets a unique fingerprint, and PE(pos+k) is a fixed linear function of PE(pos) — ' +
          'which is how the model can learn <i>relative</i> offsets.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: quantization                                     (chapter 11)
     ---------------------------------------------------------------------- */

  REGISTRY['quantize'] = function (el) {
    // a fixed pseudo-random weight sample, roughly normal, with one outlier
    var Wt = [];
    var seed = 7;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    for (var i = 0; i < 220; i++) {
      var u1 = Math.max(rnd(), 1e-9), u2 = rnd();
      Wt.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(6.2832 * u2) * 0.35);
    }
    Wt[42] = 2.4;   // the outlier that ruins naive scaling

    build(el, {
      title: 'Quantizing weights: bits, scale, and the outlier problem',
      height: 240,
      controls: [
        { name: 'bits', label: 'bits', type: 'range', min: 2, max: 8, step: 1, value: 8,
          fmt: function (v) { return String(v); } },
        { name: 'clip', label: 'clip range', type: 'range', min: 0.3, max: 2.6, step: 0.05, value: 2.5,
          fmt: function (v) { return '±' + v.toFixed(2); } },
        { name: 'outlier', label: 'include outlier', type: 'check', value: true }
      ],
      draw: function (g, v, canvas) {
        var data = v.outlier ? Wt : Wt.filter(function (_, i) { return i !== 42; });
        var levels = Math.pow(2, v.bits);
        var s = (2 * v.clip) / (levels - 1);
        var q = data.map(function (w) {
          var qi = Math.round(clamp(w, -v.clip, v.clip) / s);
          return qi * s;
        });

        var dpr = window.devicePixelRatio || 1;
        var W = canvas.clientWidth || 600, H = 240;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var p = palette();

        var padL = 30, padR = 12, padT = 14, padB = 40;
        var lo = -2.7, hi = 2.7;
        var X = function (x) { return padL + (x - lo) / (hi - lo) * (W - padL - padR); };

        // quantization grid lines
        ctx.strokeStyle = p.rule; ctx.lineWidth = 1;
        var shown = 0;
        for (var qi = -Math.floor(v.clip / s); qi <= Math.floor(v.clip / s) && shown < 300; qi++, shown++) {
          var gx = X(qi * s);
          ctx.globalAlpha = levels > 64 ? 0.25 : 0.75;
          ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, H - padB); ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // original weights (top) and quantized (bottom)
        data.forEach(function (w, i) {
          ctx.fillStyle = p.concept; ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.arc(X(w), padT + 34, 2.4, 0, 6.284); ctx.fill();
          ctx.globalAlpha = 1;
        });
        q.forEach(function (w) {
          ctx.fillStyle = p.warn; ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.arc(X(w), H - padB - 30, 2.4, 0, 6.284); ctx.fill();
          ctx.globalAlpha = 1;
        });

        ctx.strokeStyle = p.byhand; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        [-v.clip, v.clip].forEach(function (c) {
          ctx.beginPath(); ctx.moveTo(X(c), padT); ctx.lineTo(X(c), H - padB); ctx.stroke();
        });
        ctx.setLineDash([]);

        ctx.font = '10px ui-sans-serif, sans-serif'; ctx.textAlign = 'left';
        ctx.fillStyle = p.concept; ctx.fillText('float32 weights', 4, padT + 4);
        ctx.fillStyle = p.warn;    ctx.fillText('after quantize → dequantize', 4, H - padB - 58);
        ctx.fillStyle = p.faint;   ctx.textAlign = 'center';
        ctx.fillText('grid lines are the ' + levels + ' representable values', W / 2, H - 18);
      },
      readout: function (v) {
        var data = v.outlier ? Wt : Wt.filter(function (_, i) { return i !== 42; });
        var levels = Math.pow(2, v.bits);
        var s = (2 * v.clip) / (levels - 1);
        var se = 0, clipped = 0;
        data.forEach(function (w) {
          if (Math.abs(w) > v.clip) clipped++;
          var qw = Math.round(clamp(w, -v.clip, v.clip) / s) * s;
          se += (w - qw) * (w - qw);
        });
        var rmse = Math.sqrt(se / data.length);
        var bytes = data.length * v.bits / 8;
        return 'step size Δ = 2·clip/(2^b − 1) = <b>' + s.toFixed(4) + '</b>   RMSE = <b>' + rmse.toFixed(4) +
          '</b>   clipped = <b>' + clipped + '</b> weight(s)\n' +
          'storage: ' + (data.length * 4) + ' B in fp32 → <b>' + bytes.toFixed(0) + ' B</b> at ' + v.bits +
          '-bit  (' + (32 / v.bits).toFixed(1) + '× smaller)\n' +
          'Turn the outlier on with a wide clip range: one weight at 2.4 stretches Δ for all 220, and every ' +
          'ordinary weight gets coarser. Turn it off, or clip it, and error collapses — that is the entire ' +
          'idea behind per-channel scales and outlier-aware schemes like LLM.int8().';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: LoRA parameter budget                            (chapter 11)
     ---------------------------------------------------------------------- */

  REGISTRY['lora'] = function (el) {
    build(el, {
      title: 'LoRA: how few parameters can you get away with?',
      height: 210,
      controls: [
        { name: 'd', label: 'd_model', type: 'range', min: 64, max: 1024, step: 64, value: 256,
          fmt: function (v) { return String(v); } },
        { name: 'r', label: 'rank r', type: 'range', min: 1, max: 64, step: 1, value: 8,
          fmt: function (v) { return String(v); } },
        { name: 'layers', label: 'layers adapted', type: 'range', min: 1, max: 24, step: 1, value: 4,
          fmt: function (v) { return String(v); } }
      ],
      draw: function (g, v, canvas) {
        var dpr = window.devicePixelRatio || 1;
        var W = canvas.clientWidth || 600, H = 210;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var p = palette();

        var d = v.d, r = v.r;
        var scale = Math.min(150 / d, 0.42);
        var wSize = d * scale;
        var x0 = 20, y0 = (H - wSize) / 2;

        // frozen W
        ctx.fillStyle = p.sunken; ctx.strokeStyle = p.ruleStrong; ctx.lineWidth = 1;
        ctx.fillRect(x0, y0, wSize, wSize); ctx.strokeRect(x0, y0, wSize, wSize);
        ctx.fillStyle = p.soft; ctx.font = '11px ui-sans-serif, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('W (frozen)', x0 + wSize / 2, y0 + wSize / 2);
        ctx.fillStyle = p.faint; ctx.font = '9px ui-monospace, monospace';
        ctx.fillText(d + '×' + d, x0 + wSize / 2, y0 + wSize / 2 + 14);

        ctx.fillStyle = p.faint; ctx.font = '16px ui-sans-serif, sans-serif';
        ctx.fillText('+', x0 + wSize + 18, y0 + wSize / 2);

        // B (d×r) and A (r×d)
        var bx = x0 + wSize + 38;
        var rSize = Math.max(r * scale, 4);
        ctx.fillStyle = p.accent; ctx.globalAlpha = 0.28;
        ctx.fillRect(bx, y0, rSize, wSize);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = p.accent; ctx.strokeRect(bx, y0, rSize, wSize);

        var ax = bx + rSize + 14;
        ctx.fillStyle = p.notebook; ctx.globalAlpha = 0.28;
        ctx.fillRect(ax, y0, wSize, rSize);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = p.notebook; ctx.strokeRect(ax, y0, wSize, rSize);

        ctx.fillStyle = p.accent; ctx.font = '10px ui-sans-serif, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('B ' + d + '×' + r, bx + rSize / 2, y0 - 10);
        ctx.fillStyle = p.notebook;
        ctx.fillText('A ' + r + '×' + d, ax + wSize / 2, y0 + rSize + 12);

        // proportion bar
        var full = d * d, lo = 2 * d * r;
        var barY = H - 22, barW = W - 40;
        ctx.fillStyle = p.rule; ctx.fillRect(20, barY, barW, 8);
        ctx.fillStyle = p.accent; ctx.fillRect(20, barY, barW * Math.min(lo / full, 1), 8);
      },
      readout: function (v) {
        var d = v.d, r = v.r, n = v.layers;
        var full = d * d * n, lora = 2 * d * r * n;
        return 'full fine-tune: <b>' + full.toLocaleString() + '</b> trainable parameters   ' +
          'LoRA(r=' + r + '): <b>' + lora.toLocaleString() + '</b>   ' +
          '(<b>' + (100 * lora / full).toFixed(2) + '%</b>, ' + (full / lora).toFixed(0) + '× fewer)\n' +
          'B starts at zero so BA = 0 and the adapted model is identical to the base model at step 0. ' +
          'Optimizer state shrinks by the same factor — that is what actually lets this fit in 24 GB.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: learning-rate schedule                           (chapter 08)
     ---------------------------------------------------------------------- */

  REGISTRY['lr-schedule'] = function (el) {
    build(el, {
      title: 'Warmup + cosine decay',
      height: 210,
      xrange: [0, 1000], yrange: [0, 1.15],
      controls: [
        { name: 'warm', label: 'warmup steps', type: 'range', min: 0, max: 400, step: 10, value: 100,
          fmt: function (v) { return String(v); } },
        { name: 'floor', label: 'min lr fraction', type: 'range', min: 0, max: 0.5, step: 0.01, value: 0.05,
          fmt: function (v) { return v.toFixed(2); } }
      ],
      draw: function (g, v) {
        g.axes({ xticks: 5, yticks: 4, xdec: 0, ydec: 2, xlabel: 'step' });
        var total = 1000;
        g.curve(function (s) {
          if (s < v.warm) return v.warm === 0 ? 1 : s / v.warm;
          var t = (s - v.warm) / (total - v.warm);
          return v.floor + (1 - v.floor) * 0.5 * (1 + Math.cos(Math.PI * clamp(t, 0, 1)));
        }, g.p.accent, 2.5);
        if (v.warm > 0) g.line(v.warm, 0, v.warm, 1.15, g.p.faint, 1, [4, 3]);
        g.legend([['lr / lr_max', g.p.accent]]);
      },
      readout: function (v) {
        return 'Warmup exists because Adam\'s second-moment estimate is garbage for the first few dozen steps: ' +
          'a full-size step taken on a bad variance estimate can wreck an initialisation that took no time to ruin ' +
          'and a long time to recover from.\nCosine decay then spends the end of training taking small, careful steps ' +
          'near a minimum instead of bouncing around it.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: memory budget for a 24 GB Mac                    (chapter 11)
     ---------------------------------------------------------------------- */

  REGISTRY['memory-budget'] = function (el) {
    build(el, {
      title: 'What actually fits in 24 GB of unified memory',
      height: 200,
      controls: [
        { name: 'params', label: 'parameters (millions)', type: 'range', min: 5, max: 8000, step: 5, value: 100,
          fmt: function (v) { return v >= 1000 ? (v / 1000).toFixed(1) + 'B' : v + 'M'; } },
        { name: 'mode', label: 'mode', type: 'select', value: 'adam',
          options: [['adam', 'full fine-tune (Adam, fp32)'], ['lora', 'LoRA r=8 on fp16 base'],
                    ['infer16', 'inference fp16'], ['infer4', 'inference 4-bit']] }
      ],
      draw: function (g, v, canvas) {
        var P = v.params * 1e6;
        var parts;
        if (v.mode === 'adam') {
          parts = [['weights fp32', P * 4], ['gradients', P * 4], ['Adam m', P * 4], ['Adam v', P * 4],
                   ['activations', P * 4 * 0.35]];
        } else if (v.mode === 'lora') {
          var lp = P * 0.002;
          parts = [['frozen base fp16', P * 2], ['LoRA weights', lp * 4], ['LoRA grads', lp * 4],
                   ['Adam states', lp * 8], ['activations', P * 2 * 0.35]];
        } else if (v.mode === 'infer16') {
          parts = [['weights fp16', P * 2], ['KV cache + activations', P * 2 * 0.12]];
        } else {
          parts = [['weights 4-bit', P * 0.5], ['KV cache + activations', P * 2 * 0.12]];
        }

        var dpr = window.devicePixelRatio || 1;
        var W = canvas.clientWidth || 600, H = 200;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var p = palette();

        var BUDGET = 24 * 1e9 * 0.72;   // the OS and everything else needs a share
        var total = parts.reduce(function (a, x) { return a + x[1]; }, 0);
        var barW = W - 30, x = 15, y = 60, h = 44;
        var cols = [p.accent, p.concept, p.notebook, p.byhand, p.warn];
        var scale = barW / Math.max(total, BUDGET);

        parts.forEach(function (part, i) {
          var w = part[1] * scale;
          ctx.fillStyle = cols[i % cols.length];
          ctx.globalAlpha = 0.82;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1;
          if (w > 46) {
            ctx.fillStyle = p.bg; ctx.font = '10px ui-sans-serif, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText((part[1] / 1e9).toFixed(1) + ' GB', x + w / 2, y + h / 2);
          }
          x += w;
        });

        // budget line
        var bx = 15 + BUDGET * scale;
        ctx.strokeStyle = p.warn; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(bx, y - 22); ctx.lineTo(bx, y + h + 14); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = p.warn; ctx.font = '10px ui-sans-serif, sans-serif';
        ctx.textAlign = bx > W - 120 ? 'right' : 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(' usable budget ≈ 17 GB', bx + (bx > W - 120 ? -4 : 4), y - 24);

        // legend
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        var lx = 15, ly = y + h + 30;
        parts.forEach(function (part, i) {
          ctx.fillStyle = cols[i % cols.length];
          ctx.fillRect(lx, ly - 4, 10, 8);
          ctx.fillStyle = p.soft; ctx.font = '10px ui-sans-serif, sans-serif';
          ctx.fillText(part[0], lx + 15, ly);
          lx += 25 + ctx.measureText(part[0]).width;
          if (lx > W - 90) { lx = 15; ly += 16; }
        });
      },
      readout: function (v) {
        var P = v.params * 1e6;
        var total;
        if (v.mode === 'adam') total = P * 16 + P * 1.4;
        else if (v.mode === 'lora') total = P * 2 + P * 0.032 + P * 0.7;
        else if (v.mode === 'infer16') total = P * 2.24;
        else total = P * 0.74;
        var fits = total < 24e9 * 0.72;
        return 'estimated peak memory: <b>' + (total / 1e9).toFixed(2) + ' GB</b> — ' +
          (fits ? '<b>fits</b> on a 24 GB M4 Air' : '<b>does not fit</b>: the allocator will thrash or the process will be killed') +
          '\nRule of thumb: full Adam fine-tuning costs ~16 bytes per parameter. That is the number that decides ' +
          'what you can train, and it is why every chapter here keeps models in the few-million-parameter range.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: BPTT / vanishing gradient                        (chapters 04–05)
     ---------------------------------------------------------------------- */

  REGISTRY['vanishing'] = function (el) {
    build(el, {
      title: 'Why gradients vanish (or explode) through time',
      height: 220,
      xrange: [0, 40], yrange: [-6, 3],
      controls: [
        { name: 'w', label: 'recurrent scale |w·σ′|', type: 'range', min: 0.5, max: 1.5, step: 0.01, value: 0.85,
          fmt: function (v) { return v.toFixed(2); } }
      ],
      draw: function (g, v) {
        g.axes({ xticks: 4, yticks: 9, xdec: 0, ydec: 0,
                 yfmt: function (y) { return '1e' + y.toFixed(0); },
                 xlabel: 'time steps back through the sequence' });
        g.curve(function (t) { return Math.log10(Math.pow(v.w, t)); }, g.p.accent, 2.5);
        g.line(0, 0, 40, 0, g.p.faint, 1, [3, 3]);
      },
      readout: function (v) {
        var t = 30, mag = Math.pow(v.w, t);
        return 'After 30 steps the gradient is multiplied by ' + v.w.toFixed(2) + '³⁰ = <b>' +
          mag.toExponential(2) + '</b>.\n' +
          (v.w < 0.98
            ? 'Below 1 the product decays geometrically: by step 30 the earliest tokens contribute essentially nothing, ' +
              'so a plain RNN cannot learn long-range dependencies no matter how long you train it.'
            : v.w > 1.02
              ? 'Above 1 it explodes — this is what gradient clipping exists to contain.'
              : 'Right at 1 the signal is preserved. An LSTM\'s cell state is engineered to sit near here: the forget ' +
                'gate makes the multiplier learnable instead of fixed.');
      }
    });
  };

  /* ----------------------------------------------------------------------
     Widget: batching / padding                               (chapter 08)
     ---------------------------------------------------------------------- */

  REGISTRY['padding'] = function (el) {
    var lens = [4, 11, 6, 3, 9, 5, 12, 7];
    build(el, {
      title: 'Padding waste: why bucketing by length matters',
      height: 200,
      controls: [
        { name: 'sorted', label: 'sort batch by length', type: 'check', value: false },
        { name: 'bs', label: 'batch size', type: 'range', min: 2, max: 8, step: 2, value: 8,
          fmt: function (v) { return String(v); } }
      ],
      draw: function (g, v, canvas) {
        var dpr = window.devicePixelRatio || 1;
        var W = canvas.clientWidth || 600, H = 200;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        var ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var p = palette();

        var L = v.sorted ? lens.slice().sort(function (a, b) { return a - b; }) : lens.slice();
        var rowH = (H - 30) / lens.length;
        var cellW = (W - 20) / 13;

        var batches = [];
        for (var i = 0; i < L.length; i += v.bs) batches.push(L.slice(i, i + v.bs));

        var row = 0;
        batches.forEach(function (b) {
          var maxL = Math.max.apply(null, b);
          b.forEach(function (len) {
            for (var t = 0; t < maxL; t++) {
              var pad = t >= len;
              ctx.fillStyle = pad ? p.warn : p.concept;
              ctx.globalAlpha = pad ? 0.28 : 0.8;
              ctx.fillRect(10 + t * cellW, 12 + row * rowH, cellW - 2, rowH - 3);
              ctx.globalAlpha = 1;
            }
            row++;
          });
        });
        ctx.fillStyle = p.faint; ctx.font = '10px ui-sans-serif, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('solid = real tokens    faded = <PAD>, computed then thrown away', 10, H - 4);
      },
      readout: function (v) {
        var L = v.sorted ? lens.slice().sort(function (a, b) { return a - b; }) : lens.slice();
        var real = 0, padded = 0;
        for (var i = 0; i < L.length; i += v.bs) {
          var b = L.slice(i, i + v.bs);
          var m = Math.max.apply(null, b);
          b.forEach(function (len) { real += len; padded += m; });
        }
        return 'real tokens: <b>' + real + '</b>   tokens actually computed: <b>' + padded + '</b>   ' +
          'wasted: <b>' + (100 * (1 - real / padded)).toFixed(1) + '%</b>\n' +
          'Sorting by length before batching costs nothing and can hand you back a third of your compute. ' +
          'Attention is quadratic in the padded length, so the saving is larger than this bar chart suggests.';
      }
    });
  };

  /* ----------------------------------------------------------------------
     mount everything
     ---------------------------------------------------------------------- */

  function mountWidgets() {
    $$('[data-widget]').forEach(function (el) {
      var name = el.getAttribute('data-widget');
      var fn = REGISTRY[name];
      if (!fn) {
        el.innerHTML = '<div class="widget-title">missing widget: ' + name + '</div>';
        return;
      }
      try { fn(el); }
      catch (e) {
        el.innerHTML = '<div class="widget-title">widget "' + name + '" failed: ' + e.message + '</div>';
      }
    });
  }

  function init() {
    applyMode();          // sets body class and shows the right chapters
    onRoute({ smooth: false });
    mountWidgets();       // after routing, so visible canvases have a width
    redrawVisibleWidgets();
    onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.addEventListener('load', renderMath);
})();
