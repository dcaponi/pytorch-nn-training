# Book tests

`spa.test.js` loads the built `book/index.html` in jsdom and exercises the router,
search, chapter navigation, cross-reference handling, mode switching, and widget
mounting. It exists because the book is a client-side app and nothing else in this
repository would catch a routing regression.

```bash
cd book/test
npm install          # jsdom, the only dependency
npm test
```

The CI workflow runs this before deploying, so a broken router fails the build rather
than shipping.

## What it does not cover

jsdom stubs `<canvas>` and does not meaningfully run KaTeX, so the *visual* output of
the widgets, the maths rendering, and all CSS layout are outside its reach. Those still
need a human with a browser.
