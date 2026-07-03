/* cards.js — expandable reference cards (the "Name" layer) and the glossary.
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
        openFromHash(el);
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
    el.innerHTML = '<div class="concepts-grid">' + cards.map(function (c) {
      return '<div class="concept-card" data-concept="' + esc(c.concept) + '" id="card-' + esc(c.id) + '">' +
        '<button type="button" class="concept-card-toggle" aria-expanded="false" aria-controls="card-' + esc(c.id) + '-detail">' +
        '  <span class="expand-icon" aria-hidden="true">+</span>' +
        '  <h3>' + esc(c.term) + '</h3>' +
        '  <div class="short-def">' + esc(c.short) + '</div>' +
        '</button>' +
        '<div class="concept-detail" id="card-' + esc(c.id) + '-detail"><div class="concept-detail-inner">' + c.detail + '</div></div>' +
        '</div>';
    }).join('') + '</div>';

    el.querySelectorAll('.concept-card-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.concept-card');
        var wasOpen = card.classList.contains('open');
        el.querySelectorAll('.concept-card').forEach(function (c) {
          c.classList.remove('open');
          c.querySelector('.concept-card-toggle').setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          card.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* Deep links: visiting page.html#card-gerund opens and scrolls to that card. */
  function openFromHash(el) {
    var h = window.location.hash;
    if (!h || h.indexOf('#card-') !== 0) return;
    var card = el.querySelector(h.replace(/[^#\w-]/g, ''));
    if (!card) return;
    card.classList.add('open');
    var btn = card.querySelector('.concept-card-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    setTimeout(function () { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
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
