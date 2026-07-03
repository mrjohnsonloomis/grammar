/* sentence-builder.js — the progressive build-a-sentence stepper.
   Mount: <div data-component="builder" data-builder="kernel-builder" data-label="Build a Sentence"></div>
   Data: /data/sentences/tours.json -> builders (see SCHEMA.md). */
(function () {
  'use strict';
  window.GX = window.GX || {};
  var esc = function (s) { return GX.util.esc(s); };

  GX.Builder = {
    mount: function (el) {
      var id = el.getAttribute('data-builder');
      GX.data.load('tours').then(function (data) {
        var builder = data.builders.find(function (b) { return b.id === id; });
        if (!builder) throw new Error('Unknown builder id: ' + id);
        init(el, builder);
      }).catch(function (err) { GX.fail(el, err); });
    }
  };

  function init(el, builder) {
    var uid = 'b' + Math.random().toString(36).slice(2, 7);
    var label = el.getAttribute('data-label') || 'Build a Sentence';
    var state = { set: 0, step: 0, used: [] };

    el.innerHTML =
      '<div class="panel-card">' +
      '  <div class="panel-top-bar"><div class="panel-label">' + esc(label) + '</div>' +
      (builder.sets.length > 1 ? '<button type="button" class="pill-btn" id="' + uid + '-shuffle">↻ Shuffle</button>' : '') +
      '  </div>' +
      '  <div class="build-steps" id="' + uid + '-steps" role="group" aria-label="Build steps"></div>' +
      '  <div class="build-narrative" id="' + uid + '-narrative"></div>' +
      '  <div class="sentence-display" id="' + uid + '-display"></div>' +
      '  <div class="callout" id="' + uid + '-callout" aria-live="polite"></div>' +
      '</div>';

    var $ = function (s) { return el.querySelector('#' + uid + '-' + s); };
    function set() { return builder.sets[state.set]; }

    function renderSteps() {
      $('steps').innerHTML = set().steps.map(function (s, i) {
        var cls = 'pill-btn';
        if (i === state.step) cls += ' active';
        else if (i < state.step) cls += ' reached';
        return (i > 0 ? '<span class="step-arrow" aria-hidden="true">→</span>' : '') +
          '<button type="button" class="' + cls + '" data-i="' + i + '" aria-pressed="' + (i === state.step) + '">' + esc(s.label) + '</button>';
      }).join('');
      $('steps').querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          state.step = parseInt(b.getAttribute('data-i'), 10);
          renderSteps(); renderSentence();
        });
      });
    }

    function renderSentence() {
      var step = set().steps[state.step];
      $('display').innerHTML = step.words.map(function (w, i) {
        return '<button type="button" class="word-chunk" data-role="' + w.role + '" data-i="' + i + '"' +
          ' style="animation-delay:' + (i * 0.06) + 's" aria-label="' + esc(w.text) + ' — ' + esc(w.tag) + '">' +
          '<span class="chunk-w">' + esc(w.text) + '</span><span class="role-tag">' + esc(w.tag) + '</span></button>';
      }).join('');
      $('narrative').innerHTML = step.narrative;
      $('display').querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { explain(parseInt(b.getAttribute('data-i'), 10), b); });
      });
      resetCallout();
    }

    function explain(i, btn) {
      var step = set().steps[state.step];
      var w = step.words[i];
      var ex = step.explanations && step.explanations[w.role];
      if (!ex) return;
      el.querySelectorAll('.word-chunk').forEach(function (c) { c.classList.remove('active'); });
      btn.classList.add('active');
      var c = $('callout');
      c.setAttribute('data-active', w.role);
      c.classList.add('visible');
      c.innerHTML = '<div class="callout-title">' + esc(ex[0]) + '</div><div class="callout-body">' + ex[1] + '</div>';
    }

    function resetCallout() {
      var c = $('callout');
      c.removeAttribute('data-active');
      c.classList.remove('visible');
      c.innerHTML = '<div class="callout-prompt">Click any colored chunk above to learn about its job in the sentence.</div>';
    }

    var shuffleBtn = $('shuffle');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', function () {
        state.used.push(state.set);
        if (state.used.length >= builder.sets.length) state.used = [];
        var avail = [];
        for (var i = 0; i < builder.sets.length; i++) {
          if (state.used.indexOf(i) < 0 && i !== state.set) avail.push(i);
        }
        if (!avail.length) avail = builder.sets.map(function (_, i) { return i; }).filter(function (i) { return i !== state.set; });
        state.set = avail[Math.floor(Math.random() * avail.length)];
        state.step = Math.min(state.step, set().steps.length - 1);
        renderSteps(); renderSentence();
      });
    }

    renderSteps();
    renderSentence();
  }
})();
