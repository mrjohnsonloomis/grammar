/* main.js — bootstrap: shared utilities, data loader, component mounting. */
(function () {
  'use strict';
  window.GX = window.GX || {};

  GX.ROOT = window.GX_ROOT || '.';

  GX.LESSON_URLS = {
    '01': 'lessons/01-sentence-kernel.html',
    '02': 'lessons/02-what-verbs-demand.html',
    '03': 'lessons/03-word-toolbox.html',
    '04': 'lessons/04-expanding-the-kernel.html',
    '05': 'lessons/05-compressing-with-verbals.html',
    '06': 'lessons/06-joining-ideas.html',
    '07': 'lessons/07-sentence-craft.html'
  };
  GX.LESSON_TITLES = {
    '01': 'The Sentence Kernel', '02': 'What Verbs Demand', '03': 'The Word Toolbox',
    '04': 'Expanding the Kernel', '05': 'Compressing with Verbals',
    '06': 'Joining Ideas', '07': 'Sentence Craft'
  };
  GX.lessonUrl = function (num) { return GX.ROOT + '/' + (GX.LESSON_URLS[num] || 'index.html'); };

  GX.util = {
    esc: function (s) {
      if (typeof s !== 'string') return String(s);
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    shuffle: function (arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },
    titleCase: function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  };

  var cache = {};
  GX.data = {
    /* load("passages") -> /data/sentences/passages.json; load("writing/demo") -> /data/writing/demo.json */
    load: function (name) {
      var path = name.indexOf('/') >= 0 ? GX.ROOT + '/data/' + name + '.json'
                                        : GX.ROOT + '/data/sentences/' + name + '.json';
      /* per-deploy cache-bust, matching the layout's asset stamping */
      if (window.GX_V) path += '?v=' + window.GX_V;
      if (!cache[path]) {
        cache[path] = fetch(path).then(function (r) {
          if (!r.ok) throw new Error('Failed to load ' + path + ' (' + r.status + ')');
          return r.json();
        });
      }
      return cache[path];
    }
  };

  GX.fail = function (el, err) {
    el.innerHTML = '<div class="practice-widget"><div class="practice-error">Couldn’t load this activity.<br><small>' +
      GX.util.esc(err && err.message ? err.message : String(err)) + '</small></div></div>';
  };

  function mountAll() {
    document.querySelectorAll('[data-component]').forEach(function (el) {
      var kind = el.getAttribute('data-component');
      try {
        if (kind === 'highlighter' && GX.Highlighter) GX.Highlighter.mount(el);
        else if (kind === 'tour' && GX.Tour) GX.Tour.mount(el);
        else if (kind === 'compare' && GX.Compare) GX.Compare.mount(el);
        else if (kind === 'builder' && GX.Builder) GX.Builder.mount(el);
        else if (kind === 'cards' && GX.Cards) GX.Cards.mount(el);
        else if (kind === 'glossary' && GX.Cards) GX.Cards.mountGlossary(el);
        else if (kind === 'construct' && GX.Construct) GX.Construct.mount(el);
        else if (kind === 'recall' && GX.Recall) GX.Recall.mount(el);
        else if (kind === 'stages' && GX.Stages) GX.Stages.mount(el);
        else if (kind === 'studio' && GX.Studio) GX.Studio.mount(el);
        else if (kind === 'oipad' && GX.OIPad) GX.OIPad.mount(el);
        else if (kind === 'freewrite' && GX.FreeWrite) GX.FreeWrite.mount(el);
        else if (kind === 'quiz' && GX.Quiz) GX.Quiz.mount(el);
        else if (kind === 'practice-app' && GX.Quiz) GX.Quiz.mountApp(el);
      } catch (err) { GX.fail(el, err); }
    });
  }

  /* ---- arc wayfinding: build a sticky Notice/Name/Build/Apply nav from the
     page's arc-label markers (plus the Check Yourself section) ---- */
  function buildArcNav() {
    var slot = document.getElementById('arcNavSlot');
    if (!slot) return;
    var marks = [];
    document.querySelectorAll('.arc-label').forEach(function (el, i) {
      var id = 'arc-' + el.textContent.trim().toLowerCase().replace(/[^a-z]+/g, '-');
      if (!el.id) el.id = id + (document.getElementById(id) ? '-' + i : '');
      marks.push({ id: el.id, label: el.textContent.trim() });
    });
    document.querySelectorAll('.section-title').forEach(function (el) {
      if (/^check yourself$/i.test(el.textContent.trim()) && marks.length) {
        if (!el.id) el.id = 'arc-check';
        marks.push({ id: el.id, label: 'Check' });
      }
    });
    if (marks.length < 2) return;
    var lesson = slot.getAttribute('data-lesson');
    slot.innerHTML = '<nav class="arc-nav" aria-label="Lesson sections"><div class="arc-nav-inner">' +
      marks.map(function (m) {
        return '<a href="#' + m.id + '">' + GX.util.esc(m.label) + '</a>';
      }).join('') +
      (lesson ? '<span class="arc-lesson">Lesson ' + GX.util.esc(lesson) + '</span>' : '') +
      '</div></nav>';

    var links = slot.querySelectorAll('a');
    if ('IntersectionObserver' in window) {
      var current = null;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) current = e.target.id;
        });
        if (current) {
          links.forEach(function (a) {
            a.classList.toggle('current', a.getAttribute('href') === '#' + current);
          });
        }
      }, { rootMargin: '-10% 0px -70% 0px' });
      marks.forEach(function (m) {
        var el = document.getElementById(m.id);
        if (el) io.observe(el);
      });
    }
  }

  /* ---- term look-up in the side rail (loads cards.json on first focus) ---- */
  function initSearch() {
    var input = document.getElementById('railSearch');
    var out = document.getElementById('railResults');
    if (!input || !out) return;
    var terms = null;
    function ensure() {
      if (terms) return Promise.resolve(terms);
      return GX.data.load('cards').then(function (data) {
        terms = [];
        data.groups.forEach(function (g) {
          g.cards.forEach(function (c) {
            if (c.glossary) terms.push({ term: c.term, short: c.short, id: c.id, lesson: c.lesson });
          });
        });
        return terms;
      });
    }
    input.addEventListener('focus', function () { ensure(); });
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { out.innerHTML = ''; return; }
      ensure().then(function (ts) {
        var hits = ts.filter(function (t) {
          return t.term.toLowerCase().indexOf(q) >= 0 || t.short.toLowerCase().indexOf(q) >= 0;
        }).slice(0, 7);
        out.innerHTML = hits.length
          ? hits.map(function (t) {
              return '<a href="' + GX.lessonUrl(t.lesson) + '#card-' + t.id + '"><b>' + GX.util.esc(t.term) + '</b> <small>· Lesson ' + t.lesson + '</small></a>';
            }).join('')
          : '<span class="none">No term matches “' + GX.util.esc(input.value.trim()) + '” — try the glossary.</span>';
      });
    });
  }

  /* ---- term peek: hovering/focusing any term link previews its card in
     place (hover-capable devices only; taps still navigate) ---- */
  function initTermPeek() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    var pop = null;
    var hideTimer = null;

    function ensurePop() {
      if (pop) return pop;
      pop = document.createElement('div');
      pop.className = 'term-peek';
      pop.setAttribute('role', 'status');
      pop.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
      pop.addEventListener('mouseleave', scheduleHide);
      document.body.appendChild(pop);
      return pop;
    }
    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { if (pop) pop.classList.remove('show'); }, 220);
    }
    function show(link) {
      var m = (link.getAttribute('href') || '').match(/#card-([\w-]+)/);
      if (!m) return;
      GX.data.load('cards').then(function (data) {
        var card = null;
        data.groups.some(function (g) {
          card = g.cards.find(function (c) { return c.id === m[1]; });
          return !!card;
        });
        if (!card) return;
        var el = ensurePop();
        clearTimeout(hideTimer);
        el.innerHTML =
          '<span class="term-peek-term">' + GX.util.esc(card.term) + '</span>' +
          '<span class="term-peek-short">' + GX.util.esc(card.short) + '</span>' +
          '<span class="term-peek-go">Click through for the full entry →</span>';
        var r = link.getBoundingClientRect();
        el.style.left = Math.max(10, Math.min(r.left, window.innerWidth - 320)) + 'px';
        el.style.top = (r.bottom + 8) + 'px';
        el.classList.add('show');
      }).catch(function () {});
    }

    document.addEventListener('mouseover', function (e) {
      var link = e.target.closest && e.target.closest('a.term[href*="#card-"], .prose a[href*="#card-"]');
      if (link) show(link);
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest('a[href*="#card-"]')) scheduleHide();
    });
    document.addEventListener('focusin', function (e) {
      var link = e.target.closest && e.target.closest('a.term[href*="#card-"]');
      if (link) show(link); else scheduleHide();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && pop) pop.classList.remove('show');
    });
    window.addEventListener('scroll', function () { if (pop) pop.classList.remove('show'); }, { passive: true });
  }

  function boot() { mountAll(); buildArcNav(); initSearch(); initTermPeek(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
