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
        else if (kind === 'quiz' && GX.Quiz) GX.Quiz.mount(el);
        else if (kind === 'practice-app' && GX.Quiz) GX.Quiz.mountApp(el);
      } catch (err) { GX.fail(el, err); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
