/* tour.js — step-based chunk tours and two-column compares.
   Mounts:
     <div data-component="tour" data-tour="verbal-types" data-label="Tour: Verbal Types"></div>
     <div data-component="compare" data-compare="trap-running,trap-cooking" data-label="The Trap"></div>
   Data: /data/sentences/tours.json (see SCHEMA.md). */
(function () {
  'use strict';
  window.GX = window.GX || {};
  var esc = function (s) { return GX.util.esc(s); };

  /* ---------- shared chunk renderer ---------- */
  function chunkHtml(chunks) {
    return chunks.map(function (c, i) {
      var attrs = '';
      if (c.verbal) attrs += ' data-verbal="' + c.verbal + '"';
      if (c.structure) attrs += ' data-structure="' + c.structure + '"';
      if (c.func) attrs += ' data-func="' + c.func + '"';
      if (c.role) attrs += ' data-role="' + c.role + '"';
      if (c.id) attrs += ' data-id="' + c.id + '"';
      var tag = c.tag ? '<span class="role-tag">' + esc(c.tag) + '</span>' : '';
      var style = ' style="animation-delay:' + (i * 0.06) + 's"';
      if (c.clickable) {
        return '<button type="button" class="word-chunk"' + attrs + style + ' aria-label="' + esc(c.text) + ' — show explanation">' + tag + esc(c.text) + '</button>';
      }
      return '<div class="word-chunk"' + attrs + style + '>' + tag + esc(c.text) + '</div>';
    }).join(' ');
  }

  GX.Tour = {
    mount: function (el) {
      var id = el.getAttribute('data-tour');
      GX.data.load('tours').then(function (data) {
        var tour = data.tours.find(function (t) { return t.id === id; });
        if (!tour) throw new Error('Unknown tour id: ' + id);
        initTour(el, tour);
      }).catch(function (err) { GX.fail(el, err); });
    }
  };

  function initTour(el, tour) {
    var uid = 't' + Math.random().toString(36).slice(2, 7);
    var state = { set: 0, step: 0 };
    var label = el.getAttribute('data-label') || 'Tour';
    var prompt = el.getAttribute('data-prompt') || 'Click any outlined chunk above to see what it is and how it’s working.';
    var multiSet = tour.sets.length > 1;

    el.innerHTML =
      '<div class="panel-card">' +
      '  <div class="panel-top-bar"><div class="panel-label">' + esc(label) + '</div>' +
      (multiSet ? '  <button type="button" class="pill-btn" id="' + uid + '-shuffle">↻ New Example</button>' : '') +
      '  </div>' +
      '  <div class="build-steps" id="' + uid + '-steps" role="group" aria-label="Steps"></div>' +
      '  <div class="stype-formula" id="' + uid + '-formula" style="display:none;"></div>' +
      '  <div class="build-narrative" id="' + uid + '-narrative"></div>' +
      '  <div class="sentence-display" id="' + uid + '-display"></div>' +
      '  <div class="callout" id="' + uid + '-callout" aria-live="polite"></div>' +
      '</div>';

    var $ = function (s) { return el.querySelector('#' + uid + '-' + s); };

    function steps() { return tour.sets[state.set].steps; }

    function renderSteps() {
      $('steps').innerHTML = steps().map(function (s, i) {
        return (i > 0 ? '<span class="step-arrow" aria-hidden="true">·</span>' : '') +
          '<button type="button" class="pill-btn' + (i === state.step ? ' active' : '') + '" data-i="' + i + '" aria-pressed="' + (i === state.step) + '">' + esc(s.label) + '</button>';
      }).join('');
      $('steps').querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          state.step = parseInt(b.getAttribute('data-i'), 10);
          renderSteps(); renderStep();
        });
      });
    }

    function renderStep() {
      var step = steps()[state.step];
      var f = $('formula');
      if (step.formula) { f.style.display = ''; f.innerHTML = step.formula; }
      else f.style.display = 'none';
      $('narrative').innerHTML = step.narrative || '';
      $('display').innerHTML = chunkHtml(step.chunks);
      $('display').querySelectorAll('button.word-chunk').forEach(function (b) {
        b.addEventListener('click', function () { explain(b.getAttribute('data-id'), b); });
      });
      resetCallout();
      var anyClickable = step.chunks.some(function (c) { return c.clickable; });
      $('callout').style.display = anyClickable ? '' : 'none';
    }

    function explain(id, btn) {
      var step = steps()[state.step];
      var ex = step.explanations && step.explanations[id];
      if (!ex) return;
      el.querySelectorAll('.word-chunk').forEach(function (c) { c.classList.remove('active'); });
      el.querySelectorAll('.word-chunk[data-id="' + id + '"]').forEach(function (c) { c.classList.add('active'); });
      var c = $('callout');
      c.setAttribute('data-active', ex.concept || 'clause');
      c.classList.add('visible');
      c.innerHTML =
        '<div class="callout-meta">' +
        '  <span class="chip" data-concept="' + (ex.concept || '') + '">' + esc(ex.type) + '</span>' +
        (ex.func ? '  <span class="chip">Acts as: ' + esc(ex.func) + '</span>' : '') +
        '</div><div class="callout-body">' + ex.body + '</div>';
    }

    function resetCallout() {
      var c = $('callout');
      c.removeAttribute('data-active');
      c.classList.remove('visible');
      c.innerHTML = '<div class="callout-prompt">' + esc(prompt) + '</div>';
    }

    if (multiSet) {
      $('shuffle').addEventListener('click', function () {
        state.set = (state.set + 1) % tour.sets.length;
        renderSteps(); renderStep();
      });
    }

    renderSteps();
    renderStep();
  }

  /* ---------- compares ---------- */
  GX.Compare = {
    mount: function (el) {
      var ids = (el.getAttribute('data-compare') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      GX.data.load('tours').then(function (data) {
        var items = ids.map(function (id) {
          var c = data.compares.find(function (x) { return x.id === id; });
          if (!c) throw new Error('Unknown compare id: ' + id);
          return c;
        });
        initCompare(el, items);
      }).catch(function (err) { GX.fail(el, err); });
    }
  };

  function sentenceHtml(frags) {
    return frags.map(function (f) {
      if (typeof f === 'string') return esc(f);
      if (f && f.m) return '<span class="marked">' + esc(f.m) + '</span>';
      return '';
    }).join('');
  }

  function initCompare(el, items) {
    var uid = 'c' + Math.random().toString(36).slice(2, 7);
    var state = { idx: 0 };
    var label = el.getAttribute('data-label') || 'Compare';

    el.innerHTML =
      '<div class="panel-card">' +
      '  <div class="panel-top-bar"><div class="panel-label">' + esc(label) + '</div></div>' +
      (items.length > 1 ? '<div class="pill-row" id="' + uid + '-nav" role="group" aria-label="Choose an example"></div>' : '') +
      '  <div id="' + uid + '-body" aria-live="polite"></div>' +
      '</div>';

    var $ = function (s) { return el.querySelector('#' + uid + '-' + s); };

    function renderNav() {
      var nav = $('nav');
      if (!nav) return;
      nav.innerHTML = items.map(function (t, i) {
        return '<button type="button" class="pill-btn' + (i === state.idx ? ' active' : '') + '" data-i="' + i + '" aria-pressed="' + (i === state.idx) + '">' + esc(t.label) + '</button>';
      }).join('');
      nav.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          state.idx = parseInt(b.getAttribute('data-i'), 10);
          renderNav(); renderBody();
        });
      });
    }

    function renderBody() {
      var t = items[state.idx];
      $('body').innerHTML =
        '<div class="compare-grid">' +
        '  <div class="compare-pair a"><div class="compare-pair-label">' + esc(t.a.label) + '</div>' +
        '    <div class="compare-sentence">' + sentenceHtml(t.a.sentence) + '</div>' +
        '    <div class="compare-why">' + t.a.why + '</div></div>' +
        '  <div class="compare-pair b"><div class="compare-pair-label">' + esc(t.b.label) + '</div>' +
        '    <div class="compare-sentence">' + sentenceHtml(t.b.sentence) + '</div>' +
        '    <div class="compare-why">' + t.b.why + '</div></div>' +
        '</div>' +
        '<div class="compare-test-box">' + t.test + '</div>';
    }

    renderNav();
    renderBody();
  }
})();
