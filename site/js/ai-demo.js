/* AI section demo: rule checks + a simple anomaly score on made-up invoices. */
(function () {
  'use strict';
  var table = document.getElementById('aiTable');
  if (!table) return;
  var tbody = table.querySelector('tbody');
  var runBtn = document.getElementById('aiRun'), resetBtn = document.getElementById('aiReset'), summary = document.getElementById('aiSummary');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Made-up invoices: billed vs booked nights, billed vs agreed nightly rate.
  var invoices = [
    { id: 'INV-2041', nb: 28, nk: 28, rb: 62, ra: 62 },
    { id: 'INV-2042', nb: 31, nk: 31, rb: 58, ra: 58 },
    { id: 'INV-2043', nb: 30, nk: 30, rb: 70, ra: 65 },  // rate mismatch
    { id: 'INV-2044', nb: 14, nk: 14, rb: 61, ra: 61 },
    { id: 'INV-2045', nb: 33, nk: 30, rb: 60, ra: 60 },  // nights over booking
    { id: 'INV-2046', nb: 28, nk: 28, rb: 64, ra: 64 },
    { id: 'INV-2047', nb: 31, nk: 31, rb: 58, ra: 58, dup: 'INV-2042' }, // duplicate of 2042
    { id: 'INV-2048', nb: 7, nk: 7, rb: 145, ra: 145 },  // unusual: very high agreed rate
    { id: 'INV-2049', nb: 30, nk: 30, rb: 63, ra: 63 },
    { id: 'INV-2050', nb: 21, nk: 21, rb: 59, ra: 59 }
  ];
  invoices.forEach(function (v) { v.amt = v.nb * v.rb; });

  function gbp(n) { return '£' + n.toLocaleString('en-GB'); }

  // Simple anomaly score: robust z-score of nightly rate (median / MAD).
  var rates = invoices.map(function (v) { return v.rb; }).sort(function (a, b) { return a - b; });
  var med = (rates[4] + rates[5]) / 2;
  var mad = invoices.map(function (v) { return Math.abs(v.rb - med); }).sort(function (a, b) { return a - b; });
  var madV = Math.max(1, (mad[4] + mad[5]) / 2);

  function check(v) {
    if (v.rb !== v.ra) return { cls: 'hold', txt: 'Hold: rate £' + v.rb + ' vs £' + v.ra, short: 'Hold: rate' };
    if (v.nb > v.nk) return { cls: 'hold', txt: 'Hold: ' + (v.nb - v.nk) + ' nights over', short: 'Hold: nights' };
    if (v.dup) return { cls: 'hold', txt: 'Hold: duplicate of ' + v.dup.slice(4), short: 'Hold: duplicate' };
    var z = Math.abs(v.rb - med) / (1.4826 * madV);
    if (z > 3.5) return { cls: 'review', txt: 'Review: rate unusual', short: 'Review: unusual' };
    return { cls: 'ok', txt: 'OK to pay', short: 'OK to pay' };
  }

  function render() {
    tbody.innerHTML = invoices.map(function (v) {
      return '<tr><td>' + v.id + '</td>' +
        '<td>' + (v.nb > v.nk ? '<span class="bad">' + v.nb + '</span>' : v.nb) + ' / ' + v.nk + '</td>' +
        '<td>' + (v.rb !== v.ra ? '<span class="bad">£' + v.rb + '</span>' : '£' + v.rb) + ' / £' + v.ra + '</td>' +
        '<td>' + gbp(v.amt) + '</td>' +
        '<td><span class="res">Not checked</span></td></tr>';
    }).join('');
    summary.textContent = invoices.length + ' invoices waiting';
  }

  var timer = null;
  function run() {
    if (timer) return;
    render();
    var rows = tbody.querySelectorAll('tr'), i = 0, ok = 0, hold = 0, review = 0;
    runBtn.disabled = true;
    function step() {
      if (i > 0) rows[i - 1].classList.remove('is-scan');
      if (i >= rows.length) {
        timer = null; runBtn.disabled = false;
        summary.textContent = ok + ' OK · ' + hold + ' held · ' + review + ' to review';
        return;
      }
      var r = check(invoices[i]);
      rows[i].classList.add('is-scan');
      var cell = rows[i].lastElementChild.firstElementChild;
      cell.className = 'res res--' + r.cls;
      cell.innerHTML = '<span class="res__long">' + r.txt + '</span><span class="res__short">' + r.short + '</span>';
      if (r.cls === 'ok') ok++; else if (r.cls === 'hold') hold++; else review++;
      summary.textContent = 'Checking ' + invoices[i].id + '…';
      i++;
      timer = setTimeout(step, reduced ? 0 : 320);
    }
    step();
  }

  runBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', function () { if (timer) { clearTimeout(timer); timer = null; runBtn.disabled = false; } render(); });
  render();

  // Run once automatically the first time the demo scrolls into view.
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(run, 600); } }, { threshold: 0.4 });
    io.observe(table);
  }
})();
