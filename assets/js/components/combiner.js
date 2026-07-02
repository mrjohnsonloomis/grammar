/* combiner.js — construction activities: combine, expand, imitate, revise
   (reveal-and-compare; nothing typed is ever saved), plus free-recall prompts.
   Mounts:
     <div data-component="construct" data-items="cmb-05-001,exp-04-002"></div>
     <div data-component="recall" data-item="rec-02-001"></div>
   Data: /data/sentences/items.json (see SCHEMA.md). */
(function () {
  'use strict';
  window.GX = window.GX || {};
  var esc = function (s) { return GX.util.esc(s); };

  var KIND_LABEL = { combine: 'Combine', expand: 'Expand', imitate: 'Imitate', revise: 'Revise' };
  var DEFAULT_PROMPT = {
    combine: 'Combine these short sentences into one stronger sentence. Compose it in your head, on paper, or in the scratchpad — then compare with the models.',
    expand: 'Expand the kernel to answer the question. Then compare with the models.',
    imitate: 'Write your own sentence that copies this structure — new topic, same moves. Then reveal the frame.',
    revise: 'Rewrite this passage using the moves you know. Then compare with a model revision.'
  };

  GX.Construct = {
    mount: function (el) {
      var ids = (el.getAttribute('data-items') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      GX.data.load('items').then(function (data) {
        var items = ids.map(function (id) {
          var it = data.items.find(function (x) { return x.id === id; });
          if (!it) throw new Error('Unknown item id: ' + id);
          return it;
        });
        el.innerHTML = items.map(function (it, i) {
          return '<div class="panel-card" data-item-slot="' + i + '"></div>';
        }).join('');
        items.forEach(function (it, i) {
          GX.Construct.renderInto(el.querySelector('[data-item-slot="' + i + '"]'), it);
        });
      }).catch(function (err) { GX.fail(el, err); });
    },

    /* Renders one construction item into a container.
       onSelfAssess(bool) is optional — used by the quiz engine. */
    renderInto: function (box, item, onSelfAssess) {
      var uid = 'x' + Math.random().toString(36).slice(2, 7);
      var html = '<div class="panel-top-bar"><div class="panel-label">' + (KIND_LABEL[item.kind] || 'Build') + '</div>' +
        '<span class="practice-kind-tag">construction · self-checked</span></div>';

      if (item.kind === 'combine') {
        html += '<div class="construct-kernels">' + item.kernels.map(function (k) {
          return '<div class="construct-kernel">' + esc(k) + '</div>';
        }).join('') + '</div>';
      } else if (item.kind === 'expand') {
        html += '<div class="construct-kernels"><div class="construct-kernel">' + esc(item.kernel) + '</div></div>' +
          '<div class="construct-question">' + esc(item.question) + '</div>';
      } else if (item.kind === 'imitate') {
        html += '<div class="practice-stimulus">' + item.mentor.sentence +
          (item.mentor.source ? ' <small style="font-family:var(--sans);font-size:0.76rem;color:var(--muted);">— ' + esc(item.mentor.source) + '</small>' : '') +
          '</div>';
      } else if (item.kind === 'revise') {
        html += '<div class="practice-stimulus">' + item.passage + '</div>';
      }

      html += '<div class="practice-prompt">' + esc(item.prompt || DEFAULT_PROMPT[item.kind] || '') + '</div>' +
        '<div class="construct-worknote">Optional scratchpad — nothing you type is saved or sent anywhere.</div>' +
        '<textarea class="construct-scratch" aria-label="Scratchpad (optional, never saved)"></textarea>' +
        '<button type="button" class="reveal-btn" id="' + uid + '-reveal">Reveal the model' + (item.models && item.models.length > 1 ? 's' : '') + '</button>' +
        '<div class="construct-models" id="' + uid + '-models" aria-live="polite"></div>';

      box.innerHTML = html;

      box.querySelector('#' + uid + '-reveal').addEventListener('click', function () {
        var out = '';
        if (item.kind === 'imitate' && item.frame) {
          out += '<div class="construct-model"><div class="construct-model-move">The structural frame</div>' +
            '<div class="construct-model-sentence">' + item.frame + '</div></div>';
        }
        (item.models || []).forEach(function (m) {
          out += '<div class="construct-model">' +
            (m.move ? '<div class="construct-model-move">' + esc(m.move) + '</div>' : '') +
            '<div class="construct-model-sentence">' + (m.sentence || m.passage) + '</div>' +
            (m.note ? '<div class="construct-model-note">' + m.note + '</div>' : '') +
            '</div>';
        });
        out += '<div class="construct-privacy">Your version doesn’t have to match a model — check that it makes a <em>move</em>: does it do the job the prompt asked for?</div>';
        if (onSelfAssess) {
          out += '<div class="practice-actions" style="justify-content:flex-start;gap:10px;">' +
            '<button type="button" class="reveal-btn" data-self="yes">Mine makes the move ✓</button>' +
            '<button type="button" class="reveal-btn ghost" data-self="no">I want another try</button></div>';
        }
        var modelsEl = box.querySelector('#' + uid + '-models');
        modelsEl.innerHTML = out;
        this.style.display = 'none';
        if (onSelfAssess) {
          modelsEl.querySelectorAll('[data-self]').forEach(function (b) {
            b.addEventListener('click', function () {
              modelsEl.querySelectorAll('[data-self]').forEach(function (x) { x.disabled = true; x.style.opacity = 0.55; });
              b.style.opacity = 1;
              onSelfAssess(b.getAttribute('data-self') === 'yes');
            });
          });
        }
      });
    }
  };

  GX.Recall = {
    mount: function (el) {
      var id = el.getAttribute('data-item');
      GX.data.load('items').then(function (data) {
        var item = data.items.find(function (x) { return x.id === id; });
        if (!item) throw new Error('Unknown recall item: ' + id);
        var uid = 'r' + Math.random().toString(36).slice(2, 7);
        el.innerHTML =
          '<div class="recall-box">' +
          '  <div class="recall-label">Before you start — from memory</div>' +
          '  <div class="recall-prompt">' + esc(item.prompt) + '</div>' +
          (item.hint ? '<div class="recall-hint">' + esc(item.hint) + '</div>' : '') +
          '  <button type="button" class="reveal-btn" id="' + uid + '">Reveal a model answer</button>' +
          '  <div id="' + uid + '-a" aria-live="polite"></div>' +
          '</div>';
        el.querySelector('#' + uid).addEventListener('click', function () {
          el.querySelector('#' + uid + '-a').innerHTML = '<div class="recall-answer">' + item.model + '</div>';
          this.style.display = 'none';
        });
      }).catch(function (err) { GX.fail(el, err); });
    }
  };
})();
