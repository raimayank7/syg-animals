/* animals: home search and group filter, recently viewed, table filter, quiz */
(function () {
  'use strict';
  var d = document, S = window.SYG, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var KEY = 'syg-animals-recent';

  var art = $('[data-an]');
  if (art) S.recent(KEY, { u: '/' + art.getAttribute('data-an') + '/', t: art.getAttribute('data-name') });

  var all = $('#all'), q = $('#q');
  if (all && q) {
    var items = $$('li', all), grp = '', count = $('#count');
    var paint = function () {
      var v = q.value.trim().toLowerCase(), n = 0;
      items.forEach(function (li) { var ok = (!grp || li.getAttribute('data-g') === grp) && (!v || li.getAttribute('data-q').indexOf(v) > -1); li.hidden = !ok; if (ok) n++; });
      count.textContent = v || grp ? (n ? n + (n === 1 ? ' animal' : ' animals') : 'No animal matches. This site covers a limited list of well-known animals.') : '';
    };
    q.addEventListener('input', paint);
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter' && q.value.trim()) { var f = items.filter(function (li) { return !li.hidden; }); if (f.length) location.href = $('a', f[0]).href; } });
    $('#grp').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var on = b.getAttribute('aria-pressed') === 'true';
      $$('#grp button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      grp = on ? '' : b.getAttribute('data-g'); if (!on) b.setAttribute('aria-pressed', 'true');
      paint();
    });
    var rec = S.recent(KEY);
    if (rec.length) { $('#recent-list').innerHTML = rec.map(function (r) { return '<a href="' + S.esc(r.u) + '">' + S.esc(r.t) + '</a>'; }).join(''); $('#recent').hidden = false; }
  }

  var lq = $('#lq'), ft = $('table.filt');
  if (lq && ft) {
    var rows = $$('tbody tr', ft), cnt = $('#lcount');
    lq.addEventListener('input', function () {
      var v = lq.value.trim().toLowerCase(), n = 0;
      rows.forEach(function (r) { var ok = !v || r.getAttribute('data-q').indexOf(v) > -1; r.hidden = !ok; if (ok) n++; });
      cnt.textContent = v ? (n ? n + ' of ' + rows.length + ' rows shown' : 'Nothing matches. Check the spelling.') : '';
    });
  }

  var qz = $('#quiz');
  if (qz) {
    var box = $('#qbox'), best = $('#qbest'), type = 'young', data = null, round = null, score, idx;
    var GR = { mammal: 'Mammal', bird: 'Bird', reptile: 'Reptile', amphibian: 'Amphibian', fish: 'Fish', invertebrate: 'Invertebrate' };
    var bkey = function () { return 'syg-animals-quiz-' + type; };
    var showBest = function () { var b = 0; try { b = +localStorage.getItem(bkey()) || 0; } catch (e) {} best.textContent = b ? 'Your best score for this quiz: ' + b + ' out of 10.' : ''; };
    var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var field = function (r) { return type === 'young' ? r[3] : type === 'coll' ? r[4] : GR[r[2]]; };
    var pool = function () { return data.filter(function (r) { return field(r); }); };
    var ask = function () {
      if (idx >= round.length) {
        try { var b = +localStorage.getItem(bkey()) || 0; if (score > b) localStorage.setItem(bkey(), score); } catch (e) {}
        var txt = 'I scored ' + score + ' out of 10 on the animal quiz. Can you beat it? https://animals.shareyourgroup.com/quiz/';
        box.innerHTML = '<p class="qask">You scored ' + score + ' out of 10</p><p>' + (score === 10 ? 'Perfect. Try another kind of quiz.' : score >= 7 ? 'Well done. One more round?' : 'Good try. Every round has new animals.') + '</p>' +
          '<div class="acts"><button class="btn" type="button" id="qstart">Play again</button><button class="btn ghost" type="button" data-wa="' + S.esc(txt) + '">Challenge a friend</button></div>';
        showBest(); return;
      }
      var e = round[idx], right = field(e), opts = [right];
      shuffle(pool()).forEach(function (r) { var f = field(r); if (opts.length < 4 && opts.indexOf(f) < 0) opts.push(f); });
      if (type === 'group') opts = shuffle(Object.keys(GR).map(function (k) { return GR[k]; }).filter(function (x) { return x !== right; })).slice(0, 3).concat([right]);
      shuffle(opts);
      var qn = '<b>' + S.esc(e[0]) + '</b>: ' + (type === 'young' ? 'what is its young called?' : type === 'coll' ? 'what is a group of them called?' : 'what kind of animal is it?');
      box.innerHTML = '<p class="hint">Question ' + (idx + 1) + ' of 10 · Score ' + score + '</p><p class="qask"><span class="em" aria-hidden="true">' + e[5] + '</span>' + qn + '</p>' +
        '<div class="qopts">' + opts.map(function (o) { return '<button type="button" data-ok="' + (o === right ? 1 : 0) + '">' + S.esc(o) + '</button>'; }).join('') + '</div><p id="qfb" role="status"></p>';
    };
    var start = function () { round = shuffle(pool()).slice(0, 10); score = 0; idx = 0; ask(); };
    qz.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.id === 'qstart') { if (data) start(); else S.json('/data/animals.json').then(function (j) { data = j; start(); }).catch(function () { S.toast('Could not load the questions. Check your connection.'); }); return; }
      if (b.hasAttribute('data-t')) { $$('#qtype button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); type = b.getAttribute('data-t'); showBest(); if (data && round) start(); return; }
      if (b.hasAttribute('data-ok') && !b.disabled) {
        var ok = b.getAttribute('data-ok') === '1', e = round[idx];
        $$('.qopts button').forEach(function (x) { x.disabled = true; if (x.getAttribute('data-ok') === '1') x.classList.add('right'); });
        if (ok) score++; else b.classList.add('wrong');
        $('#qfb').innerHTML = (ok ? 'Correct. ' : 'Not quite. The answer is "' + S.esc(field(e)) + '". ') + '<a href="/' + e[1] + '/">Read about it: ' + S.esc(e[0]) + '</a>. <button class="btn sm" type="button" id="qnext">Next</button>';
        $('#qnext').focus(); return;
      }
      if (b.id === 'qnext') { idx++; ask(); }
    });
    showBest();
  }
})();
