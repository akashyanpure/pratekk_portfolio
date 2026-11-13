/* Fixed WebGL particle field that morphs between finance shapes.
   Shapes: 0 ledger wave · 1 monthly bars · 2 house · 3 three-way reconciliation
           4 arrears curve · 5 invoice grid with flagged items · 6 calm drift
   Light theme: NORMAL blending, darker saturated particles (additive vanishes on ivory). */
(function () {
  'use strict';

  var World = { ready: false, setTarget: function () {}, setOpacity: function () {}, setScrollY: function () {} };
  window.World = World;

  function rand(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  World.init = function (opts) {
    if (!window.THREE) return false;
    var THREE = window.THREE;
    var canvas = document.getElementById('world');
    if (!canvas) return false;
    var touch = !!opts.touch, reduced = !!opts.reduced;
    var N = touch ? 3000 : 9000;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
    } catch (e) { return false; }
    renderer.setClearColor(0x000000, 0);
    var dpr = Math.min(window.devicePixelRatio || 1, touch ? 2 : 1.75);
    renderer.setPixelRatio(dpr);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    // ---- Palette (navy / emerald / gold / red flag) ----
    var C = {
      navy: [0.06, 0.12, 0.24], navy2: [0.17, 0.25, 0.40], emerald: [0.05, 0.49, 0.40],
      emerald2: [0.10, 0.60, 0.50], gold: [0.66, 0.52, 0.23], red: [0.70, 0.26, 0.18], slate: [0.36, 0.42, 0.52]
    };

    // ---- Shape generators (unit-ish space, about 6 x 4.5) ----
    var shapes = [], colors = [];
    function make(fn, seed) {
      var p = new Float32Array(N * 3), c = new Float32Array(N * 3), r = rand(seed);
      for (var i = 0; i < N; i++) {
        var o = fn(i, r);
        p[i * 3] = o[0]; p[i * 3 + 1] = o[1]; p[i * 3 + 2] = o[2];
        var col = o[3];
        c[i * 3] = col[0]; c[i * 3 + 1] = col[1]; c[i * 3 + 2] = col[2];
      }
      shapes.push(p); colors.push(c);
    }
    function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

    // 0 · ledger wave (a wide field of dots, like ruled ledger lines)
    make(function (i, r) {
      var cols = touch ? 60 : 150, rows = Math.ceil(N / cols);
      var cx = i % cols, cz = Math.floor(i / cols);
      var x = (cx / (cols - 1) - 0.5) * 13, z = (cz / (rows - 1) - 0.5) * 2.6;
      var y = Math.sin(x * 0.55) * 0.3 + Math.cos(z * 1.8 + x * 0.25) * 0.18;
      var t = cz / rows;
      return [x, y, z, mix(C.navy2, C.emerald, (Math.sin(x * 0.4) + 1) * 0.35 + t * 0.2)];
    }, 1);

    // 1 · monthly bar chart (12 bars, rising) with baseline
    var bars = [0.9, 1.1, 1.0, 1.3, 1.25, 1.5, 1.45, 1.7, 1.8, 1.75, 2.05, 2.3];
    make(function (i, r) {
      if (i < N * 0.08) { var bx = (r() - 0.5) * 6.4; return [bx, -2.0 + (r() - 0.5) * 0.03, (r() - 0.5) * 0.3, C.slate]; }
      var b = Math.floor(r() * 12), w = 0.34;
      var x = -2.9 + b * 0.53 + (r() - 0.5) * w, h = bars[b] * 1.75;
      var y = -2.0 + r() * h, z = (r() - 0.5) * 0.45;
      var top = (y + 2.0) / h > 0.94;
      return [x, y, z, top ? C.gold : mix(C.navy, C.emerald, b / 11)];
    }, 2);

    // 2 · house outline + windows + door + lease document lines
    function seg(r, ax, ay, bx, by) { var t = r(); return [ax + (bx - ax) * t, ay + (by - ay) * t]; }
    make(function (i, r) {
      var k = r(), p, col = C.navy;
      if (k < 0.42) { // walls
        var side = Math.floor(r() * 3);
        p = side === 0 ? seg(r, -2, -2, -2, 0.6) : side === 1 ? seg(r, 2, -2, 2, 0.6) : seg(r, -2, -2, 2, -2);
      } else if (k < 0.66) { // roof
        p = r() < 0.5 ? seg(r, -2.5, 0.5, 0, 2.6) : seg(r, 2.5, 0.5, 0, 2.6); col = C.emerald;
      } else if (k < 0.76) { // door
        var d = Math.floor(r() * 3);
        p = d === 0 ? seg(r, -0.45, -2, -0.45, -0.6) : d === 1 ? seg(r, 0.45, -2, 0.45, -0.6) : seg(r, -0.45, -0.6, 0.45, -0.6); col = C.gold;
      } else if (k < 0.92) { // windows
        var wx = r() < 0.5 ? -1.25 : 1.25, e = Math.floor(r() * 4);
        p = e === 0 ? seg(r, wx - 0.45, 0.25, wx + 0.45, 0.25) : e === 1 ? seg(r, wx - 0.45, -0.55, wx + 0.45, -0.55) : e === 2 ? seg(r, wx - 0.45, -0.55, wx - 0.45, 0.25) : seg(r, wx + 0.45, -0.55, wx + 0.45, 0.25);
        col = C.emerald2;
      } else { // soft fill
        p = [(r() - 0.5) * 3.8, -2 + r() * 2.5]; col = C.slate;
      }
      return [p[0] + (r() - 0.5) * 0.05, p[1] + (r() - 0.5) * 0.05, (r() - 0.5) * 0.35, col];
    }, 3);

    // 3 · three-way reconciliation (three overlapping rings, dense centre)
    var rings = [[-0.85, 0.55, C.navy], [0.85, 0.55, C.emerald], [0, -0.9, C.gold]];
    make(function (i, r) {
      if (r() < 0.14) { var a0 = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.55; return [Math.cos(a0) * rr, Math.sin(a0) * rr - 0.05, (r() - 0.5) * 0.3, C.emerald]; }
      var g = rings[Math.floor(r() * 3)], a = r() * Math.PI * 2, R = 1.55 + (r() - 0.5) * 0.12;
      return [g[0] + Math.cos(a) * R, g[1] + Math.sin(a) * R, (r() - 0.5) * 0.35, g[2]];
    }, 4);

    // 4 · arrears balance falling to zero (curve + area + weekly payment steps)
    make(function (i, r) {
      var x = (r() - 0.5) * 6, t = (x + 3) / 6;
      var yc = -1.9 + 3.6 * Math.max(0, 1 - t * 1.08) * Math.max(0, 1 - t * 1.08);
      var k = r();
      if (k < 0.45) return [x, yc + (r() - 0.5) * 0.06, (r() - 0.5) * 0.3, mix(C.red, C.emerald, t)];
      if (k < 0.55) return [x, -2.0 + (r() - 0.5) * 0.03, (r() - 0.5) * 0.2, C.slate];
      var y = -2.0 + r() * (yc + 2.0);
      return [x, y, (r() - 0.5) * 0.5, mix(C.navy2, C.emerald, t * 0.8)];
    }, 5);

    // 5 · invoice grid (6 x 4 cards), three flagged cards pulled forward
    var flagged = { 3: C.red, 10: C.gold, 17: C.red };
    make(function (i, r) {
      var card = Math.floor(r() * 24), cx = card % 6, cy = Math.floor(card / 6);
      var x0 = -2.95 + cx * 1.0, y0 = 1.65 - cy * 1.15, w = 0.78, h = 0.92;
      var f = flagged[card], k = r(), px, py;
      if (k < 0.6) { var e = Math.floor(r() * 4), t = r(); px = e < 2 ? x0 + t * w : (e === 2 ? x0 : x0 + w); py = e < 2 ? (e === 0 ? y0 : y0 - h) : y0 - t * h; }
      else { var line = Math.floor(r() * 4); px = x0 + 0.12 + r() * (w - 0.24) * (line === 0 ? 0.6 : 1); py = y0 - 0.2 - line * 0.18; }
      return [px + (f ? 0.06 : 0), py + (f ? 0.08 : 0), f ? 0.25 + (r() - 0.5) * 0.06 : (r() - 0.5) * 0.12, f || (k < 0.6 ? C.navy : C.slate)];
    }, 6);

    // 6 · calm drift (wide, sparse sphere shell)
    make(function (i, r) {
      var u = r() * 2 - 1, a = r() * Math.PI * 2, R = 5.5 + r() * 2.5, s = Math.sqrt(1 - u * u);
      return [Math.cos(a) * s * R * 1.5, u * R * 0.8, Math.sin(a) * s * R * 0.2 - 1.5, mix(C.slate, C.emerald, r() * 0.5)];
    }, 7);

    // ---- Geometry & material ----
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(shapes[0]);
    var col = new Float32Array(colors[0]);
    var seeds = new Float32Array(N), sizes = new Float32Array(N), delay = new Float32Array(N);
    var rr = rand(99);
    for (var i = 0; i < N; i++) { seeds[i] = rr() * 6.283; sizes[i] = 0.6 + rr() * 0.8; delay[i] = rr(); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
    geo.attributes.color.setUsage(THREE.DynamicDrawUsage);

    var uniforms = {
      uTime: { value: 0 }, uSize: { value: 1 }, uOpacity: { value: 0.9 }, uWobble: { value: reduced ? 0 : 1 }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending, vertexColors: true,
      vertexShader: [
        'attribute float aSeed; attribute float aSize;',
        'uniform float uTime; uniform float uSize; uniform float uWobble;',
        'varying vec3 vColor; varying float vFade;',
        'void main(){',
        '  vec3 p = position;',
        '  p.x += sin(uTime*0.55 + aSeed + p.y*1.3) * 0.035 * uWobble;',
        '  p.y += cos(uTime*0.45 + aSeed*1.7 + p.x*1.1) * 0.035 * uWobble;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = uSize * aSize * (12.0 / -mv.z);',
        '  vColor = color; vFade = clamp(1.4 - (-mv.z - 8.0) * 0.08, 0.35, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uOpacity; varying vec3 vColor; varying float vFade;',
        'void main(){',
        '  float d = length(gl_PointCoord - 0.5);',
        '  if (d > 0.5) discard;',
        '  float a = smoothstep(0.5, 0.32, d) * uOpacity * vFade;',
        '  gl_FragColor = vec4(vColor, a);',
        '}'
      ].join('\n')
    });
    var points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    var group = new THREE.Group();
    group.add(points);
    scene.add(group);

    // ---- Layout: where the shape sits (right half on desktop, top on phones) ----
    var W = 0, H = 0, layoutWide = true;
    function visibleAt(z) { var h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z); return { h: h, w: h * camera.aspect }; }
    function layout() {
      var v = visibleAt(0);
      layoutWide = W > 860;
      var s = layoutWide ? Math.min(v.h / 6.6, v.w / 2 / 6.4) : Math.min(v.w / 7.0, v.h / 2 / 5.2);
      group.userData.base = layoutWide ? { x: v.w * 0.22, y: -0.1, s: s } : { x: 0, y: v.h * 0.2, s: s };
      // hero: the ledger wave lies along the bottom edge, full width, below the text
      group.userData.hero = { x: 0, y: -v.h * 0.5 + v.h * (layoutWide ? 0.1 : 0.07), s: v.w / 12.5 };
      // dot size: proportional to CSS pixels per world unit, so it scales with the screen
      var pxPerUnit = H / v.h;
      uniforms.uSize.value = Math.max(2.2, Math.min(5.5, pxPerUnit * (touch ? 0.05 : 0.045))) * dpr;
    }
    function resize(force) {
      var w = window.innerWidth;
      // Never resize on address-bar (height-only) changes; canvas CSS is 100lvh.
      if (!force && w === W) return;
      W = w; H = Math.max(canvas.clientHeight || window.innerHeight, window.innerHeight);
      renderer.setSize(W, H, false);
      camera.aspect = W / H; camera.updateProjectionMatrix();
      layout();
    }
    resize(true);
    window.addEventListener('resize', function () { resize(false); }, { passive: true });

    // ---- Morph state ----
    var target = 0, current = 0, opacityTarget = 0.9, opacity = 0.9, scrollY = 0;
    var mouseX = 0, mouseY = 0, mx = 0, my = 0;
    if (!touch) window.addEventListener('pointermove', function (e) { mouseX = e.clientX / window.innerWidth - 0.5; mouseY = e.clientY / window.innerHeight - 0.5; }, { passive: true });

    World.setTarget = function (v) { target = Math.max(0, Math.min(shapes.length - 1, v)); };
    World.setOpacity = function (v) { opacityTarget = v; };
    World.setScrollY = function (v) { scrollY = v; };

    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    var lastWritten = -1;
    function writeMorph(v) {
      var a = Math.floor(v), b = Math.min(a + 1, shapes.length - 1), f = v - a;
      var A = shapes[a], B = shapes[b], CA = colors[a], CB = colors[b];
      for (var i = 0; i < N; i++) {
        var d = delay[i] * 0.35, t = Math.max(0, Math.min(1, (f - d) / 0.65)); t = ease(t);
        var j = i * 3;
        pos[j] = A[j] + (B[j] - A[j]) * t; pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * t; pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * t;
        col[j] = CA[j] + (CB[j] - CA[j]) * t; col[j + 1] = CA[j + 1] + (CB[j + 1] - CA[j + 1]) * t; col[j + 2] = CA[j + 2] + (CB[j + 2] - CA[j + 2]) * t;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      lastWritten = v;
    }
    writeMorph(0);

    // ---- Loop ----
    var running = true, lost = false, t0 = performance.now(), last = t0;
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      current += (target - current) * (reduced ? 1 : Math.min(1, dt * 4.5));
      if (Math.abs(target - current) < 0.0005) current = target;
      if (Math.abs(current - lastWritten) > 0.0004) writeMorph(current);
      opacity += (opacityTarget - opacity) * Math.min(1, dt * 4);
      uniforms.uOpacity.value = opacity;
      uniforms.uTime.value = reduced ? 0 : (now - t0) / 1000;
      var base = group.userData.base;
      mx += (mouseX - mx) * Math.min(1, dt * 3); my += (mouseY - my) * Math.min(1, dt * 3);
      var hero = group.userData.hero, k = Math.max(0, Math.min(1, 1 - current)); k = k * k * (3 - 2 * k);
      group.position.set(base.x + (hero.x - base.x) * k, base.y + (hero.y - base.y) * k, 0);
      group.scale.setScalar(base.s + (hero.s - base.s) * k);
      var spin = reduced ? 0 : Math.sin((now - t0) / 9000) * 0.12;
      group.rotation.set(-0.1 + my * 0.15 + k * 0.45, (spin + mx * 0.3) * (1 - k), 0);
      renderer.render(scene, camera);
    }

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; lost = true; canvas.classList.remove('is-ready'); }, false);
    canvas.addEventListener('webglcontextrestored', function () {
      lost = false; geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      resize(true); running = true; last = performance.now(); requestAnimationFrame(frame); canvas.classList.add('is-ready');
    }, false);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!lost && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    });

    requestAnimationFrame(frame);
    requestAnimationFrame(function () { canvas.classList.add('is-ready'); });
    World.ready = true;
    World.count = N;
    return true;
  };
})();
