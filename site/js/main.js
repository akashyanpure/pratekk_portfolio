/* Main: environment, smooth scroll (desktop only), entrances (timed, not scrubbed),
   scroll-linked background world, hero rotator & orbit, nav, copy email, back-to-top. */
(function () {
  'use strict';

  var root = document.documentElement;
  var mqTouch = window.matchMedia('(hover: none) and (pointer: coarse)');
  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqWide = window.matchMedia('(min-width: 861px)');
  var touch = mqTouch.matches;
  var reduced = mqReduced.matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  if (reduced) root.classList.add('reduced');
  if (!hasGsap) root.classList.remove('js'); // show everything if CDN failed

  document.getElementById('year').textContent = String(new Date().getFullYear());

  /* ---------- Background world ---------- */
  var worldOK = false;
  try { worldOK = window.World && window.World.init({ touch: touch, reduced: reduced }); } catch (e) { worldOK = false; }

  /* ---------- Smooth scroll (desktop wheel only) ---------- */
  var lenis = null;
  if (hasGsap && !touch && !reduced && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1 });
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    window.gsap.ticker.lagSmoothing(0);
  }

  function scrollToEl(el) {
    if (!el) return;
    if (lenis) { lenis.scrollTo(el, { offset: el.id === 'top' ? 0 : -8, duration: 1.2 }); return; }
    var y = el.id === 'top' ? 0 : el.getBoundingClientRect().top + window.pageYOffset - 8;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
    if (id !== 'top' && history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* ---------- Hero rotator (stacked in one grid cell: zero layout shift) ---------- */
  (function () {
    var rot = document.getElementById('rotator');
    if (!rot || reduced) return;
    var items = rot.children, i = 0;
    setInterval(function () {
      if (document.hidden) return;
      var cur = items[i];
      cur.classList.remove('is-active'); cur.classList.add('is-leaving');
      setTimeout(function () { cur.classList.remove('is-leaving'); }, 520);
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    }, 2600);
  })();

  /* ---------- Orbit: one ring with cycling chips on phones ---------- */
  (function () {
    var orbit = document.getElementById('orbit');
    if (!orbit) return;
    var names = [];
    orbit.querySelectorAll('.chip').forEach(function (c) { names.push(c.textContent); });
    var timer = null;
    function apply() {
      var small = window.innerWidth <= 600;
      orbit.classList.toggle('orbit--mobile', small);
      if (timer) { clearInterval(timer); timer = null; }
      var inner = orbit.querySelectorAll('.orbit__ring--inner .chip');
      if (!small) {
        var k = 0;
        orbit.querySelectorAll('.chip').forEach(function (c) { c.textContent = names[k++]; c.classList.remove('is-swapping'); });
        return;
      }
      // Phones: one ring; its chips cycle through every name.
      var next = inner.length, slot = 0;
      inner.forEach(function (c, j) { c.textContent = names[(j * 2) % names.length]; });
      if (reduced) return;
      timer = setInterval(function () {
        if (document.hidden) return;
        var c = inner[slot];
        c.classList.add('is-swapping');
        setTimeout(function () { c.textContent = names[next % names.length]; next++; c.classList.remove('is-swapping'); }, 460);
        slot = (slot + 1) % inner.length;
      }, 1400);
    }
    apply();
    var lastW = window.innerWidth;
    window.addEventListener('resize', function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; apply(); } }, { passive: true });
  })();

  /* ---------- Nav state + back-to-top progress ring ---------- */
  var nav = document.getElementById('nav');
  var toTop = document.getElementById('toTop');
  var ring = toTop.querySelector('.totop__ring');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.pageYOffset;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    nav.classList.toggle('is-scrolled', y > 20);
    toTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
    ring.style.strokeDashoffset = String(100 - Math.min(100, (y / max) * 100));
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', function () { scrollToEl(document.getElementById('top')); });

  /* ---------- Copy email ---------- */
  (function () {
    var btn = document.getElementById('copyEmail');
    if (!btn) return;
    var label = btn.querySelector('.copy__label');
    btn.addEventListener('click', function () {
      var email = btn.getAttribute('data-email');
      function done(ok) { label.textContent = ok ? 'Copied' : 'Press Ctrl+C'; setTimeout(function () { label.textContent = 'Copy email'; }, 1800); }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(email).then(function () { done(true); }, function () { done(false); });
      else {
        var ta = document.createElement('textarea'); ta.value = email; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done(ok);
      }
    });
  })();

  if (!hasGsap) {
    if (worldOK) window.World.setOpacity(0.5);
    return;
  }

  /* ---------- GSAP ---------- */
  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  if (touch) ST.config({ ignoreMobileResize: true });

  // Entrances: play on a timer once in view (never scrubbed).
  var fromY = touch ? 0 : 26;
  function reveal(els, opts) {
    opts = opts || {};
    els.forEach(function (el) {
      if (reduced) { gsap.set(el, { opacity: 1 }); return; }
      var tilt = !touch && el.hasAttribute('data-tilt');
      var from = { opacity: 0, y: fromY };
      if (tilt) { from.rotationX = 12; from.transformPerspective = 900; from.transformOrigin = '50% 100%'; }
      gsap.fromTo(el, from, {
        opacity: 1, y: 0, rotationX: 0, duration: touch ? 0.7 : 0.9, ease: 'power3.out', delay: opts.delay || 0,
        clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      });
    });
  }
  reveal(gsap.utils.toArray('[data-reveal]'));

  // Hero: timed stagger on load.
  if (reduced) gsap.set('[data-hero]', { opacity: 1 });
  else gsap.fromTo('[data-hero]', { opacity: 0, y: fromY }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.1, clearProps: 'transform' });

  // Desktop-only gentle photo parallax (no parallax on touch).
  if (!touch && !reduced) {
    gsap.to('.portrait', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Story chapters: short pins on desktop only; text entrances on a timer.
  var chapters = gsap.utils.toArray('.chapter');
  var pin = !touch && mqWide.matches;
  chapters.forEach(function (ch) {
    var parts = ch.querySelectorAll('[data-ch]');
    if (reduced) gsap.set(parts, { opacity: 1 });
    else {
      gsap.fromTo(parts, { opacity: 0, y: fromY }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09,
        scrollTrigger: { trigger: ch, start: 'top 62%', toggleActions: 'play none none reverse' }
      });
    }
    if (pin) ST.create({ trigger: ch, start: 'top top', end: '+=35%', pin: true, pinSpacing: true, anticipatePin: 1 });
  });

  /* ---------- Scroll-linked world: shape index follows scroll position ---------- */
  if (worldOK) {
    var W = window.World;
    var morph = [], outro = null;
    chapters.forEach(function (ch) {
      morph.push(ST.create({ trigger: ch, start: 'top 85%', end: 'top 15%', onUpdate: update, onRefresh: update }));
    });
    outro = ST.create({ trigger: '#experience', start: 'top 85%', end: 'top 25%', onUpdate: update, onRefresh: update });
    var heroFade = ST.create({ trigger: '#work', start: 'top bottom', end: 'top 35%', onUpdate: update, onRefresh: update });
    var narrow = !mqWide.matches;
    function update() {
      if (!outro || !heroFade || morph.length !== chapters.length) return;
      var v = 0;
      for (var i = 0; i < morph.length; i++) {
        var p = morph[i].progress;
        if (p > 0) v = i + p;
      }
      if (outro.progress > 0) v = morph.length + outro.progress;
      W.setTarget(v);
      // opacity: hero wave soft and fading out under the about text; full in the story; faint behind long-form sections
      var o = (narrow ? 0.5 : 0.8) * (1 - heroFade.progress);
      o = Math.max(o, Math.min(1, v * 2) * 0.9);
      if (v > morph.length) o = 0.9 - 0.7 * outro.progress;
      W.setOpacity(o);
    }
    update();
  }

  // Refresh once fonts are in (metric-matched fallbacks keep this a no-op for layout).
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
