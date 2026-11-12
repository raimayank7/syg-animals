/* pets: routine tick lists kept in the browser, recently viewed, "which pet suits you" */
(function () {
  'use strict';
  var d = document, S = window.SYG, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var KEY = 'syg-pets-recent';

  var art = $('[data-pet]');
  if (art) S.recent(KEY, { u: '/pets/' + art.getAttribute('data-pet') + '/', t: art.getAttribute('data-name') });
  var rl = $('#recent-list');
  if (rl) { var rec = S.recent(KEY); if (rec.length) { rl.innerHTML = rec.map(function (r) { return '<a href="' + S.esc(r.u) + '">' + S.esc(r.t) + '</a>'; }).join(''); $('#recent').hidden = false; } }

  /* tick lists: daily clears each day, weekly each Monday, monthly each month */
  var now = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var day = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  var stamp = { daily: day, weekly: 'w' + mon.getFullYear() + '-' + pad(mon.getMonth() + 1) + '-' + pad(mon.getDate()), monthly: day.slice(0, 7) };
  $$('[data-ticks]').forEach(function (ul) {
    var id = ul.getAttribute('data-ticks'), kind = id.split('-').pop(), key = 'syg-pets-ticks-' + id, saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
    if (saved.s !== stamp[kind]) saved = { s: stamp[kind], v: [] };
    var boxes = $$('input', ul);
    boxes.forEach(function (b, i) { b.checked = saved.v.indexOf(i) > -1; });
    ul.addEventListener('change', function () {
      saved.v = []; boxes.forEach(function (b, i) { if (b.checked) saved.v.push(i); });
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
      if (saved.v.length === boxes.length) S.toast(kind === 'daily' ? 'All done for today' : 'All done');
    });
  });

  /* which pet suits you */
  var form = $('#choose'), out = $('#cres');
  if (form && out) {
    /* what each pet needs: time 1-3, space 1-3, cost 1-3, touch 0-2 (how much it enjoys being held), company 0-2 (how much it minds an empty house), kids 0-2 (0 fine with small children supervised, 2 only older children) */
    var P = [
      { s: 'dog', n: 'Dog', e: '🐕', time: 3, space: 2, cost: 3, touch: 2, company: 2, kids: 0 },
      { s: 'cat', n: 'Cat', e: '🐈', time: 2, space: 1, cost: 2, touch: 2, company: 1, kids: 0 },
      { s: 'rabbit', n: 'Rabbit', e: '🐇', time: 2, space: 2, cost: 2, touch: 1, company: 1, kids: 1 },
      { s: 'guinea-pig', n: 'Guinea pig', e: '🐹', time: 2, space: 2, cost: 2, touch: 1, company: 1, kids: 0 },
      { s: 'hamster', n: 'Hamster', e: '🐹', time: 1, space: 1, cost: 1, touch: 1, company: 0, kids: 1 },
      { s: 'budgerigar', n: 'Budgerigar', e: '🦜', time: 2, space: 1, cost: 1, touch: 1, company: 1, kids: 0 },
      { s: 'cockatiel', n: 'Cockatiel', e: '🦜', time: 2, space: 2, cost: 2, touch: 2, company: 2, kids: 1 },
      { s: 'goldfish', n: 'Goldfish', e: '🐟', time: 1, space: 2, cost: 2, touch: 0, company: 0, kids: 0 },
      { s: 'betta-fish', n: 'Betta fish', e: '🐠', time: 1, space: 1, cost: 1, touch: 0, company: 0, kids: 0 },
      { s: 'tropical-fish-tank', n: 'Tropical fish tank', e: '🐠', time: 1, space: 2, cost: 2, touch: 0, company: 0, kids: 0 }
    ];
    var val = function (id) { return +$('#c-' + id).value; };
    var draw = function () {
      var a = { time: val('time'), space: val('space'), cost: val('cost'), touch: val('touch'), home: val('home'), kids: val('kids') };
      var res = P.map(function (p) {
        var good = [], bad = [];
        if (a.time >= p.time) good.push('You have the time it needs each day'); else bad.push(p.time === 3 ? 'It needs two hours or more of your time every day' : 'It needs about an hour of your time every day');
        if (a.space >= p.space) good.push('Your home has enough room'); else bad.push(p.s === 'dog' ? 'It needs more room, or a lot of outdoor exercise' : 'Its cage, pen or tank needs more spare space than you have');
        if (a.cost >= p.cost) good.push('The running cost fits what you can set aside'); else bad.push('It costs more to keep well than you plan to spend');
        if (a.touch === 2 && p.touch === 0) bad.push('You want a pet to hold, and this one is only for watching');
        else if (a.touch === 2 && p.touch === 1) bad.push('It accepts gentle handling but is not a cuddly pet');
        else if (a.touch === 0 && p.touch === 0) good.push('It is a pet for watching, which is what you want');
        else if (a.touch >= 1 && p.touch === 2) good.push('It enjoys being with people and being touched');
        if (p.company === 2 && a.home === 0) bad.push('It suffers when left alone for long hours');
        else if (p.company === 1 && a.home === 0) bad.push('It needs company: keep a pair, or make time morning and evening');
        else if (p.company === 0) good.push('It does not mind an empty house during the day');
        if (a.kids === 2 && p.kids >= 1) bad.push('It is too delicate or shy for children under six');
        else if (a.kids === 2) good.push('Fine around small children, with an adult always in charge');
        else if (a.kids === 1 && p.kids === 2) bad.push('Better with older children');
        var serious = bad.filter(function (b) { return /needs two hours|suffers|more room|too delicate|only for watching/.test(b); }).length;
        var cls = bad.length === 0 ? 'good' : (bad.length <= 1 && !serious) || (bad.length === 1 && serious && p.time <= a.time) ? 'maybe' : 'poor';
        if (bad.length >= 2) cls = 'poor';
        return { p: p, good: good, bad: bad, cls: cls, score: good.length - bad.length * 2 - serious };
      }).sort(function (x, y) { return y.score - x.score; });
      var LAB = { good: 'A good match', maybe: 'Possible, with one thing to plan for', poor: 'Not a good match right now' };
      var n = res.filter(function (r) { return r.cls === 'good'; }).length;
      out.innerHTML = '<h2>' + (n ? n + (n === 1 ? ' pet matches' : ' pets match') + ' your answers' : 'No pet matches all your answers') + '</h2>' +
        (n ? '' : '<p>That is useful to know. Look at the "possible" pets below and what each would need from you, or wait until your time or space changes.</p>') +
        res.map(function (r) {
          return '<div class="fit ' + r.cls + '"><h3><span aria-hidden="true">' + r.p.e + '</span> <a href="/pets/' + r.p.s + '/">' + r.p.n + '</a> <small>' + LAB[r.cls] + '</small></h3>' +
            (r.bad.length ? '<ul>' + r.bad.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' : '') +
            (r.good.length ? '<p class="hint">' + r.good.join('. ') + '.</p>' : '') + '</div>';
        }).join('') + '<p class="hint">Read the full care guide before you decide. Every animal is an individual.</p>';
    };
    form.addEventListener('change', draw);
    draw();
  }
})();
