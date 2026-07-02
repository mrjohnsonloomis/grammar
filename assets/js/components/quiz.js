/* quiz.js — the practice engine.
   Mounts:
     <div data-component="quiz" data-lesson="03" data-count="5" data-cumulative="true"></div>
     <div data-component="quiz" data-concepts="noun,verb" data-count="10"></div>
     <div data-component="practice-app"></div>   (full practice page)
   Data: /data/sentences/items.json (see SCHEMA.md).
   Identification items are auto-checked; construction items reveal models and
   are self-assessed. All state is in memory only — nothing is stored. */
(function () {
  'use strict';
  window.GX = window.GX || {};
  var esc = function (s) { return GX.util.esc(s); };

  var IDENT_KINDS = ['identify', 'classify', 'mc'];
  var CONSTRUCT_KINDS = ['combine', 'expand', 'imitate', 'revise'];
  var KIND_TAG = {
    identify: 'identify · click words', classify: 'classify in context', mc: 'multiple choice',
    combine: 'combine', expand: 'expand', imitate: 'imitate', revise: 'revise'
  };

  /* ---------- selection ---------- */
  function poolFilter(items, opts) {
    return items.filter(function (it) {
      if (it.kind === 'recall') return false;
      if (opts.kinds && opts.kinds.indexOf(it.kind) < 0) return false;
      if (opts.lessons && opts.lessons.indexOf(it.lesson) < 0) return false;
      if (opts.concepts && !it.concepts.some(function (c) { return opts.concepts.indexOf(c) >= 0; })) return false;
      return true;
    });
  }

  function sample(items, opts) {
    var count = opts.count || 5;
    var picked;
    if (opts.cumulative && opts.lessons && opts.lessons.length === 1) {
      /* End-of-lesson check: mostly this lesson + 1-2 spaced-retrieval items from earlier lessons. */
      var lesson = opts.lessons[0];
      var current = GX.util.shuffle(poolFilter(items, { kinds: opts.kinds, lessons: [lesson], concepts: opts.concepts }));
      var earlier = GX.util.shuffle(items.filter(function (it) {
        return it.kind !== 'recall' && it.lesson < lesson && (!opts.kinds || opts.kinds.indexOf(it.kind) >= 0);
      }));
      var nEarlier = Math.min(earlier.length, count >= 5 ? 2 : 1);
      picked = current.slice(0, count - nEarlier).concat(earlier.slice(0, nEarlier));
      GX.util.shuffle(picked);
    } else if (opts.lessons && opts.lessons.length > 1) {
      /* Mixed review: interleave lessons round-robin (Rohrer & Taylor: interleaving beats blocking). */
      var byLesson = {};
      opts.lessons.forEach(function (l) {
        byLesson[l] = GX.util.shuffle(poolFilter(items, { kinds: opts.kinds, lessons: [l], concepts: opts.concepts }));
      });
      picked = [];
      var lessons = GX.util.shuffle(opts.lessons.slice());
      var i = 0;
      while (picked.length < count) {
        var any = false;
        for (var k = 0; k < lessons.length && picked.length < count; k++) {
          var q = byLesson[lessons[(i + k) % lessons.length]];
          if (q && q.length) { picked.push(q.shift()); any = true; }
        }
        i++;
        if (!any) break;
      }
    } else {
      picked = GX.util.shuffle(poolFilter(items, opts)).slice(0, count);
    }
    return picked;
  }

  /* ---------- engine ---------- */
  GX.Quiz = {
    mount: function (el) {
      var opts = {
        count: parseInt(el.getAttribute('data-count') || '5', 10),
        cumulative: el.getAttribute('data-cumulative') === 'true'
      };
      var lesson = el.getAttribute('data-lesson');
      if (lesson) opts.lessons = lesson.split(',').map(function (s) { return s.trim(); });
      var concepts = el.getAttribute('data-concepts');
      if (concepts) opts.concepts = concepts.split(',').map(function (s) { return s.trim(); });
      var kinds = el.getAttribute('data-kinds');
      if (kinds) opts.kinds = kinds.split(',').map(function (s) { return s.trim(); });
      GX.Quiz.start(el, opts);
    },

    start: function (el, opts) {
      GX.data.load('items').then(function (data) {
        var problems = sample(data.items, opts);
        if (!problems.length) {
          el.innerHTML = '<div class="practice-widget"><div class="practice-empty">No items match this filter yet.</div></div>';
          return;
        }
        run(el, problems, opts);
      }).catch(function (err) { GX.fail(el, err); });
    },

    mountApp: function (el) { mountApp(el); }
  };

  function run(el, problems, opts) {
    var state = { idx: 0, answered: [] };

    function render() {
      if (state.idx >= problems.length) { renderSummary(); return; }
      var p = problems[state.idx];
      var a = state.answered[state.idx];

      var dots = problems.map(function (_, i) {
        var cls = 'practice-dot';
        if (i < state.idx) cls += state.answered[i] && state.answered[i].correct ? ' correct' : ' incorrect';
        else if (i === state.idx) cls += ' current';
        return '<span class="' + cls + '"></span>';
      }).join('');

      el.innerHTML =
        '<div class="practice-widget">' +
        '  <div class="practice-progress">' +
        '    <span class="practice-progress-text">Question ' + (state.idx + 1) + ' of ' + problems.length + '</span>' +
        '    <span class="practice-kind-tag">' + (KIND_TAG[p.kind] || p.kind) + '</span>' +
        '    <div class="practice-progress-dots">' + dots + '</div>' +
        '  </div>' +
        '  <div class="practice-body"></div>' +
        '  <div class="practice-after"></div>' +
        '</div>';

      var body = el.querySelector('.practice-body');
      if (CONSTRUCT_KINDS.indexOf(p.kind) >= 0) {
        GX.Construct.renderInto(body, p, function (ok) {
          state.answered[state.idx] = { correct: ok, self: true };
          renderNextBtn();
        });
      } else {
        renderIdent(body, p, a);
      }
      if (a) renderFeedback(p, a);
    }

    function renderIdent(body, p, a) {
      if (p.kind === 'mc' || p.kind === 'classify') {
        var stim = '';
        if (p.kind === 'classify') {
          var re = new RegExp('\\b(' + p.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b');
          stim = '<div class="practice-classify-sentence">' + esc(p.sentence).replace(re, '<mark class="practice-target">$1</mark>') + '</div>';
        } else if (p.stimulus) {
          stim = '<div class="practice-stimulus">' + p.stimulus + '</div>';
        }
        body.innerHTML = stim +
          '<div class="practice-prompt">' + esc(p.prompt) + '</div>' +
          '<div class="practice-choices">' + p.choices.map(function (c, i) {
            var cls = 'practice-choice';
            if (a) {
              if (i === p.answer) cls += ' correct';
              else if (i === a.userAnswer) cls += ' incorrect';
              cls += ' locked';
            }
            return '<button type="button" class="' + cls + '" data-i="' + i + '"' + (a ? ' disabled' : '') + '>' + esc(c) + '</button>';
          }).join('') + '</div>';
        if (!a) {
          body.querySelectorAll('.practice-choice').forEach(function (b) {
            b.addEventListener('click', function () {
              var i = parseInt(b.getAttribute('data-i'), 10);
              state.answered[state.idx] = { userAnswer: i, correct: i === p.answer };
              render();
            });
          });
        }
      } else if (p.kind === 'identify') {
        var selected = a ? new Set(a.userAnswer) : new Set();
        var correct = new Set(p.answer);
        body.innerHTML =
          '<div class="practice-prompt">' + esc(p.instruction) + '</div>' +
          '<div class="practice-identify-sentence">' + p.sentence.map(function (w, i) {
            var isPunct = /^[.,;:!?'"()\-—…]+$/.test(w);
            var cls = 'practice-word' + (isPunct ? ' punct' : '');
            if (a) {
              cls += ' locked';
              var was = selected.has(i), is = correct.has(i);
              if (was && is) cls += ' correct-picked';
              else if (was && !is) cls += ' wrong-picked';
              else if (!was && is) cls += ' missed';
            }
            if (isPunct || a) return '<span class="' + cls + '">' + esc(w) + '</span>';
            return '<button type="button" class="' + cls + '" data-i="' + i + '" aria-pressed="false">' + esc(w) + '</button>';
          }).join(' ') + '</div>' +
          (!a ? '<button type="button" class="practice-check-btn">Check Answer</button>' : '');
        if (!a) {
          var sel = new Set();
          body.querySelectorAll('button.practice-word').forEach(function (w) {
            w.addEventListener('click', function () {
              var i = parseInt(w.getAttribute('data-i'), 10);
              if (sel.has(i)) { sel.delete(i); w.classList.remove('selected'); w.setAttribute('aria-pressed', 'false'); }
              else { sel.add(i); w.classList.add('selected'); w.setAttribute('aria-pressed', 'true'); }
            });
          });
          body.querySelector('.practice-check-btn').addEventListener('click', function () {
            var user = Array.from(sel).sort(function (x, y) { return x - y; });
            var key = p.answer.slice().sort(function (x, y) { return x - y; });
            var ok = user.length === key.length && key.every(function (v, i) { return v === user[i]; });
            state.answered[state.idx] = { userAnswer: user, correct: ok };
            render();
          });
        }
      }
    }

    function renderFeedback(p, a) {
      var after = el.querySelector('.practice-after');
      after.innerHTML =
        '<div class="practice-feedback ' + (a.correct ? 'correct' : 'incorrect') + '" aria-live="polite">' +
        '  <div class="practice-feedback-header"><span aria-hidden="true">' + (a.correct ? '✓' : '✗') + '</span><span>' + (a.correct ? 'Correct' : 'Not quite — here’s the thinking') + '</span></div>' +
        '  <div class="practice-feedback-body">' + p.feedback + '</div>' +
        '</div>';
      renderNextBtn();
    }

    function renderNextBtn() {
      var after = el.querySelector('.practice-after');
      var isLast = state.idx === problems.length - 1;
      var row = document.createElement('div');
      row.className = 'practice-actions';
      row.innerHTML = '<button type="button" class="practice-next-btn">' + (isLast ? 'See Results' : 'Next →') + '</button>';
      after.appendChild(row);
      row.querySelector('button').addEventListener('click', function () {
        state.idx++;
        render();
      });
      row.querySelector('button').focus();
    }

    function renderSummary() {
      var auto = [], self = [];
      state.answered.forEach(function (a, i) {
        (a && a.self ? self : auto).push({ a: a, p: problems[i] });
      });
      var okAuto = auto.filter(function (x) { return x.a && x.a.correct; }).length;
      var okSelf = self.filter(function (x) { return x.a && x.a.correct; }).length;
      var total = problems.length;
      var okAll = okAuto + okSelf;
      var pct = Math.round((okAll / total) * 100);
      var message = pct === 100 ? 'Perfect run.' :
        pct >= 80 ? 'Strong work.' :
        pct >= 60 ? 'Solid start — the feedback above each answer is where the learning happens.' :
        'Keep at it. Revisit the linked lessons below, then try a fresh set.';

      /* per-concept breakdown, keyed by each item's first concept */
      var buckets = {};
      problems.forEach(function (p, i) {
        var c = p.concepts[0];
        buckets[c] = buckets[c] || { ok: 0, n: 0, lesson: p.lesson };
        buckets[c].n++;
        if (state.answered[i] && state.answered[i].correct) buckets[c].ok++;
      });

      el.innerHTML =
        '<div class="practice-widget"><div class="practice-summary">' +
        '  <div class="practice-summary-score">' + okAll + ' / ' + total + '</div>' +
        '  <div class="practice-summary-message">' + esc(message) + '</div>' +
        '  <div class="practice-summary-dots">' + state.answered.map(function (a) {
             return '<span class="practice-dot ' + (a && a.correct ? 'correct' : 'incorrect') + '"></span>';
           }).join('') + '</div>' +
        (self.length ? '<div class="practice-breakdown-note">' + self.length + ' building exercise' + (self.length > 1 ? 's were' : ' was') + ' self-checked against the models (' + okSelf + ' marked “makes the move”).</div>' : '') +
        '  <div class="practice-breakdown">' + Object.keys(buckets).map(function (c) {
             var b = buckets[c];
             return '<div class="practice-breakdown-row"><span>' + esc(GX.util.titleCase(c.replace(/-/g, ' '))) + '</span>' +
               '<span><a href="' + GX.lessonUrl(b.lesson) + '">Lesson ' + b.lesson + ' · ' + esc(GX.LESSON_TITLES[b.lesson] || '') + '</a></span>' +
               '<span class="practice-breakdown-score">' + b.ok + '/' + b.n + '</span></div>';
           }).join('') + '</div>' +
        '  <div class="practice-breakdown-note">Results live only on this screen — nothing is saved or sent anywhere.</div>' +
        '  <button type="button" class="practice-retry-btn">Try a New Set</button>' +
        '</div></div>';

      el.querySelector('.practice-retry-btn').addEventListener('click', function () {
        GX.Quiz.start(el, opts);
      });
    }

    render();
  }

  /* ---------- the full practice page ---------- */
  function mountApp(el) {
    GX.data.load('items').then(function (data) {
      var lessons = Object.keys(GX.LESSON_TITLES);
      var conceptsByLesson = {};
      data.items.forEach(function (it) {
        if (it.kind === 'recall') return;
        conceptsByLesson[it.lesson] = conceptsByLesson[it.lesson] || [];
        it.concepts.forEach(function (c) {
          if (conceptsByLesson[it.lesson].indexOf(c) < 0) conceptsByLesson[it.lesson].push(c);
        });
      });

      var state = { mode: 'mixed', lessons: lessons.slice(), focusLesson: '01', concepts: [], count: 5 };

      el.innerHTML =
        '<div class="panel-card">' +
        '  <div class="panel-label">Mode</div>' +
        '  <div class="pill-row" id="pa-mode" style="margin:10px 0 16px;">' +
        '    <button type="button" class="pill-btn active" data-mode="mixed" aria-pressed="true">Mixed review (recommended)</button>' +
        '    <button type="button" class="pill-btn" data-mode="focus" aria-pressed="false">Focus on one lesson</button>' +
        '  </div>' +
        '  <div class="filter-hint" id="pa-modehint" style="margin:-8px 0 14px;">Mixed review shuffles concepts together — harder in the moment, better for remembering. It’s how the research says to practice.</div>' +
        '  <div class="panel-label" id="pa-lessons-label">Lessons</div>' +
        '  <div class="pill-row" id="pa-lessons" style="margin:10px 0 6px;"></div>' +
        '  <div id="pa-concepts-wrap" style="display:none;">' +
        '    <div class="panel-label" style="margin-top:10px;">Narrow to a concept (optional)</div>' +
        '    <div class="pill-row" id="pa-concepts" style="margin-top:10px;"></div>' +
        '  </div>' +
        '  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:16px;">' +
        '    <label for="pa-count" style="font-size:0.85rem;font-weight:600;color:var(--dimtext);">How many questions?</label>' +
        '    <select id="pa-count" style="font:inherit;padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);">' +
        '      <option value="3">3</option><option value="5" selected>5</option><option value="10">10</option>' +
        '    </select>' +
        '    <button type="button" class="start-btn" id="pa-start" style="margin-top:0;">Start Practice</button>' +
        '  </div>' +
        '</div>' +
        '<div id="pa-run"><div class="filter-hint">Pick your setup above, then hit <strong>Start Practice</strong>. Expect a blend of identifying moves in real sentences and building sentences of your own.</div></div>';

      var $ = function (id) { return el.querySelector('#' + id); };

      function renderLessons() {
        var multi = state.mode === 'mixed';
        $('pa-lessons-label').textContent = multi ? 'Lessons to weave together' : 'Lesson';
        $('pa-lessons').innerHTML = lessons.map(function (l) {
          var on = multi ? state.lessons.indexOf(l) >= 0 : state.focusLesson === l;
          return '<button type="button" class="pill-btn' + (on ? ' active' : '') + '" data-l="' + l + '" aria-pressed="' + on + '">' + l + ' · ' + esc(GX.LESSON_TITLES[l]) + '</button>';
        }).join('');
        $('pa-lessons').querySelectorAll('button').forEach(function (b) {
          b.addEventListener('click', function () {
            var l = b.getAttribute('data-l');
            if (multi) {
              var i = state.lessons.indexOf(l);
              if (i >= 0) { if (state.lessons.length > 1) state.lessons.splice(i, 1); }
              else state.lessons.push(l);
            } else {
              state.focusLesson = l;
              state.concepts = [];
            }
            renderLessons(); renderConcepts();
          });
        });
      }

      function renderConcepts() {
        var wrap = $('pa-concepts-wrap');
        if (state.mode !== 'focus') { wrap.style.display = 'none'; return; }
        wrap.style.display = '';
        var cs = conceptsByLesson[state.focusLesson] || [];
        $('pa-concepts').innerHTML = cs.map(function (c) {
          var on = state.concepts.indexOf(c) >= 0;
          return '<button type="button" class="pill-btn' + (on ? ' active' : '') + '" data-c="' + c + '" aria-pressed="' + on + '">' + esc(GX.util.titleCase(c.replace(/-/g, ' '))) + '</button>';
        }).join('') || '<span class="filter-hint">No items for this lesson yet.</span>';
        $('pa-concepts').querySelectorAll('button').forEach(function (b) {
          b.addEventListener('click', function () {
            var c = b.getAttribute('data-c');
            var i = state.concepts.indexOf(c);
            if (i >= 0) state.concepts.splice(i, 1); else state.concepts.push(c);
            renderConcepts();
          });
        });
      }

      $('pa-mode').querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          state.mode = b.getAttribute('data-mode');
          $('pa-mode').querySelectorAll('button').forEach(function (x) {
            var on = x === b;
            x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on));
          });
          $('pa-modehint').textContent = state.mode === 'mixed'
            ? 'Mixed review shuffles concepts together — harder in the moment, better for remembering. It’s how the research says to practice.'
            : 'Focus mode drills one lesson. Good right after studying it; switch to mixed review to make it stick.';
          renderLessons(); renderConcepts();
        });
      });

      $('pa-start').addEventListener('click', function () {
        var opts = { count: parseInt($('pa-count').value, 10) };
        if (state.mode === 'mixed') opts.lessons = state.lessons.slice();
        else {
          opts.lessons = [state.focusLesson];
          if (state.concepts.length) opts.concepts = state.concepts.slice();
        }
        GX.Quiz.start($('pa-run'), opts);
        $('pa-run').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      renderLessons();
      renderConcepts();
    }).catch(function (err) { GX.fail(el, err); });
  }
})();
