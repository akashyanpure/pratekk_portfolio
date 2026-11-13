/* Finance Lab: six interactive canvas models. All figures are illustrative. */
(function () {
  'use strict';

  var canvas = document.getElementById('labCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var titleEl = document.getElementById('labTitle');
  var descEl = document.getElementById('labDesc');
  var usedEl = document.getElementById('labUsed');
  var ctrlEl = document.getElementById('labControls');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.lab__tab'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var K = {
    ink: '#0F1F3D', ink2: '#2E3E5C', muted: '#56637A', line: 'rgba(15,31,61,.12)', line2: 'rgba(15,31,61,.22)',
    emerald: '#0E7C66', emeraldSoft: '#E1F0EB', gold: '#A9853A', goldSoft: '#F3EAD3', red: '#B2432F', redSoft: '#F7E3DE',
    bg: '#FAF8F3', white: '#FFFFFF', navy2: '#2B4066'
  };
  var MONO = '"JetBrains Mono", "JetBrains Mono Fallback", "Courier New", monospace';
  var SANS = 'Inter, "Inter Fallback", Arial, sans-serif';

  var W = 0, H = 0, DPR = 1;
  function size() {
    var r = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ---------- helpers ----------
  function gbp(n, dp) { var s = Math.abs(n).toFixed(dp == null ? 0 : dp).replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (n < 0 ? '−£' : '£') + s; }
  function font(px, w, fam) { return (w || 400) + ' ' + px + 'px ' + (fam || SANS); }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function text(s, x, y, px, col, align, w, fam) { ctx.font = font(px, w, fam); ctx.fillStyle = col; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function easeOut(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }
  function small() { return W < 520; }
  function slider(id, label, min, max, step, val, fmt, onInput) {
    var wrap = document.createElement('label'); wrap.className = 'ctl';
    wrap.innerHTML = '<span class="ctl__row"><span>' + label + '</span><span class="ctl__val"></span></span><input type="range">';
    var inp = wrap.querySelector('input'), out = wrap.querySelector('.ctl__val');
    inp.id = id; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
    out.textContent = fmt(+val);
    inp.addEventListener('input', function () { out.textContent = fmt(+inp.value); onInput(+inp.value); });
    ctrlEl.appendChild(wrap); return inp;
  }
  function button(label, cls, onClick) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn--small ' + (cls || 'btn--ghost'); b.textContent = label;
    b.addEventListener('click', onClick); ctrlEl.appendChild(b); return b;
  }
  function note(txt) { var s = document.createElement('span'); s.className = 'ctl-note'; s.textContent = txt; ctrlEl.appendChild(s); return s; }

  // ======================================================================
  // 1. Three-way reconciliation
  // ======================================================================
  var recon = {
    title: 'Three-way reconciliation',
    desc: 'The same payments are recorded in three places: the housing system (NEC), the finance ledger (Business World) and the accommodation tracker. Each item is matched across all three. Anything missing or with a different amount is flagged for investigation and corrected.',
    used: 'Monthly and quarterly reconciliations between NEC, Business World and the accommodation tracker at Kingston.',
    setup: function () {
      var self = this;
      this.gen(); this.t0 = performance.now();
      button('New month', 'btn--primary', function () { self.gen(); self.t0 = performance.now(); });
      this.status = note('');
    },
    gen: function () {
      var refs = [], n = 7;
      for (var i = 0; i < n; i++) refs.push({ ref: 'PSL-' + (1000 + Math.floor(Math.random() * 8999)), amt: Math.round(650 + Math.random() * 1100) });
      var rows = refs.map(function (r) { return { ref: r.ref, a: [r.amt, r.amt, r.amt] }; });
      var i1 = 1 + Math.floor(Math.random() * 3), i2 = 4 + Math.floor(Math.random() * 3);
      rows[i1].a[1] = null; // missing in Business World
      var amt = rows[i2].a[2], s = String(amt);
      var swapped = s.length > 2 ? +(s.slice(0, -2) + s[s.length - 1] + s[s.length - 2]) : amt + 45;
      rows[i2].a[2] = swapped === amt ? amt + 45 : swapped; // transposition error in tracker
      this.rows = rows;
    },
    draw: function (now) {
      var t = (now - this.t0) / 1000, rows = this.rows, n = rows.length;
      var sm = small(), top = sm ? 40 : 52, rowH = (H - top - (sm ? 44 : 52)) / n;
      var colX = [W * 0.17, W * 0.5, W * 0.83], cw = Math.min(W * 0.27, 190), names = ['NEC', 'Business World', 'Tracker'];
      for (var c = 0; c < 3; c++) text(names[c], colX[c], top - (sm ? 20 : 26), sm ? 11 : 13, K.ink, 'center', 600);
      var matched = 0, issues = 0;
      for (var i = 0; i < n; i++) {
        var row = rows[i], y = top + rowH * i + rowH / 2, appear = clamp(t * 3 - i * 0.25, 0, 1);
        var linkT = clamp((t - 1.2 - i * 0.35) / 0.5, 0, 1);
        var bad = row.a[1] == null || row.a[0] !== row.a[2];
        // links
        if (linkT > 0) {
          ctx.strokeStyle = bad ? K.red : K.emerald; ctx.lineWidth = 1.5; ctx.setLineDash(bad ? [4, 4] : []);
          ctx.beginPath(); var x0 = colX[0] + cw / 2, x1 = colX[2] - cw / 2;
          ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * easeOut(linkT), y); ctx.stroke(); ctx.setLineDash([]);
        }
        for (var c2 = 0; c2 < 3; c2++) {
          var v = row.a[c2], x = colX[c2] - cw / 2, h = Math.min(rowH - 8, 34);
          ctx.globalAlpha = appear;
          var cellBad = linkT >= 1 && (v == null || (c2 === 2 && v !== row.a[0]) || (c2 === 1 && v == null));
          rr(x, y - h / 2, cw, h, 7);
          ctx.fillStyle = v == null ? K.bg : (cellBad ? K.redSoft : (linkT >= 1 ? K.emeraldSoft : K.white)); ctx.fill();
          ctx.strokeStyle = v == null ? K.line2 : (cellBad ? K.red : K.line); ctx.lineWidth = 1; if (v == null) ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
          if (v == null) text('not found', x + cw / 2, y, sm ? 9.5 : 11, K.red, 'center', 500, MONO);
          else if (sm) text(gbp(v), x + cw / 2, y, 10.5, K.ink, 'center', 500, MONO);
          else { text(row.ref, x + 10, y, 11, K.muted, 'left', 400, MONO); text(gbp(v), x + cw - 10, y, 12, K.ink, 'right', 500, MONO); }
          ctx.globalAlpha = 1;
        }
        if (linkT >= 1) { if (bad) issues++; else matched++; }
      }
      var doneAll = t > 1.2 + n * 0.35 + 0.5;
      var msg = doneAll ? matched + ' matched · ' + issues + ' to investigate' : 'Matching…';
      text(msg, W / 2, H - (sm ? 20 : 24), sm ? 11.5 : 13, doneAll ? K.ink : K.muted, 'center', 600, MONO);
      if (this.status) this.status.textContent = doneAll ? '1 missing in Business World · 1 amount keyed differently in the tracker' : '';
      return true;
    }
  };

  // ======================================================================
  // 2. Double entry
  // ======================================================================
  var ledger = {
    title: 'Double entry and the purchase ledger',
    desc: 'Every transaction has two sides. A supplier invoice is a cost (debit) and money owed to the supplier (credit). Paying it clears the amount owed (debit) and reduces cash (credit). Total debits always equal total credits.',
    used: 'GL and cost-centre coding of accommodation payments and keeping the purchase ledger accurate at Kingston. Purchase-ledger work at Sanctuary.',
    setup: function () {
      var self = this;
      this.acc = [{ name: 'Accommodation costs', dr: [], cr: [] }, { name: 'Supplier payables', dr: [], cr: [] }, { name: 'Bank', dr: [], cr: [] }];
      this.queue = []; this.anim = null; this.auto = true; this.pending = [];
      this.bal = 0; this.nextAuto = performance.now() + 600;
      button('Post invoice', 'btn--primary', function () { self.auto = false; self.post(); });
      button('Pay supplier', 'btn--ghost', function () { self.auto = false; self.pay(); });
      this.status = note('');
    },
    post: function () {
      var amt = 600 + Math.round(Math.random() * 18) * 100;
      this.pending.push(amt);
      this.queue.push({ dr: 0, cr: 1, amt: amt, label: 'Invoice posted' });
    },
    pay: function () {
      if (!this.pending.length) { this.status.textContent = 'Nothing owed: post an invoice first.'; return; }
      var amt = this.pending.shift();
      this.queue.push({ dr: 1, cr: 2, amt: amt, label: 'Supplier paid' });
    },
    draw: function (now) {
      var self = this, sm = small();
      if (this.auto && now > this.nextAuto && !this.anim && !this.queue.length) {
        if (this.pending.length && Math.random() < 0.5) this.pay(); else this.post();
        this.nextAuto = now + 2200;
      }
      if (!this.anim && this.queue.length) { this.anim = this.queue.shift(); this.anim.t0 = now; }
      var n = 3, gap = sm ? 8 : 18, aw = (W - gap * (n + 1)) / n, top = sm ? 18 : 26, ah = H * (sm ? 0.6 : 0.62);
      var pos = [];
      for (var i = 0; i < n; i++) {
        var x = gap + i * (aw + gap), a = this.acc[i];
        pos.push(x);
        rr(x, top, aw, ah, 10); ctx.fillStyle = K.white; ctx.fill(); ctx.strokeStyle = K.line; ctx.lineWidth = 1; ctx.stroke();
        text(a.name, x + aw / 2, top + 18, sm ? 10 : 12.5, K.ink, 'center', 600);
        ctx.strokeStyle = K.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 10, top + 36); ctx.lineTo(x + aw - 10, top + 36); ctx.moveTo(x + aw / 2, top + 36); ctx.lineTo(x + aw / 2, top + ah - 34); ctx.stroke();
        text('Dr', x + 16, top + 48, 10, K.muted, 'left', 500, MONO); text('Cr', x + aw - 16, top + 48, 10, K.muted, 'right', 500, MONO);
        var rowsDr = a.dr.slice(-4), rowsCr = a.cr.slice(-4), fs = sm ? 9.5 : 11.5;
        rowsDr.forEach(function (v, k) { text(gbp(v), x + aw / 2 - 8, top + 68 + k * (sm ? 15 : 19), fs, K.emerald, 'right', 500, MONO); });
        rowsCr.forEach(function (v, k) { text(gbp(v), x + aw - 10, top + 68 + k * (sm ? 15 : 19), fs, K.navy2, 'right', 500, MONO); });
        var bal = a.dr.reduce(function (s, v) { return s + v; }, 0) - a.cr.reduce(function (s, v) { return s + v; }, 0);
        text((sm ? '' : 'Balance ') + gbp(bal), x + aw / 2, top + ah - 16, sm ? 10 : 12, bal === 0 ? K.muted : K.ink, 'center', 600, MONO);
      }
      // moving entry
      if (this.anim) {
        var e = this.anim, p = clamp((now - e.t0) / (reduced ? 1 : 1100), 0, 1), q = easeOut(p);
        var sx = pos[e.cr] + aw * 0.75, dx = pos[e.dr] + aw * 0.25, yA = top + ah * 0.55;
        var cx = sx + (dx - sx) * q, cy = yA - Math.sin(q * Math.PI) * 40;
        ctx.strokeStyle = K.gold; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx, yA); ctx.quadraticCurveTo((sx + dx) / 2, yA - 80, dx, yA); ctx.stroke(); ctx.setLineDash([]);
        rr(cx - 34, cy - 12, 68, 24, 12); ctx.fillStyle = K.gold; ctx.fill();
        text(gbp(e.amt), cx, cy, 11, '#fff', 'center', 600, MONO);
        if (p >= 1) { this.acc[e.dr].dr.push(e.amt); this.acc[e.cr].cr.push(e.amt); this.status.textContent = e.label + ': Dr ' + this.acc[e.dr].name + ' / Cr ' + this.acc[e.cr].name + ' ' + gbp(e.amt); this.anim = null; }
      }
      // trial balance
      var tdr = 0, tcr = 0; this.acc.forEach(function (a) { a.dr.forEach(function (v) { tdr += v; }); a.cr.forEach(function (v) { tcr += v; }); });
      var by = top + ah + (sm ? 22 : 30), bw = W - gap * 2;
      text('Trial balance', gap, by, sm ? 10.5 : 12, K.muted, 'left', 500);
      text('Debits ' + gbp(tdr) + '  =  Credits ' + gbp(tcr) + '  ✓', W - gap, by, sm ? 10 : 12, K.emerald, 'right', 600, MONO);
      var mx = Math.max(tdr, 1), barW = bw * Math.min(1, tdr / Math.max(mx, 10000));
      rr(gap, by + 14, bw, 7, 3.5); ctx.fillStyle = K.bg; ctx.fill();
      rr(gap, by + 14, Math.max(7, barW), 7, 3.5); ctx.fillStyle = K.emerald; ctx.fill();
      rr(gap, by + 25, Math.max(7, bw * Math.min(1, tcr / Math.max(mx, 10000))), 7, 3.5); ctx.fillStyle = K.navy2; ctx.fill();
      return true;
    }
  };

  // ======================================================================
  // 3. PSL rent check
  // ======================================================================
  var psl = {
    title: 'PSL rent check',
    desc: 'Under Private Sector Leasing the council leases homes from landlords at an agreed monthly rent. Each payment is compared with the lease. Any difference larger than the tolerance is held until it is resolved.',
    used: 'Rent checks for the Private Sector Leasing scheme at Kingston, matching rents paid to lease terms and NEC records.',
    setup: function () {
      var self = this;
      this.props = [
        { id: 'P-01', lease: 1250, paid: 1250 }, { id: 'P-02', lease: 1475, paid: 1475 }, { id: 'P-03', lease: 1180, paid: 1255 },
        { id: 'P-04', lease: 1600, paid: 1600 }, { id: 'P-05', lease: 1320, paid: 1328 }, { id: 'P-06', lease: 1410, paid: 1410 },
        { id: 'P-07', lease: 1550, paid: 1510 }, { id: 'P-08', lease: 1290, paid: 1290 }
      ];
      this.tol = 10; this.t0 = performance.now();
      slider('pslTol', 'Tolerance per payment', 0, 60, 1, this.tol, function (v) { return '£' + v; }, function (v) { self.tol = v; });
      this.status = note('');
    },
    draw: function (now) {
      var sm = small(), t = (now - this.t0) / 1000, ps = this.props, n = ps.length;
      var left = sm ? 10 : 46, right = 12, top = 30, bottom = sm ? 46 : 52, ch = H - top - bottom, cw = (W - left - right) / n;
      var min = 1000, max = 1700;
      function Y(v) { return top + ch - (v - min) / (max - min) * ch; }
      ctx.strokeStyle = K.line; ctx.lineWidth = 1;
      for (var g = 1000; g <= 1700; g += 100) { var gy = Y(g); ctx.beginPath(); ctx.moveTo(left, gy); ctx.lineTo(W - right, gy); ctx.stroke(); if (!sm) text('£' + (g / 1000).toFixed(1) + 'k', left - 6, gy, 10, K.muted, 'right', 400, MONO); }
      var held = 0;
      for (var i = 0; i < n; i++) {
        var p = ps[i], g2 = easeOut(t * 1.6 - i * 0.08), x = left + i * cw + cw * 0.16, bw = cw * 0.32;
        var diff = p.paid - p.lease, hold = Math.abs(diff) > this.tol;
        if (hold) held++;
        var yl = Y(min + (p.lease - min) * g2), yp = Y(min + (p.paid - min) * g2);
        rr(x, yl, bw, Y(min) - yl, 3); ctx.fillStyle = K.white; ctx.fill(); ctx.strokeStyle = K.ink; ctx.lineWidth = 1.2; ctx.stroke();
        rr(x + bw + 3, yp, bw, Y(min) - yp, 3); ctx.fillStyle = hold ? K.red : K.emerald; ctx.fill();
        text(p.id, x + bw + 1.5, H - bottom + 14, sm ? 9 : 10.5, K.muted, 'center', 500, MONO);
        var lab = diff === 0 ? '✓' : (diff > 0 ? '+' : '−') + '£' + Math.abs(diff);
        text(lab, x + bw + 1.5, H - bottom + (sm ? 28 : 31), sm ? 9 : 10.5, hold ? K.red : (diff === 0 ? K.emerald : K.gold), 'center', 600, MONO);
        if (hold && g2 > 0.98) { rr(x - 2, Math.min(yl, yp) - 24, bw * 2 + 7, 17, 8.5); ctx.fillStyle = K.redSoft; ctx.fill(); text('HOLD', x + bw + 1.5, Math.min(yl, yp) - 15.5, 9.5, K.red, 'center', 700, MONO); }
      }
      // legend
      var lx = sm ? 10 : left;
      rr(lx, 8, 10, 10, 2); ctx.fillStyle = K.white; ctx.fill(); ctx.strokeStyle = K.ink; ctx.stroke(); text('Lease rent', lx + 15, 13, 11, K.ink2);
      rr(lx + 92, 8, 10, 10, 2); ctx.fillStyle = K.emerald; ctx.fill(); text('Paid', lx + 107, 13, 11, K.ink2);
      rr(lx + 146, 8, 10, 10, 2); ctx.fillStyle = K.red; ctx.fill(); text('Held', lx + 161, 13, 11, K.ink2);
      this.status.textContent = held + ' of ' + n + ' payments held for review';
      return t < 2;
    }
  };

  // ======================================================================
  // 4. Arrears & repayment plan
  // ======================================================================
  var arrears = {
    title: 'Arrears and repayment plans',
    desc: 'When a rent account falls behind, the tenant keeps paying the weekly rent plus an agreed amount towards the arrears. The plan has to be affordable, and it has to clear the balance in a reasonable time. Picking up arrears early keeps the balance small.',
    used: 'Rent and service charge accounts in Sanctuary\'s Central Income Team: spotting arrears early and agreeing affordable repayment plans.',
    setup: function () {
      var self = this;
      this.bal = 1200; this.pay = 15; this.t0 = performance.now();
      slider('arBal', 'Arrears balance', 200, 3000, 50, this.bal, function (v) { return gbp(v); }, function (v) { self.bal = v; self.t0 = performance.now(); });
      slider('arPay', 'Extra paid per week', 5, 60, 1, this.pay, function (v) { return gbp(v); }, function (v) { self.pay = v; self.t0 = performance.now(); });
    },
    draw: function (now) {
      var sm = small(), t = (now - this.t0) / 1000;
      var weeks = Math.ceil(this.bal / this.pay), maxW = 600, maxB = 3000;
      var left = sm ? 40 : 56, right = 16, top = 46, bottom = 34, cw = W - left - right, ch = H - top - bottom;
      function X(w) { return left + w / maxW * cw; } function Y(b) { return top + ch - b / maxB * ch; }
      ctx.strokeStyle = K.line; ctx.lineWidth = 1;
      for (var b = 0; b <= maxB; b += 1000) { ctx.beginPath(); ctx.moveTo(left, Y(b)); ctx.lineTo(W - right, Y(b)); ctx.stroke(); text(b === 0 ? '£0' : '£' + b / 1000 + 'k', left - 6, Y(b), 10, K.muted, 'right', 400, MONO); }
      for (var w = 0; w <= maxW; w += 104) text(w === 0 ? 'wk 0' : (w / 52) + ' yr', X(w), H - bottom + 16, 10, K.muted, 'center', 400, MONO);
      var prog = reduced ? 1 : easeOut(t / 1.2), wEnd = Math.min(weeks, maxW) * prog;
      // area
      ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (var k = 0; k <= wEnd; k += Math.max(1, weeks / 120)) ctx.lineTo(X(k), Y(Math.max(0, this.bal - this.pay * k)));
      ctx.lineTo(X(wEnd), Y(Math.max(0, this.bal - this.pay * wEnd))); ctx.lineTo(X(wEnd), Y(0)); ctx.closePath();
      var grad = ctx.createLinearGradient(0, top, 0, H - bottom); grad.addColorStop(0, 'rgba(178,67,47,.20)'); grad.addColorStop(1, 'rgba(14,124,102,.08)');
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(X(0), Y(this.bal)); ctx.lineTo(X(wEnd), Y(Math.max(0, this.bal - this.pay * wEnd)));
      ctx.strokeStyle = K.red; ctx.lineWidth = 2.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(X(0), Y(this.bal), 4, 0, 7); ctx.fillStyle = K.red; ctx.fill();
      if (prog >= 1) {
        var ex = X(Math.min(weeks, maxW));
        ctx.beginPath(); ctx.arc(ex, Y(0), 5, 0, 7); ctx.fillStyle = K.emerald; ctx.fill();
        var months = (weeks / 4.33);
        var label = weeks > maxW ? 'Over ' + Math.round(maxW / 52) + ' years to clear' : 'Cleared in ' + weeks + ' weeks (about ' + (months < 12 ? Math.round(months) + ' months' : (months / 12).toFixed(1) + ' years') + ')';
        text(label, left, 20, sm ? 12 : 14, weeks > 156 ? K.red : K.emerald, 'left', 600);
        text(weeks > 156 ? 'Long plan: review affordability and support' : 'Within a typical plan length', left, 37, 11, K.muted, 'left', 400);
      }
      return prog < 1;
    }
  };

  // ======================================================================
  // 5. Cash-flow forecast
  // ======================================================================
  var cash = {
    title: 'Cash-flow forecast',
    desc: 'Twelve months of actual receipts and payments set the trend. The next six months are forecast from that trend. The band shows the forecast range, which widens the further ahead it goes. Change the assumption on payments to see the effect on the closing balance.',
    used: 'Forecasting support and monitoring reports for managers at Kingston. Course in budgets, cash-flow forecasting and management accounts.',
    setup: function () {
      var self = this;
      var inA = [118, 122, 119, 125, 128, 124, 130, 133, 129, 136, 138, 140], outA = [112, 120, 121, 119, 126, 129, 123, 131, 134, 128, 135, 137];
      this.inA = inA; this.outA = outA; this.chg = 0; this.t0 = performance.now();
      slider('cfChg', 'Change in forecast payments', -8, 8, 1, 0, function (v) { return (v > 0 ? '+' : '') + v + '%'; }, function (v) { self.chg = v; });
      this.status = note('');
    },
    draw: function (now) {
      var sm = small(), t = (now - this.t0) / 1000;
      var n = 18, act = 12, inF = [], outF = [];
      for (var i = 0; i < 6; i++) { inF.push(140 + 1.8 * (i + 1)); outF.push((137 + 2.0 * (i + 1)) * (1 + this.chg / 100)); }
      var ins = this.inA.concat(inF), outs = this.outA.concat(outF);
      var cum = [], c = 40; for (var k = 0; k < n; k++) { c += ins[k] - outs[k]; cum.push(c); }
      var left = sm ? 34 : 50, right = sm ? 34 : 50, top = 30, bottom = 30, cw = (W - left - right) / n, ch = H - top - bottom;
      var mid = top + ch * 0.62, sc = (ch * 0.36) / 160;
      var cMin = Math.min.apply(null, cum.concat([0])) - 20, cMax = Math.max.apply(null, cum) + 20;
      function YC(v) { return top + 6 + (1 - (v - cMin) / (cMax - cMin)) * (ch * 0.5); }
      // forecast shade
      ctx.fillStyle = 'rgba(169,133,58,.08)'; ctx.fillRect(left + act * cw, top - 10, 6 * cw, ch + 12);
      text('Actual', left + act * cw / 2, 14, 11, K.muted, 'center', 500); text('Forecast', left + act * cw + 3 * cw, 14, 11, K.gold, 'center', 600);
      ctx.strokeStyle = K.line2; ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(W - right, mid); ctx.stroke();
      var g = reduced ? 1 : easeOut(t / 1.4);
      for (var j = 0; j < n; j++) {
        var x = left + j * cw + cw * 0.18, bw = cw * 0.64, fc = j >= act;
        var hi = ins[j] * sc * 0.5 * g, ho = outs[j] * sc * 0.5 * g;
        ctx.globalAlpha = fc ? 0.55 : 1;
        ctx.fillStyle = K.emerald; ctx.fillRect(x, mid - hi, bw, hi);
        ctx.fillStyle = K.navy2; ctx.fillRect(x, mid + 1, bw, ho);
        ctx.globalAlpha = 1;
      }
      // band
      ctx.beginPath();
      for (var b = act - 1; b < n; b++) { var bx = left + b * cw + cw / 2, spread = (b - act + 1) * 5; if (b === act - 1) ctx.moveTo(bx, YC(cum[b] + spread)); else ctx.lineTo(bx, YC(cum[b] + spread)); }
      for (var b2 = n - 1; b2 >= act - 1; b2--) { var bx2 = left + b2 * cw + cw / 2, sp2 = (b2 - act + 1) * 5; ctx.lineTo(bx2, YC(cum[b2] - sp2)); }
      ctx.closePath(); ctx.fillStyle = 'rgba(169,133,58,.18)'; ctx.fill();
      // cumulative line
      var upto = Math.floor(g * (n - 1));
      ctx.beginPath(); for (var m = 0; m <= upto; m++) { var mx = left + m * cw + cw / 2; if (m === 0) ctx.moveTo(mx, YC(cum[m])); else ctx.lineTo(mx, YC(cum[m])); }
      ctx.strokeStyle = K.gold; ctx.lineWidth = 2.2; ctx.stroke();
      if (g >= 1) { var lx = left + (n - 1) * cw + cw / 2; ctx.beginPath(); ctx.arc(lx, YC(cum[n - 1]), 4, 0, 7); ctx.fillStyle = K.gold; ctx.fill(); }
      // legend
      var ly = H - 12;
      ctx.fillStyle = K.emerald; ctx.fillRect(left, ly - 5, 10, 10); text('Receipts', left + 15, ly, 11, K.ink2);
      ctx.fillStyle = K.navy2; ctx.fillRect(left + 86, ly - 5, 10, 10); text('Payments', left + 101, ly, 11, K.ink2);
      ctx.fillStyle = K.gold; ctx.fillRect(left + 176, ly - 1, 14, 2.5); text(sm ? 'Balance' : 'Running balance', left + 195, ly, 11, K.ink2);
      this.status.textContent = 'Forecast closing balance: £' + Math.round(cum[n - 1]) + 'k (range ±£' + 30 + 'k)';
      return g < 1;
    }
  };

  // ======================================================================
  // 6. Revaluation
  // ======================================================================
  var reval = {
    title: 'Asset revaluation and reported profit',
    desc: 'Under the revaluation model (IAS 16) an asset can be restated to fair value. An increase goes to a revaluation reserve in equity, not to profit. Depreciation is then charged on the new amount, so future profit changes. A decrease is charged to profit, unless it reverses an earlier increase.',
    used: 'MSc dissertation on how car manufacturers use revaluation to manage reported earnings. Business valuations at Sharada Entrepreneurs.',
    setup: function () {
      var self = this;
      this.pct = 25; this.t0 = performance.now();
      slider('rvPct', 'Revaluation at year 4', -30, 50, 5, this.pct, function (v) { return (v > 0 ? '+' : '') + v + '%'; }, function (v) { self.pct = v; self.t0 = performance.now(); });
      this.status = note('');
    },
    draw: function (now) {
      var sm = small(), t = (now - this.t0) / 1000;
      var cost = 1000000, life = 10, dep0 = cost / life, rvYear = 4;
      var cBefore = cost - dep0 * rvYear, cAfter = cBefore * (1 + this.pct / 100), dep1 = cAfter / (life - rvYear);
      var left = sm ? 44 : 60, right = 16, top = 46, bottom = 34, cw = W - left - right, ch = H - top - bottom;
      var maxV = 1100000;
      function X(y) { return left + y / life * cw; } function Y(v) { return top + ch - v / maxV * ch; }
      ctx.strokeStyle = K.line; ctx.lineWidth = 1;
      for (var v = 0; v <= 1000000; v += 250000) { ctx.beginPath(); ctx.moveTo(left, Y(v)); ctx.lineTo(W - right, Y(v)); ctx.stroke(); text('£' + v / 1000 + 'k', left - 6, Y(v), 10, K.muted, 'right', 400, MONO); }
      for (var y = 0; y <= life; y += 2) text('yr ' + y, X(y), H - bottom + 16, 10, K.muted, 'center', 400, MONO);
      var g = reduced ? 1 : easeOut(t / 1.2);
      // depreciation bars
      for (var yr = 0; yr < life; yr++) {
        var d = yr < rvYear ? dep0 : dep1, bh = (d / maxV) * ch * 1.6 * g;
        ctx.fillStyle = yr < rvYear ? 'rgba(43,64,102,.18)' : (dep1 > dep0 ? 'rgba(178,67,47,.22)' : 'rgba(14,124,102,.22)');
        ctx.fillRect(X(yr) + cw / life * 0.2, Y(0) - bh, cw / life * 0.6, bh);
      }
      // cost-model line (dashed)
      ctx.setLineDash([5, 5]); ctx.strokeStyle = K.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X(0), Y(cost)); ctx.lineTo(X(life), Y(0)); ctx.stroke(); ctx.setLineDash([]);
      // revaluation-model line
      ctx.strokeStyle = K.ink; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(X(0), Y(cost)); ctx.lineTo(X(rvYear), Y(cBefore));
      var jump = cBefore + (cAfter - cBefore) * g; ctx.lineTo(X(rvYear), Y(jump));
      if (g >= 1) ctx.lineTo(X(life), Y(0)); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(rvYear), Y(jump), 4.5, 0, 7); ctx.fillStyle = this.pct >= 0 ? K.emerald : K.red; ctx.fill();
      var surplus = cAfter - cBefore;
      text(this.pct >= 0 ? 'Revaluation reserve (equity): +' + gbp(surplus) : 'Loss charged to profit: ' + gbp(surplus), left, 16, sm ? 11.5 : 13, this.pct >= 0 ? K.emerald : K.red, 'left', 600);
      text('Annual depreciation ' + gbp(dep0) + ' → ' + gbp(Math.round(dep1)), left, 33, sm ? 10.5 : 12, K.ink2, 'left', 500, MONO);
      var eff = dep0 - dep1;
      this.status.textContent = 'Effect on each later year\'s profit: ' + (eff >= 0 ? '+' : '−') + gbp(Math.abs(Math.round(eff))) + ' (dashed line: cost model)';
      return g < 1;
    }
  };

  // ======================================================================
  var labs = { recon: recon, ledger: ledger, psl: psl, arrears: arrears, cash: cash, reval: reval };
  var active = null, visible = false, raf = 0, idle = false;

  function select(key) {
    active = labs[key];
    tabs.forEach(function (t) { var on = t.getAttribute('data-lab') === key; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
    titleEl.textContent = active.title; descEl.textContent = active.desc; usedEl.textContent = active.used;
    canvas.setAttribute('aria-label', active.title + ' (interactive model with illustrative figures)');
    ctrlEl.innerHTML = '';
    active.setup();
    kick();
  }
  function loop(now) {
    raf = 0;
    if (!visible || !active) return;
    ctx.clearRect(0, 0, W, H);
    var more = active.draw(now);
    // keep animating while a model is moving; the reconciliation & ledger are continuous
    if (more || active === recon || active === ledger || !idle) { raf = requestAnimationFrame(loop); }
    idle = !more;
  }
  function kick() { idle = false; if (!raf && visible) raf = requestAnimationFrame(loop); }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t.getAttribute('data-lab')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return; e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click();
    });
  });
  ctrlEl.addEventListener('input', kick);
  ctrlEl.addEventListener('click', kick);

  size();
  var lastW = W;
  if (window.ResizeObserver) new ResizeObserver(function () { size(); if (W !== lastW) { lastW = W; } kick(); }).observe(canvas.parentNode);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: '100px' }).observe(canvas);
  else visible = true;
  select('recon');
})();
