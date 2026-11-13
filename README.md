# Pratekk Arvinnd Dekaate: portfolio

A static personal site (HTML, CSS and vanilla JS) with no build step. It is served from `site/`.

## Structure

```
site/
  index.html              page, SEO meta, Open Graph, JSON-LD Person
  css/style.css           light theme tokens, layout, responsive and touch rules
  js/world.js             fixed WebGL particle field (Three.js r128) that morphs between finance shapes
  js/main.js              smooth scroll (desktop only), entrances, scroll-linked world, hero, nav, copy email, back-to-top
  js/lab.js               Finance Lab: six interactive canvas models (illustrative figures)
  js/ai-demo.js           invoice-check demo (rules plus anomaly score, made-up data)
  fonts/                  self-hosted Latin variable woff2: Inter, Fraunces, JetBrains Mono
  assets/                 photo (4:5, about 100 KB), og-image.jpg (1200x630), CV PDF, favicon
CONTENT.md                approved copy and the source of each claim (CV and LinkedIn export)
```

The libraries are loaded from cdnjs and jsDelivr, pinned to exact versions with SRI hashes:
Three.js r128, GSAP 3.12.5 with ScrollTrigger, and Lenis 1.1.13.

## Preview locally

The fonts don't load over `file://`, so serve the folder over HTTP:

```
python -m http.server 8000 -d site
```

Then open http://localhost:8000.

## Rules this site follows

- No scroll-jacking. Entrances play once on a timer when they come into view. Only the background particle field is linked to scroll.
- Desktop: Lenis smooth wheel scrolling and short chapter pins (about 135vh).
- Touch devices: native scrolling, no pins, fade-only entrances, no backdrop-filter, about 3,000 particles, and the canvas is never resized when only the height changes.
- Zero layout shift: rotating text is stacked in a single grid cell, the fonts use metric-matched fallbacks, and space is reserved for status text.
- `prefers-reduced-motion` is respected.

## Updating content

Edit the text in `site/index.html`. Keep `CONTENT.md` in sync, and only use facts from the CV or LinkedIn.
To change the CV, replace `site/assets/Pratekk-Arvinnd-Dekaate-CV.pdf` and keep the same file name.

## Deploy

Live site: https://akashyanpure.github.io/pratekk_portfolio/ (repo `akashyanpure/pratekk_portfolio`).

GitHub Actions deploys to GitHub Pages on every push to `main`, and it can also be run manually through workflow_dispatch.
The workflow is `.github/workflows/deploy.yml`. It runs these steps:

1. Checkout.
2. Sanity check: all required files exist, and `node --check` passes on every JS file.
3. configure-pages.
4. upload-pages-artifact, using `site/` as the path.
5. deploy-pages.

One-time setup: in the repo, go to **Settings → Pages → Source** and choose **GitHub Actions**.

When you add a custom domain, enter it on the same Settings → Pages screen. A `CNAME` file isn't used for Actions deploys.
After that, update the `canonical`, `og:url` and `og:image` URLs and the JSON-LD `url` and `image` in `site/index.html`.

Private source files (the Word CV, the LinkedIn export, the original photo and CONTENT.md) are kept out of the repo by `.gitignore`.
