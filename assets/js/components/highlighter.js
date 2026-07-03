/* highlighter.js — click-to-explain passage highlighting ("reading like a writer").
   Mount: <div data-component="highlighter" data-passages="id1,id2"></div>
   Data: /data/sentences/passages.json (see SCHEMA.md). */
(function () {
  'use strict';
  window.GX = window.GX || {};

  var POS = ['noun', 'pronoun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'interjection'];
  var POS_LABEL = {
    noun: 'Nouns', pronoun: 'Pronouns', verb: 'Verbs', adjective: 'Adjectives',
    adverb: 'Adverbs', preposition: 'Prepositions', conjunction: 'Conjunctions', interjection: 'Interjections'
  };

  GX.Highlighter = {
    mount: function (el) {
      var ids = (el.getAttribute('data-passages') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      GX.data.load('passages').then(function (data) {
        var passages = ids.length
          ? ids.map(function (id) {
              var p = data.passages.find(function (x) { return x.id === id; });
              if (!p) throw new Error('Unknown passage id: ' + id);
              return p;
            })
          : data.passages;
        init(el, passages);
      }).catch(function (err) { GX.fail(el, err); });
    }
  };

  function init(el, passages) {
    var esc = GX.util.esc;
    var state = { passage: 0, filter: 'all', selected: null };
    var uid = 'hl' + Math.random().toString(36).slice(2, 7);

    el.innerHTML =
      '<div class="hl-filter">' +
      '  <div class="panel-label">Highlight a part of speech</div>' +
      '  <div class="pill-row" role="group" aria-label="Highlight a part of speech" style="margin-top:10px;">' +
      '    <button type="button" class="pill-btn active" data-concept="all" aria-pressed="true"><span class="dot" aria-hidden="true"></span>Show All</button>' +
           POS.map(function (p) {
             return '<button type="button" class="pill-btn" data-concept="' + p + '" aria-pressed="false"><span class="dot" aria-hidden="true"></span>' + POS_LABEL[p] + '</button>';
           }).join('') +
      '  </div>' +
      '  <div class="filter-hint" id="' + uid + '-hint">Pick a category to light up its words — then click any word to see the job it’s doing and why the author chose it.</div>' +
      '</div>' +
      '<div class="pill-row" id="' + uid + '-switch" role="group" aria-label="Choose a passage"></div>' +
      '<div class="hl-study">' +
      '  <div class="hl-passage-col">' +
      '    <div class="passage-top"><div class="passage-title" id="' + uid + '-title"></div><div class="passage-meta" id="' + uid + '-meta"></div></div>' +
      '    <div class="passage-text" id="' + uid + '-text"></div>' +
      '    <div class="passage-attribution" id="' + uid + '-attr"></div>' +
      '  </div>' +
      '  <aside class="hl-margin">' +
      '    <div class="callout" id="' + uid + '-callout" aria-live="polite"></div>' +
      '  </aside>' +
      '</div>';

    var $ = function (suffix) { return el.querySelector('#' + uid + '-' + suffix); };
    var filterBtns = el.querySelectorAll('.pill-btn[data-concept]');

    function renderSwitcher() {
      var sw = $('switch');
      if (passages.length < 2) { sw.style.display = 'none'; return; }
      sw.innerHTML = passages.map(function (p, i) {
        return '<button type="button" class="pill-btn' + (i === state.passage ? ' active' : '') + '" data-idx="' + i + '" aria-pressed="' + (i === state.passage) + '">' + esc(p.title) + '</button>';
      }).join('');
      sw.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          state.passage = parseInt(b.getAttribute('data-idx'), 10);
          state.selected = null;
          renderSwitcher(); renderPassage(); resetCallout();
        });
      });
    }

    function renderPassage() {
      var p = passages[state.passage];
      $('title').textContent = p.title;
      $('meta').textContent = p.meta;
      $('attr').innerHTML = p.attribution ? 'Source: ' + p.attribution : '';

      var html = '';
      p.tokens.forEach(function (tok, i) {
        if (tok.br) { html += '<span class="line-break" aria-hidden="true"></span>'; return; }
        var prev = p.tokens[i - 1];
        var needSpace = i > 0 && !tok.punct && !tok.glue && !(prev && prev.br);
        if (needSpace) html += ' ';
        if (tok.punct || !tok.tag) { html += '<span class="token punct">' + esc(tok.t) + '</span>'; return; }
        var clickable = tok.craft || tok.role;
        if (clickable) {
          html += '<button type="button" class="token word" data-idx="' + i + '" data-concept="' + tok.tag + '" aria-label="' + esc(tok.t) + ' — show explanation">' + esc(tok.t) + '</button>';
        } else {
          html += '<span class="token word" data-idx="' + i + '" data-concept="' + tok.tag + '">' + esc(tok.t) + '</span>';
        }
      });

      var textEl = $('text');
      textEl.className = 'passage-text' + (p.type === 'poetic' ? ' poetry' : '');
      textEl.innerHTML = html;
      textEl.querySelectorAll('button.token').forEach(function (b) {
        b.addEventListener('click', function () { selectToken(parseInt(b.getAttribute('data-idx'), 10)); });
      });
      applyFilter();
    }

    function applyFilter() {
      var textEl = $('text');
      var words = textEl.querySelectorAll('.token.word');
      var count = 0;
      if (state.filter === 'all') {
        textEl.classList.remove('filtered');
        words.forEach(function (w) { w.classList.remove('highlight'); });
      } else {
        textEl.classList.add('filtered');
        words.forEach(function (w) {
          if (w.getAttribute('data-concept') === state.filter) { w.classList.add('highlight'); count++; }
          else w.classList.remove('highlight');
        });
      }
      var hint = $('hint');
      if (state.filter === 'all') {
        hint.innerHTML = 'Pick a category to light up its words — then click any word to see the job it’s doing and why the author chose it.';
      } else {
        hint.innerHTML = '<strong>' + count + '</strong> ' + POS_LABEL[state.filter].toLowerCase() +
          (state.filter === 'adjective' ? ' (including articles)' : '') +
          ' highlighted in this passage. Click any word — highlighted or not — for its craft note and role.';
      }
    }

    function selectToken(idx) {
      var tok = passages[state.passage].tokens[idx];
      if (!tok || (!tok.craft && !tok.role)) return;
      state.selected = idx;
      el.querySelectorAll('.token').forEach(function (t) { t.classList.remove('selected'); });
      var btn = el.querySelector('.token[data-idx="' + idx + '"]');
      if (btn) btn.classList.add('selected');
      showCallout(tok);
    }

    function showCallout(tok) {
      var c = $('callout');
      c.setAttribute('data-active', tok.tag);
      c.classList.add('visible');
      var label = GX.util.titleCase(tok.tag) + (tok.subtype ? ' · ' + tok.subtype : '');
      var craft = tok.craft ? '<div class="callout-section craft"><span class="callout-section-label">Why this word?</span>' + tok.craft + '</div>' : '';
      var role = tok.role ? '<div class="callout-section"><span class="callout-section-label">In the sentence:</span>' + tok.role + '</div>' : '';
      c.innerHTML =
        '<div class="callout-header"><div class="callout-word">“' + GX.util.esc(tok.t.trim()) + '”</div>' +
        '<span class="chip" data-concept="' + tok.tag + '">' + GX.util.esc(label) + '</span></div>' + craft + role;
    }

    function resetCallout() {
      var c = $('callout');
      c.removeAttribute('data-active');
      c.classList.remove('visible');
      c.innerHTML = '<div class="callout-prompt">Pick a part of speech above, then click any word to see what it’s doing.</div>';
    }

    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.filter = b.getAttribute('data-concept');
        state.selected = null;
        filterBtns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle('active', on);
          x.setAttribute('aria-pressed', String(on));
        });
        applyFilter();
        resetCallout();
      });
    });

    renderSwitcher();
    renderPassage();
    resetCallout();
  }
})();
