/* Records a narrated tour of the book, aimed at graduate-level learners. */
const { chromium } = require('playwright');

const URL = process.env.BOOK_URL || 'https://dcaponi.github.io/pytorch-nn-training/';
const OUT = process.env.OUT_DIR || './video';
const W = 1440, H = 900;

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  });
  const page = await ctx.newPage();

  await page.goto(URL, { waitUntil: 'load' });
  await sleep(2500);                     // let KaTeX typeset

  // ---- narration overlay -------------------------------------------------
  await page.addStyleTag({ content: `
    #tour-cap {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 99999;
      background: linear-gradient(to top, rgba(12,10,18,.97) 62%, rgba(12,10,18,0));
      color: #f4f1ec; padding: 2.1rem 3rem 1.6rem;
      font: 400 21px/1.5 ui-sans-serif, -apple-system, "Segoe UI", sans-serif;
      opacity: 0; transition: opacity .45s ease; pointer-events: none;
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
      transition: left .35s ease, top .35s ease, transform .2s ease; opacity: 0;
    }
    #tour-cursor.on { opacity: 1; }
    html { scroll-behavior: smooth; }
  `});
  await page.evaluate(() => {
    const c = document.createElement('div'); c.id = 'tour-cap'; document.body.appendChild(c);
    const k = document.createElement('div'); k.id = 'tour-cursor'; document.body.appendChild(k);
  });

  const say = async (kicker, html, hold = 3400) => {
    await page.evaluate(([k, h]) => {
      const c = document.getElementById('tour-cap');
      c.classList.remove('on');
      setTimeout(() => {
        c.innerHTML = '<span class="kicker">' + k + '</span>' + h;
        c.classList.add('on');
      }, 260);
    }, [kicker, html]);
    await sleep(hold);
  };

  const cursorTo = async (sel, show = true) => {
    const box = await page.locator(sel).first().boundingBox();
    if (!box) return null;
    await page.evaluate(([x, y, on]) => {
      const k = document.getElementById('tour-cursor');
      k.style.left = x + 'px'; k.style.top = y + 'px';
      k.classList.toggle('on', on);
    }, [box.x + box.width / 2, box.y + box.height / 2, show]);
    return box;
  };
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

  // ======================= 1. what this is ===============================
  await say('Neural Networks by Hand and by PyTorch',
    'A companion book to a thirteen-lesson PyTorch curriculum — built so you finish able to ' +
    '<b>read the literature and extend it</b>, not just reproduce a tutorial.', 4600);

  await scrollTo('#preface ol');
  await say('How it works',
    'Every idea appears in four registers: <b>derived as mathematics</b>, <b>computed by hand</b>, ' +
    '<b>written as code</b>, then <b>mapped to the library call</b> it becomes in production.', 5200);

  // ======================= 2. the mathematics ============================
  await goto('#/ch00');
  await say('Chapter 00 · Mathematical Foundations',
    'Linear algebra, calculus, statistics and probability — the four areas the rest of the ' +
    'curriculum runs on. Every rule is <b>verified in code</b>, never asserted.', 4800);

  await goto('#/ch00/ch00-the-two-rules-that-do-all-the-work');
  await scrollTo('#ch00-the-two-rules-that-do-all-the-work', 'start');
  await say('Derivations, not folklore',
    'Xavier initialisation is <b>derived in three lines</b> from the variance of a sum. ' +
    'So is attention’s 1/√dₖ, and layer norm, and dropout’s 1/(1−p).', 5000);

  // ======================= 3. it is interactive ==========================
  await goto('#/ch00');
  await page.evaluate(() => {
    const w = document.querySelector('#ch00 [data-widget="entropy"]') ||
              document.querySelector('#ch00 .widget');
    if (w) w.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await sleep(1300);
  await say('Figures you can interrogate',
    'Seventeen interactive figures, each computing the <b>same arithmetic as the text beside it</b>. ' +
    'Nothing is drawn to look convincing.', 4200);

  const slider = page.locator('#ch00 .widget input[type=range]').first();
  if (await slider.count()) {
    const box = await slider.boundingBox();
    if (box) {
      await page.evaluate(([x, y]) => {
        const k = document.getElementById('tour-cursor');
        k.style.left = x + 'px'; k.style.top = y + 'px'; k.classList.add('on');
      }, [box.x + box.width * 0.2, box.y + box.height / 2]);
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
      await page.mouse.down();
      for (const f of [0.35, 0.5, 0.68, 0.85, 0.6, 0.4]) {
        await page.mouse.move(box.x + box.width * f, box.y + box.height / 2, { steps: 12 });
        await page.evaluate(([x, y]) => {
          const k = document.getElementById('tour-cursor');
          k.style.left = x + 'px'; k.style.top = y + 'px';
        }, [box.x + box.width * f, box.y + box.height / 2]);
        await sleep(320);
      }
      await page.mouse.up();
      await sleep(700);
    }
  }
  await hideCursor();

  // ======================= 4. by hand ====================================
  await goto('#/ch00/ch00-by-hand-exercises');
  await scrollTo('#ch00-by-hand-exercises', 'start');
  await say('Twenty-four pencil-and-paper exercises',
    'In chapter 00 alone. A gradient you have computed once with a pencil stops being a symbol ' +
    'and becomes <b>a number you know how to check</b>.', 4600);

  const det = page.locator('#ch00 details').first();
  if (await det.count()) {
    await det.scrollIntoViewIfNeeded();
    await sleep(500);
    await det.locator('summary').click();
    await sleep(1800);
    await say('Every one is fully worked',
      'Solutions fold open underneath. The numbers are chosen so <b>arithmetic never obscures ' +
      'the idea</b> being drilled.', 3800);
  }

  // ======================= 5. recognition ================================
  await goto('#/ch00/ch00-which-tool');
  await scrollTo('#ch00-which-tool', 'start');
  await say('The skill students actually lack',
    'Not computing a variance — <b>recognising that something is a variance question</b>. ' +
    'Four triggers, three guided diagnoses, and drills where the answer is the category.', 5400);

  // ======================= 6. the architectures ==========================
  await goto('#/ch06');
  await scrollTo('#ch06 .widget', 'center');
  await say('Chapters 01–11 · from XOR to a GPT',
    'Backpropagation by hand, CNNs, LSTMs, attention, transformers, translation, ' +
    'a decoder-only GPT, then <b>quantization and LoRA implemented from scratch</b>.', 5200);

  await goto('#/ch10');
  await sleep(600);
  await say('Every claim is measured',
    'The KV cache in chapter 10 comes out <b>slower</b> at notebook scale — so the book reports ' +
    'the wall clock honestly and adds an operation count explaining why.', 5000);

  // ======================= 7. the library bridge =========================
  await page.evaluate(() => {
    const b = document.querySelector('#ch10 .library') || document.querySelector('.library');
    if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await sleep(1300);
  await say('Then: what production writes instead',
    'Every hand-rolled component is mapped to its real API — <b>F.scaled_dot_product_attention</b>, ' +
    '<b>peft</b>, <b>transformers</b> — with what it adds <i>and what it hides</i>.', 5200);

  // ======================= 8. the frontier ===============================
  await goto('#/appendix/appendix-the-modern-stack-what-changed-after-2017');
  await scrollTo('#appendix-the-modern-stack-what-changed-after-2017', 'start');
  await say('The appendix aims past the curriculum',
    'RMSNorm, SwiGLU, RoPE, grouped-query and latent attention, mixture-of-experts, ' +
    'FlashAttention, speculative decoding, DPO and GRPO — <b>each with the one-line idea ' +
    'and the resource it buys back</b>.', 5600);

  await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('#appendix .box.concept')];
    const b = boxes[boxes.length - 1];
    if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await sleep(1200);
  await say('And makes the argument explicit',
    'Almost none of it is new mathematics. Two entries are the low-rank factorisation from ' +
    'chapter 11; two are LSTM gating from chapter 05. <b>The frontier is reachable from here.</b>', 5600);

  // ======================= 9. features ===================================
  await goto('#/ch07');
  const box = await page.locator('#toc-filter').boundingBox();
  if (box) {
    await page.evaluate(([x, y]) => {
      const k = document.getElementById('tour-cursor');
      k.style.left = x + 'px'; k.style.top = y + 'px'; k.classList.add('on');
    }, [box.x + box.width / 2, box.y + box.height / 2]);
  }
  await page.click('#toc-filter');
  await page.type('#toc-filter', 'vanishing gradient', { delay: 85 });
  await sleep(1600);
  await say('Full-text search across every chapter',
    'It is a single-page app: chapters are routes, cross-references jump instantly, and a ' +
    '<b>back button returns you to where you were reading</b>.', 4800);
  await hideCursor();

  const hit = page.locator('.search-hit').first();
  if (await hit.count()) { await hit.click(); await sleep(1800); }
  await page.fill('#toc-filter', '');
  await sleep(600);

  await page.click('#theme-toggle');
  await sleep(1400);
  await say('Reads offline, in either theme',
    'Mathematics renders from a <b>vendored KaTeX</b> — no network, no CDN, nothing external. ' +
    'The whole book is one file that works from a URL or straight off disk.', 4800);
  await page.click('#theme-toggle');
  await sleep(1000);

  // ======================= 10. outcomes ==================================
  await goto('#/ch12');
  await sleep(700);
  await say('What you should be able to do afterwards',
    'Derive a loss from a distribution · implement attention and check it against the library · ' +
    'diagnose why a network will not train · read a paper and reproduce its claim.', 6000);

  await say('And the standard it holds you to',
    'Matched-parameter comparisons, tuned baselines, error bars over seeds, and <b>stating what ' +
    'you cannot conclude</b>. Five capstones, including reproducing a published result.', 5600);

  await goto('#/preface');
  await sleep(600);
  await say('dcaponi.github.io/pytorch-nn-training',
    'Thirteen lessons · fifteen chapters · 45 by-hand exercises · 17 interactive figures. ' +
    'Everything runs on a MacBook Air with 24 GB.', 5200);

  await page.evaluate(() => document.getElementById('tour-cap').classList.remove('on'));
  await sleep(1200);

  await ctx.close();
  await browser.close();
  console.log('done');
})();
