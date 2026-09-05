/* Headless tests for the book single-page app.
 *
 * Loads the built book/index.html in jsdom and exercises routing, legacy anchors,
 * chapter navigation, cross-reference clicks, search, mode switching, and widget
 * mounting. Run with `npm test` from this directory.
 *
 * jsdom stubs canvas and does not meaningfully run KaTeX, so widget *drawing*, maths
 * rendering, and CSS layout are out of scope here — see README.md.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const INDEX = path.join(__dirname, '..', 'index.html');
if (!fs.existsSync(INDEX)) {
  console.error('book/index.html not found — run `python3 book/build.py` first.');
  process.exit(2);
}
const html = fs.readFileSync(INDEX, 'utf8');

let pass = 0, fail = 0;
const errors = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? '  -> ' + detail : ''}`); }
}

const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://example.github.io/pytorch-nn-training/index.html',
  virtualConsole: vc,
  beforeParse(win) {
    // canvas is not implemented in jsdom; stub it so widgets mount without throwing
    win.HTMLCanvasElement.prototype.getContext = function () {
      const noop = () => {};
      return new Proxy({}, {
        get: (t, k) => {
          if (k === 'measureText') return () => ({ width: 10 });
          if (k === 'canvas') return null;
          return typeof k === 'string' ? (t[k] !== undefined ? t[k] : noop) : noop;
        },
        set: () => true,
      });
    };
    Object.defineProperty(win.HTMLElement.prototype, 'clientWidth',
      { get() { return 700; }, configurable: true });
    Object.defineProperty(win.HTMLElement.prototype, 'offsetTop',
      { get() { return 100; }, configurable: true });
    win.scrollTo = () => {};
    win.matchMedia = win.matchMedia || (q => ({
      matches: false, media: q, addEventListener() {}, removeEventListener() {},
    }));
  },
});

const { window } = dom;
const doc = window.document;
const visible = () => [...doc.querySelectorAll('#content > .chapter')].filter(c => !c.hidden);
const go = hash => {
  window.location.hash = hash;
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
};

setTimeout(() => {
  console.log('\n--- structure ---');
  const nChapters = doc.querySelectorAll('#content > .chapter').length;
  check('chapters present', nChapters >= 10, `found ${nChapters}`);
  check('search index inlined',
        Array.isArray(window.__BOOK_INDEX__) && window.__BOOK_INDEX__.length > 100,
        `${(window.__BOOK_INDEX__ || []).length} records`);
  check('no script errors on load', errors.length === 0, errors.slice(0, 3).join(' | '));

  console.log('\n--- default route ---');
  check('exactly one chapter visible', visible().length === 1,
        `${visible().length}: ${visible().map(c => c.id).join(',')}`);
  check('landed on the first chapter', visible()[0] && visible()[0].id === 'preface',
        visible()[0] && visible()[0].id);
  check('hash normalised to a route', window.location.hash === '#/preface', window.location.hash);

  console.log('\n--- routing ---');
  go('#/ch06');
  check('route #/ch06 shows ch06', visible()[0] && visible()[0].id === 'ch06',
        visible().map(c => c.id).join(','));
  check('document title updated', /Self-Attention/.test(doc.title), doc.title);

  console.log('\n--- legacy anchors ---');
  go('#ch03');
  check('legacy #ch03 resolves', visible()[0] && visible()[0].id === 'ch03');
  check('legacy hash rewritten', window.location.hash === '#/ch03', window.location.hash);
  go('#ch00-cross-entropy');
  check('legacy deep anchor finds its chapter', visible()[0] && visible()[0].id === 'ch00');
  check('deep anchor becomes a two-part route',
        window.location.hash === '#/ch00/ch00-cross-entropy', window.location.hash);
  go('#/does-not-exist');
  check('unknown route falls back', visible()[0] && visible()[0].id === 'preface');

  console.log('\n--- chapter navigation ---');
  go('#/ch05');
  const prev = doc.getElementById('prev-chapter');
  const next = doc.getElementById('next-chapter');
  check('prev points at ch04', prev.getAttribute('href') === '#/ch04', prev.getAttribute('href'));
  check('next points at ch06', next.getAttribute('href') === '#/ch06', next.getAttribute('href'));
  go('#/preface');
  check('prev hidden on the first chapter', prev.hidden === true);
  go('#/appendix');
  check('next hidden on the last chapter', next.hidden === true);

  console.log('\n--- cross-reference click and back ---');
  go('#/ch05');
  const xref = [...doc.querySelectorAll('#ch05 a.xref')]
    .find(a => a.getAttribute('href') === '#ch04');
  if (xref) {
    xref.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    check('clicking an xref routes to its chapter', visible()[0] && visible()[0].id === 'ch04');
    const back = doc.getElementById('back-btn');
    check('back button appears', back.hidden === false);
    back.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    check('back returns to the origin chapter', visible()[0] && visible()[0].id === 'ch05');
  } else {
    check('found an xref to click', false, 'no #ch04 xref inside ch05');
  }

  console.log('\n--- search ---');
  const box = doc.getElementById('toc-filter');
  const results = doc.getElementById('search-results');
  box.value = 'forget gate';
  box.dispatchEvent(new window.Event('input'));
  setTimeout(() => {
    check('search returns hits',
          !results.hidden && results.querySelectorAll('.search-hit').length > 0,
          `${results.querySelectorAll('.search-hit').length} hits`);
    const first = results.querySelector('.search-hit');
    check('hit links to a route', first && /^#\//.test(first.getAttribute('href')));
    check('hit highlights the term', /<mark>/.test(results.innerHTML));
    check('toc hidden while searching', doc.getElementById('toc').hidden === true);

    box.value = 'zzzznotaword';
    box.dispatchEvent(new window.Event('input'));
    setTimeout(() => {
      check('empty search reports no matches', /No matches/.test(results.innerHTML));
      box.value = '';
      box.dispatchEvent(new window.Event('input'));
      setTimeout(() => {
        check('clearing search restores the toc', doc.getElementById('toc').hidden === false);

        console.log('\n--- continuous mode ---');
        const mode = doc.getElementById('mode-toggle');
        mode.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        check('continuous shows every chapter', visible().length === nChapters,
              `${visible().length}/${nChapters}`);
        check('body carries the continuous class', doc.body.classList.contains('continuous'));
        check('chapter nav hidden in continuous mode',
              doc.getElementById('chapter-nav').hidden === true);
        mode.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        check('toggling back restores one chapter', visible().length === 1,
              `${visible().length} visible`);

        console.log('\n--- theme ---');
        doc.getElementById('theme-toggle')
           .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        check('theme attribute set',
              ['light', 'dark'].includes(doc.documentElement.getAttribute('data-theme')),
              doc.documentElement.getAttribute('data-theme'));

        console.log('\n--- widgets ---');
        const broken = [...doc.querySelectorAll('[data-widget]')]
          .filter(el => /missing widget|failed/.test(el.textContent));
        check('no widget missing or failed', broken.length === 0,
              broken.map(e => e.textContent.slice(0, 60)).join(' | '));
        check('widgets mounted a canvas each',
              doc.querySelectorAll('.widget canvas').length >= 15,
              `${doc.querySelectorAll('.widget canvas').length} canvases`);

        console.log(`\n${pass} passed, ${fail} failed`);
        if (errors.length) {
          console.log('\nruntime errors captured:');
          errors.slice(0, 8).forEach(e => console.log('  ' + e));
        }
        process.exit(fail ? 1 : 0);
      }, 200);
    }, 200);
  }, 200);
}, 600);
