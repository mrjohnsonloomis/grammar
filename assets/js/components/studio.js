/* studio.js — the Annotation Studio: students paste their own draft and mark
   it up with the five job colors and structure brackets. Everything lives in
   memory only; printing goes through the browser. Nothing is ever saved.
   Mount: <div data-component="studio"></div> */
(function () {
  'use strict';
  window.GX = window.GX || {};
  var esc = function (s) { return GX.util.esc(s); };

  var JOBS = [
    { id: 'name', label: 'Names', q: 'who? what?' },
    { id: 'act', label: 'Acts', q: 'does? is?' },
    { id: 'desc', label: 'Describes', q: 'which? what kind?' },
    { id: 'sit', label: 'Situates', q: 'when? where? why?' },
    { id: 'con', label: 'Connects', q: 'joined how?' }
  ];
  var BRACKETS = [
    { id: 'phrase', label: 'Phrase bracket' },
    { id: 'clause-ind', label: 'Independent clause' },
    { id: 'clause', label: 'Dependent clause' }
  ];
  var SAMPLE = 'The fire alarm went off during first period. Because nobody knew it was a drill, we lined up outside in the rain, getting soaked. Class was ruined.';

  GX.Studio = {
    mount: function (el) {
      var state = { words: [], jobs: {}, brackets: [], tool: 'name', pendingFrom: null };

      el.innerHTML =
        '<div class="studio-entry">' +
        '  <label class="panel-label" for="studioIn" style="display:block;margin-bottom:8px;">Paste or type a draft — a sentence, a paragraph, an intro from your essay</label>' +
        '  <textarea id="studioIn" class="construct-scratch" style="min-height:110px;" aria-label="Your draft (never saved)"></textarea>' +
        '  <div class="construct-worknote">Nothing you type here is saved or sent anywhere — close the tab and it’s gone. Print your markup before you leave if you want to keep it.</div>' +
        '  <div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '    <button type="button" class="reveal-btn" id="studioGo" style="margin-top:10px;">Mark it up</button>' +
        '    <button type="button" class="reveal-btn ghost" id="studioSample" style="margin-top:10px;">Try a sample</button>' +
        '  </div>' +
        '</div>' +
        '<div class="studio-work" id="studioWork" hidden>' +
        '  <div class="panel-label" style="margin:26px 0 10px;">Pick a tool, then click words. For brackets: click the first word, then the last.</div>' +
        '  <div class="pill-row" role="group" aria-label="Marking tools" id="studioTools">' +
             JOBS.map(function (j) {
               return '<button type="button" class="pill-btn" data-tool="' + j.id + '" aria-pressed="false" title="' + esc(j.q) + '"><span class="dot" style="background:var(--' + j.id + ')" aria-hidden="true"></span>' + j.label + '</button>';
             }).join('') +
        '    <span class="legend-divider" aria-hidden="true"></span>' +
             BRACKETS.map(function (b) {
               return '<button type="button" class="pill-btn" data-tool="' + b.id + '" aria-pressed="false"><span class="dot" style="background:var(--structure)" aria-hidden="true"></span>' + b.label + '</button>';
             }).join('') +
        '    <span class="legend-divider" aria-hidden="true"></span>' +
        '    <button type="button" class="pill-btn" data-tool="erase" aria-pressed="false">Eraser</button>' +
        '  </div>' +
        '  <div class="filter-hint" id="studioHint"></div>' +
        '  <div class="studio-text passage-text structured" id="studioText" style="margin-top:14px;"></div>' +
        '  <div class="pill-row" style="margin-top:20px;">' +
        '    <button type="button" class="pill-btn" id="studioPrint">Print / save as PDF</button>' +
        '    <button type="button" class="pill-btn" id="studioReset">Start over</button>' +
        '  </div>' +
        '</div>';

      var $ = function (id) { return el.querySelector('#' + id); };

      function begin(text) {
        state.words = text.trim().split(/\s+/).filter(Boolean);
        if (!state.words.length) return;
        state.jobs = {}; state.brackets = []; state.pendingFrom = null;
        $('studioWork').hidden = false;
        setTool('name');
        render();
        $('studioWork').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      function setTool(t) {
        state.tool = t;
        state.pendingFrom = null;
        el.querySelectorAll('#studioTools .pill-btn').forEach(function (b) {
          var on = b.getAttribute('data-tool') === t;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        hint();
      }

      function hint(msg) {
        var j = JOBS.find(function (x) { return x.id === state.tool; });
        $('studioHint').textContent = msg ||
          (j ? 'Click words that ' + j.label.toLowerCase() + ' — ' + j.q + ' Click again to unmark.'
             : state.tool === 'erase' ? 'Click a marked word to clear it; click inside a bracket to remove the bracket.'
             : 'Click the FIRST word of the ' + state.tool.replace('clause-ind', 'independent clause').replace('clause', 'dependent clause').replace('phrase', 'phrase') + ', then the LAST word.');
      }

      function properNesting(from, to) {
        return state.brackets.every(function (b) {
          var disjoint = b.to < from || to < b.from;
          var contains = from <= b.from && b.to <= to;
          var inside = b.from <= from && to <= b.to;
          return disjoint || contains || inside;
        });
      }

      function render() {
        var opens = {}, closes = {};
        state.brackets.forEach(function (b) {
          (opens[b.from] = opens[b.from] || []).push(b);
          (closes[b.to] = closes[b.to] || []).push(b);
        });
        Object.keys(opens).forEach(function (k) { opens[k].sort(function (a, b) { return b.to - a.to; }); });

        var html = '';
        state.words.forEach(function (w, i) {
          if (i > 0) html += ' ';
          (opens[i] || []).forEach(function (b) {
            html += '<span class="sspan" data-structure="' + b.structure + '">';
          });
          var j = state.jobs[i];
          html += '<button type="button" class="st-w' + (i === state.pendingFrom ? ' pending' : '') + '"' +
            (j ? ' data-j="' + j + '"' : '') + ' data-i="' + i + '">' + esc(w) + '</button>';
          (closes[i] || []).forEach(function () { html += '</span>'; });
        });
        $('studioText').innerHTML = html;
        $('studioText').querySelectorAll('.st-w').forEach(function (b) {
          b.addEventListener('click', function () { tap(parseInt(b.getAttribute('data-i'), 10)); });
        });
      }

      function tap(i) {
        var t = state.tool;
        if (t === 'erase') {
          if (state.jobs[i]) delete state.jobs[i];
          else {
            var hit = state.brackets.findIndex(function (b) { return b.from <= i && i <= b.to; });
            if (hit >= 0) state.brackets.splice(hit, 1);
          }
          render(); return;
        }
        if (t === 'phrase' || t === 'clause' || t === 'clause-ind') {
          if (state.pendingFrom === null) {
            state.pendingFrom = i;
            hint('First word set — now click the LAST word of the span.');
            render(); return;
          }
          var from = Math.min(state.pendingFrom, i), to = Math.max(state.pendingFrom, i);
          state.pendingFrom = null;
          if (!properNesting(from, to)) {
            hint('That span crosses an existing bracket. Brackets must nest inside each other or stay separate — erase one first.');
            render(); return;
          }
          state.brackets.push({ from: from, to: to, structure: t });
          hint();
          render(); return;
        }
        /* job tools: toggle */
        if (state.jobs[i] === t) delete state.jobs[i];
        else state.jobs[i] = t;
        render();
      }

      $('studioGo').addEventListener('click', function () { begin($('studioIn').value); });
      $('studioSample').addEventListener('click', function () { $('studioIn').value = SAMPLE; begin(SAMPLE); });
      $('studioReset').addEventListener('click', function () {
        state.jobs = {}; state.brackets = []; state.pendingFrom = null; render(); hint();
      });
      $('studioPrint').addEventListener('click', function () { window.print(); });
      el.querySelectorAll('#studioTools .pill-btn').forEach(function (b) {
        b.addEventListener('click', function () { setTool(b.getAttribute('data-tool')); });
      });
    }
  };
})();
