/* cards.js — the lexicon (the "Name" layer) and the glossary.
   Reference terms render as a term rail + one reading pane (a book spread),
   not a grid of boxes. On phones the rail becomes a scrollable chip row.
   Mounts:
     <div data-component="cards" data-group="pos"></div>
     <div data-component="cards" data-group="demo" data-file="writing/demo"></div>
     <div data-component="glossary"></div>
   Data: /data/sentences/cards.json (or data-file override; see SCHEMA.md). */
(function () {
  'use strict';
  window.GX = window.GX || {};
  var esc = function (s) { return GX.util.esc(s); };

  GX.Cards = {
    mount: function (el) {
      var groupId = el.getAttribute('data-group');
      var file = el.getAttribute('data-file') || 'cards';
      GX.data.load(file).then(function (data) {
        var group = data.groups.find(function (g) { return g.id === groupId; });
        if (!group) throw new Error('Unknown card group: ' + groupId);
        render(el, group.cards);
      }).catch(function (err) { GX.fail(el, err); });
    },

    mountGlossary: function (el) {
      GX.data.load('cards').then(function (data) {
        var cards = [];
        data.groups.forEach(function (g) {
          g.cards.forEach(function (c) { if (c.glossary) cards.push(c); });
        });
        cards.sort(function (a, b) { return a.term.localeCompare(b.term); });
        renderGlossary(el, cards);
      }).catch(function (err) { GX.fail(el, err); });
    }
  };

  function render(el, cards) {
    var uid = 'lx' + Math.random().toString(36).slice(2, 7);
    var selected = 0;

    /* deep link: #card-<id> selects that term */
    var h = window.location.hash;
    if (h && h.indexOf('#card-') === 0) {
      var want = h.slice(6);
      var idx = cards.findIndex(function (c) { return c.id === want; });
      if (idx >= 0) selected = idx;
    }

    el.innerHTML =
      '<div class="lexicon">' +
      '  <div class="lex-rail" role="group" aria-label="Terms">' +
           cards.map(function (c, i) {
             return '<button type="button" class="lex-term" id="card-' + esc(c.id) + '" data-concept="' + esc(c.concept) + '" data-i="' + i + '" aria-pressed="false">' +
               '<span class="lex-dot" aria-hidden="true"></span>' + esc(c.term) + '</button>';
           }).join('') +
      '  </div>' +
      '  <div class="lex-pane" id="' + uid + '-pane" aria-live="polite"></div>' +
      '</div>';

    var terms = el.querySelectorAll('.lex-term');
    var pane = el.querySelector('#' + uid + '-pane');

    function select(i, focusPane) {
      selected = i;
      terms.forEach(function (t, ti) { t.setAttribute('aria-pressed', String(ti === i)); });
      var c = cards[i];
      pane.innerHTML =
        '<div class="lex-entry-head">' +
        '  <span class="lex-entry-term">' + esc(c.term) + '</span>' +
        '  <span class="chip" data-concept="' + esc(c.concept) + '">' + esc(conceptLabel(c.concept)) + '</span>' +
        '</div>' +
        '<div class="lex-entry-short">' + esc(c.short) + '</div>' +
        '<div class="lex-entry-body">' + c.detail + '</div>';
      if (focusPane) pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    terms.forEach(function (t) {
      t.addEventListener('click', function () {
        select(parseInt(t.getAttribute('data-i'), 10), window.innerWidth <= 700);
      });
    });

    select(selected, false);
    if (h && h.indexOf('#card-') === 0 && el.querySelector(h.replace(/[^#\w-]/g, ''))) {
      setTimeout(function () {
        el.querySelector(h.replace(/[^#\w-]/g, '')).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    }
  }

  function conceptLabel(c) {
    var jobs = {
      noun: 'names', pronoun: 'names', gerund: 'names',
      subject: 'names', do: 'names', io: 'names', pn: 'names',
      verb: 'acts', adjective: 'describes', participle: 'describes',
      pa: 'describes', oc: 'describes', complement: 'completes',
      adverb: 'situates', infinitive: 'flexible', modifier: 'situates',
      preposition: 'connects', conjunction: 'connects', interjection: 'stands apart',
      phrase: 'structure', clause: 'structure', sentence: 'structure', fragment: 'structure'
    };
    return jobs[c] || c;
  }

  function renderGlossary(el, cards) {
    var byLetter = {};
    cards.forEach(function (c) {
      var L = c.term.charAt(0).toUpperCase();
      (byLetter[L] = byLetter[L] || []).push(c);
    });
    var letters = Object.keys(byLetter).sort();

    el.innerHTML =
      '<div class="glossary-index">' + letters.map(function (L) {
        return '<a class="pill-btn" href="#g-' + L + '">' + L + '</a>';
      }).join('') + '</div>' +
      letters.map(function (L) {
        return '<div class="glossary-letter" id="g-' + L + '">' + L + '</div>' +
          byLetter[L].map(function (c) {
            var url = GX.lessonUrl(c.lesson) + '#card-' + c.id;
            return '<div class="glossary-entry">' +
              '<span class="glossary-term">' + esc(c.term) + '</span> — ' +
              '<span class="glossary-def">' + esc(c.short) + '</span> ' +
              '<a class="glossary-link term" href="' + url + '">Lesson ' + esc(c.lesson) + ' →</a>' +
              '</div>';
          }).join('');
      }).join('');
  }
})();
