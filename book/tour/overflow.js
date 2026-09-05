const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto(process.env.BOOK_URL || 'https://dcaponi.github.io/pytorch-nn-training/',
               { waitUntil: 'load' });
  await p.waitForTimeout(3000);

  const chapters = await p.evaluate(() =>
    [...document.querySelectorAll('#content > .chapter')].map(c => c.id));

  const findings = [];
  for (const id of chapters) {
    await p.evaluate(i => { window.location.hash = '#/' + i; }, id);
    await p.waitForTimeout(450);
    const r = await p.evaluate(id => {
      const out = { katex: [], pre: [], table: [], body: 0 };
      const sec = document.getElementById(id);
      if (!sec) return out;
      for (const el of sec.querySelectorAll('.katex-display')) {
        if (el.scrollWidth > el.clientWidth + 2)
          out.katex.push({ over: el.scrollWidth - el.clientWidth,
                           text: el.textContent.slice(0, 55) });
      }
      for (const el of sec.querySelectorAll('pre'))
        if (el.scrollWidth > el.clientWidth + 2) out.pre.push(el.scrollWidth - el.clientWidth);
      for (const el of sec.querySelectorAll('table'))
        if (el.scrollWidth > el.parentElement.clientWidth + 2)
          out.table.push(el.scrollWidth - el.parentElement.clientWidth);
      out.body = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return out;
    }, id);
    if (r.katex.length || r.pre.length || r.table.length || r.body > 0)
      findings.push({ id, ...r });
  }

  console.log('chapters with overflow:');
  for (const f of findings) {
    console.log(`  ${f.id}: katex=${f.katex.length} pre=${f.pre.length} ` +
                `table=${f.table.length} page-h-scroll=${f.body}px`);
    f.katex.slice(0, 3).forEach(k =>
      console.log(`      +${k.over}px  ${k.text.replace(/\s+/g, ' ')}`));
  }
  if (!findings.length) console.log('  none');
  await b.close();
})();
