/* writing.js — components for the Writing strand.
   GX.OIPad   — an Overview & Inventory workspace (notice a text, then reveal a
                worked model). Nothing typed is saved.
   GX.FreeWrite — an optional timed free-write pad ("keep the pen moving").
                Nothing typed is saved; the notebook is still home base.
   Both are purely in-memory, consistent with the site's no-persistence rule
   and the "private writing" ethos (private writing is never seen by anyone). */
(function () {
  'use strict';
  window.GX = window.GX || {};
  var esc = function (s) { return GX.util.esc(s); };

  /* ================= Overview & Inventory pad ================= */
  GX.OIPad = {
    mount: function (el) {
      var id = el.getAttribute('data-model');
      GX.data.load(el.getAttribute('data-file') || 'writing/tours').then(function (data) {
        var model = (data.oimodels || []).find(function (m) { return m.id === id; });
        if (!model) throw new Error('Unknown O&I model: ' + id);
        init(el, model);
      }).catch(function (err) { GX.fail(el, err); });
    }
  };

  function init(el, model) {
    var uid = 'oi' + Math.random().toString(36).slice(2, 7);
    var inv = [];

    el.innerHTML =
      '<div class="panel-card oipad">' +
      '  <div class="panel-top-bar"><div class="panel-label">Overview &amp; Inventory — your turn</div>' +
      '    <span class="practice-kind-tag">nothing is saved</span></div>' +
      (model.text ? '<div class="oi-text">' + model.text + '</div>' : '') +
      (model.source ? '<div class="passage-attribution" style="margin-bottom:14px;">' + model.source + '</div>' : '') +
      '  <div class="oi-panes">' +
      '    <div class="oi-pane">' +
      '      <label class="oi-pane-label" for="' + uid + '-ov">Overview <span>— step back. One sentence: what is this, or what’s its feeling?</span></label>' +
      '      <textarea id="' + uid + '-ov" class="construct-scratch" style="min-height:56px;" aria-label="Your overview"></textarea>' +
      '    </div>' +
      '    <div class="oi-pane">' +
      '      <label class="oi-pane-label" for="' + uid + '-inv">Inventory <span>— get close. List what you notice. Keep the pen moving; questions count.</span></label>' +
      '      <div class="oi-inv-list" id="' + uid + '-list"></div>' +
      '      <form id="' + uid + '-form" class="oi-inv-add">' +
      '        <input id="' + uid + '-inv" type="text" placeholder="I notice… (press Enter)" aria-label="Add a noticing" autocomplete="off">' +
      '        <button type="submit" class="pill-btn">Add</button>' +
      '      </form>' +
      '    </div>' +
      '  </div>' +
      '  <button type="button" class="reveal-btn ghost" id="' + uid + '-reveal" style="margin-top:16px;">Reveal a worked model</button>' +
      '  <div id="' + uid + '-model" aria-live="polite"></div>' +
      '  <div class="construct-privacy">Your overview and inventory live only on this screen. Do the real thing in your notebook — this is just a place to feel the shape of the move.</div>' +
      '</div>';

    var $ = function (s) { return el.querySelector('#' + uid + '-' + s); };

    function renderList() {
      var list = $('list');
      if (!inv.length) { list.innerHTML = '<div class="oi-inv-empty">Your noticings will collect here.</div>'; return; }
      list.innerHTML = inv.map(function (t, i) {
        return '<div class="oi-inv-item"><span>' + esc(t) + '</span>' +
          '<button type="button" class="oi-inv-x" data-i="' + i + '" aria-label="Remove">×</button></div>';
      }).join('');
      list.querySelectorAll('.oi-inv-x').forEach(function (b) {
        b.addEventListener('click', function () { inv.splice(parseInt(b.getAttribute('data-i'), 10), 1); renderList(); });
      });
    }

    $('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('inv').value.trim();
      if (v) { inv.push(v); $('inv').value = ''; renderList(); }
      $('inv').focus();
    });

    $('reveal').addEventListener('click', function () {
      var m = model;
      var invHtml = (m.inventory || []).map(function (x) { return '<li>' + x + '</li>'; }).join('');
      $('model').innerHTML =
        '<div class="oi-model">' +
        '  <div class="oi-model-label">A worked model' + (m.about ? ' — ' + esc(m.about) : '') + '</div>' +
        (m.overview ? '<p class="oi-model-ov"><strong>Overview:</strong> ' + m.overview + '</p>' : '') +
        (invHtml ? '<p class="oi-model-h"><strong>Inventory</strong> — first noticings:</p><ul class="oi-model-inv">' + invHtml + '</ul>' : '') +
        (m.overview2 ? '<p class="oi-model-ov"><strong>Overview, second pass</strong> (now that you’ve noticed): ' + m.overview2 + '</p>' : '') +
        (m.note ? '<p class="oi-model-note">' + m.note + '</p>' : '') +
        '</div>';
      this.style.display = 'none';
    });

    renderList();
  }

  /* ================= Free-write pad (optional, timed) ================= */
  GX.FreeWrite = {
    mount: function (el) {
      var uid = 'fw' + Math.random().toString(36).slice(2, 7);
      var mins = parseInt(el.getAttribute('data-minutes') || '5', 10);
      var promptText = el.getAttribute('data-prompt') || '';
      var total = mins * 60, left = total, timer = null, idle = 0, idleTimer = null, running = false;

      el.innerHTML =
        '<div class="panel-card freewrite">' +
        '  <div class="panel-top-bar"><div class="panel-label">Free-write pad <span style="font-weight:500;text-transform:none;letter-spacing:0;color:var(--muted);">— optional; your notebook is home base</span></div>' +
        '    <div class="fw-meta"><span class="fw-clock" id="' + uid + '-clock">' + fmt(total) + '</span><span class="fw-count" id="' + uid + '-count">0 words</span></div>' +
        '  </div>' +
        (promptText ? '<div class="fw-prompt">' + esc(promptText) + '</div>' : '') +
        '  <textarea id="' + uid + '-ta" class="construct-scratch fw-ta" placeholder="Start writing. Don’t stop. If you’re stuck, write about being stuck." aria-label="Free-write (never saved)"></textarea>' +
        '  <div class="fw-nudge" id="' + uid + '-nudge" hidden>Keep the pen moving…</div>' +
        '  <div class="fw-controls">' +
        '    <button type="button" class="reveal-btn" id="' + uid + '-go">Start ' + mins + '-minute write</button>' +
        '    <button type="button" class="reveal-btn ghost" id="' + uid + '-clear">Clear</button>' +
        '  </div>' +
        '  <div class="construct-privacy">Never saved — close the tab and it’s gone. That’s the point of low-stakes writing.</div>' +
        '</div>';

      var $ = function (s) { return el.querySelector('#' + uid + '-' + s); };
      var ta = $('ta');

      function fmtCount() {
        var w = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
        $('count').textContent = w + (w === 1 ? ' word' : ' words');
      }
      ta.addEventListener('input', function () { fmtCount(); idle = 0; $('nudge').hidden = true; });

      function tick() {
        left--;
        $('clock').textContent = fmt(left);
        if (running) {
          idle++;
          if (idle >= 4) { $('nudge').hidden = false; }
        }
        if (left <= 0) { stop(true); }
      }
      function start() {
        if (running) return;
        running = true; left = total; idle = 0;
        $('clock').textContent = fmt(left);
        $('go').textContent = 'Stop';
        ta.focus();
        timer = setInterval(tick, 1000);
      }
      function stop(done) {
        running = false;
        clearInterval(timer);
        $('go').textContent = done ? 'Time — write again' : 'Start ' + mins + '-minute write';
        $('nudge').hidden = true;
        if (done) { $('clock').textContent = 'done'; }
        left = total;
      }
      $('go').addEventListener('click', function () { if (running) stop(false); else start(); });
      $('clear').addEventListener('click', function () { ta.value = ''; fmtCount(); ta.focus(); });
      fmtCount();
    }
  };

  function fmt(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }
})();
