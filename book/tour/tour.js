/* Records a narrated tour of the book, aimed at graduate-level learners.
 *
 * Pacing is driven by the voiceover: each caption is held for the length of its
 * audio clip (durations.json, written by voice.js) plus a little padding, and the
 * actual start offset of every beat is logged to timeline.json so mix.js can place
 * the audio precisely. Run voice.js first.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = process.env.BOOK_URL || 'https://dcaponi.github.io/pytorch-nn-training/';
const OUT = process.env.OUT_DIR || './video';
const W = 1440, H = 900;
const PAD = 0.85;                       // seconds of breathing room after each clip

const beats = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'beats.json'), 'utf8')).map(b => [b.id, b]));
const durations = fs.existsSync(path.join(__dirname, 'durations.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, 'durations.json'), 'utf8'))
  : {};

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  });
  const T0 = Date.now();                // recording starts with the context
  const page = await ctx.newPage();
  const timeline = [];

  await page.goto(URL, { waitUntil: 'load' });
  await sleep(2500);                    // let KaTeX typeset

  await page.addStyleTag({ content: `
    #tour-cap {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 99999;
      background: linear-gradient(to top, rgba(12,10,18,.97) 62%, rgba(12,10,18,0));
      color: #f4f1ec; padding: 2.1rem 3rem 1.6rem;
      font: 400 21px/1.5 ui-sans-serif, -apple-system, "Segoe UI", sans-serif;
      opacity: 0; transition: opacity .4s ease; pointer-events: none;
      text-shadow: 0 1px 3px rgba(0,0,0,.6);
    }
    #tour-cap.on { opacity: 1; }
    #tour-cap b { color: #b9a6ff; font-weight: 650; }
    #tour-cap .kicker {
      display: block; font-size: 12px; letter-spacing: .16em; text-transform: uppercase;
      color: #8f86a8; margin-bottom: .45rem; font-weight: 700;
    }
    #tour-cursor {
      position: fixed; z-index: 99998; width: 22px; height: 22px; margin: -11px 0 0 -11px;
      border-radius: 50%; background: rgba(124,92,255,.35);
      box-shadow: 0 0 0 2px rgba(124,92,255,.9); pointer-events: none;
      transition: left .35s ease, top .35s ease; opacity: 0;
    }
    #tour-cursor.on { opacity: 1; }
    html { scroll-behavior: smooth; }
  `});
  await page.evaluate(() => {
    const c = document.createElement('div'); c.id = 'tour-cap'; document.body.appendChild(c);
    const k = document.createElement('div'); k.id = 'tour-cursor'; document.body.appendChild(k);
  });

  /** Show a beat's caption and hold for exactly as long as its narration runs. */
  const say = async id => {
    const b = beats[id];
    if (!b) throw new Error('unknown beat: ' + id);
    const at = (Date.now() - T0) / 1000;
    await page.evaluate(([k, h]) => {
      const c = document.getElementById('tour-cap');
      c.classList.remove('on');
      setTimeout(() => {
        c.innerHTML = '<span class="kicker">' + k + '</span>' + h;
        c.classList.add('on');
      }, 240);
    }, [b.kicker, b.caption]);
    timeline.push({ id, at: at + 0.24 });          // audio starts as the caption lands
    await sleep(((durations[id] || 4) + PAD) * 1000);
  };

  const cursor = async (x, y, on = true) => page.evaluate(([x, y, on]) => {
    const k = document.getElementById('tour-cursor');
    k.style.left = x + 'px'; k.style.top = y + 'px'; k.classList.toggle('on', on);
  }, [x, y, on]);
  const hideCursor = () => page.evaluate(() =>
    document.getElementById('tour-cursor').classList.remove('on'));

  const goto = async (hash, wait = 900) => {
    await page.evaluate(h => { window.location.hash = h; }, hash);
    await sleep(wait);
  };
  const scrollTo = async (sel, block = 'center') => {
    await page.evaluate(([s, b]) => {
      const el = document.querySelector(s);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: b });
    }, [sel, block]);
    await sleep(1100);
  };

  // ---------------------------------------------------------------- opening
  await say('open');
  await scrollTo('#preface ol');
  await say('registers');

  // ------------------------------------------------------------ foundations
  await goto('#/ch00');
  await say('ch00');
  await goto('#/ch00/ch00-the-two-rules-that-do-all-the-work');
  await scrollTo('#ch00-the-two-rules-that-do-all-the-work', 'start');
  await say('derive');

  // ---------------------------------------------------------------- widgets
  await goto('#/ch00');
  await page.evaluate(() => {
    const w = document.querySelector('#ch00 [data-widget="entropy"]') ||
              document.querySelector('#ch00 .widget');
    if (w) w.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await sleep(1300);

  // drag a slider while the narration plays, rather than after it
  const slider = page.locator('#ch00 .widget input[type=range]').first();
  const box = (await slider.count()) ? await slider.boundingBox() : null;
  const dragPromise = (async () => {
    if (!box) return;
    await sleep(3200);
    const y = box.y + box.height / 2;
    await cursor(box.x + box.width * 0.2, y);
    await page.mouse.move(box.x + box.width * 0.2, y);
    await page.mouse.down();
    for (const f of [0.35, 0.52, 0.7, 0.86, 0.62, 0.42, 0.5]) {
      await page.mouse.move(box.x + box.width * f, y, { steps: 14 });
      await cursor(box.x + box.width * f, y);
      await sleep(360);
    }
    await page.mouse.up();
    await hideCursor();
  })();
  await say('widgets');
  await dragPromise;

  // --------------------------------------------------------------- by hand
  await goto('#/ch00/ch00-by-hand-exercises');
  await scrollTo('#ch00-by-hand-exercises', 'start');
  await say('byhand');

  const det = page.locator('#ch00 details').first();
  if (await det.count()) {
    await det.scrollIntoViewIfNeeded();
    await sleep(400);
    await det.locator('summary').click();
    await sleep(1200);
  }
  await say('worked');

  // ------------------------------------------------------------ recognition
  await goto('#/ch00/ch00-which-tool');
  await scrollTo('#ch00-which-tool', 'start');
  await say('recognise');

  // ---------------------------------------------------------- architectures
  await goto('#/ch06');
  await scrollTo('#ch06 .widget', 'center');
  await say('arch');

  await goto('#/ch10');
  await sleep(500);
  await say('honest');

  await page.evaluate(() => {
    const b = document.querySelector('#ch10 .library') || document.querySelector('.library');
    if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await sleep(1100);
  await say('library');

  // ------------------------------------------------------------ the frontier
  await goto('#/appendix/appendix-the-modern-stack-what-changed-after-2017');
  await scrollTo('#appendix-the-modern-stack-what-changed-after-2017', 'start');
  await say('modern');

  await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('#appendix .box.concept')];
    const b = boxes[boxes.length - 1];
    if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await sleep(1000);
  await say('frontier');

  // --------------------------------------------------------------- features
  await goto('#/ch07');
  const sb = await page.locator('#toc-filter').boundingBox();
  if (sb) await cursor(sb.x + sb.width / 2, sb.y + sb.height / 2);
  const searchPromise = (async () => {
    await sleep(1200);
    await page.click('#toc-filter');
    await page.type('#toc-filter', 'vanishing gradient', { delay: 90 });
    await sleep(1500);
    await hideCursor();
    const hit = page.locator('.search-hit').first();
    if (await hit.count()) { await hit.click(); await sleep(1500); }
  })();
  await say('search');
  await searchPromise;
  await page.fill('#toc-filter', '');
  await sleep(500);

  const themePromise = (async () => {
    await sleep(2000);
    await page.click('#theme-toggle');
  })();
  await say('offline');
  await themePromise;
  await page.click('#theme-toggle');
  await sleep(900);

  // --------------------------------------------------------------- outcomes
  await goto('#/ch12');
  await sleep(600);
  await say('outcomes');
  await say('standard');

  await goto('#/preface');
  await sleep(500);
  await say('close');

  await page.evaluate(() => document.getElementById('tour-cap').classList.remove('on'));
  await sleep(1400);

  fs.writeFileSync(path.join(__dirname, 'timeline.json'), JSON.stringify(timeline, null, 2));
  await ctx.close();
  await browser.close();
  console.log(`recorded ${timeline.length} beats, ${((Date.now() - T0) / 1000).toFixed(1)}s`);
})();
