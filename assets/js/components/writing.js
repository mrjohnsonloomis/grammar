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
      '  <div class="oi-export">' +
      '    <span class="oi-export-label">Nothing here is saved. To keep your notes, export a copy:</span>' +
      '    <span class="oi-export-btns">' +
      '      <button type="button" class="pill-btn" id="' + uid + '-word">Download (.doc)</button>' +
      '      <button type="button" class="pill-btn" id="' + uid + '-pdf">Print / Save PDF</button>' +
      '    </span>' +
      '  </div>' +
      '  <div class="construct-privacy">Your overview and inventory live only on this screen — close the tab and they’re gone. Export if you want to keep them, and do the real, deeper work in your notebook.</div>' +
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

    function exportBody() {
      var ov = $('ov').value.trim();
      var h = '<h1>Overview &amp; Inventory</h1>';
      if (model.about) h += '<p class="muted">' + esc(model.about) + '</p>';
      h += '<h2>Overview</h2><p>' + (ov ? esc(ov) : '<em>(not written yet)</em>') + '</p>';
      h += '<h2>Inventory — what I notice</h2>';
      h += inv.length
        ? '<ul>' + inv.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'
        : '<p><em>(nothing noticed yet)</em></p>';
      return h;
    }
    $('word').addEventListener('click', function () { GX.exportDoc('overview-inventory.doc', 'Overview & Inventory', exportBody()); });
    $('pdf').addEventListener('click', function () { GX.exportPrint('Overview & Inventory', exportBody()); });

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

  /* ================= Export helpers (never persisted; user-initiated) =========
     Two library-free paths, both offline-safe:
       exportDoc  — a Word-openable .doc (HTML with the msword MIME type)
       exportPrint — a clean print window the browser can "Save as PDF"      */
  GX.exportDoc = function (filename, title, bodyHtml) {
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + esc(title) + '</title></head><body>' + bodyHtml + '</body></html>';
    var blob = new Blob(['﻿', html], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  };
  GX.exportPrint = function (title, bodyHtml) {
    var w = window.open('', '_blank');
    if (!w) { alert('Your browser blocked the print window. Allow pop-ups for this page, or use the Word download instead.'); return; }
    w.document.write('<html><head><meta charset="utf-8"><title>' + esc(title) + '</title>' +
      '<style>body{font-family:Georgia,\'Times New Roman\',serif;line-height:1.65;max-width:40em;' +
      'margin:2.5em auto;padding:0 1.2em;color:#141414;}h1{font-size:1.4em;margin:0 0 .2em;}' +
      'h2{font-size:1.05em;margin:1.5em 0 .3em;}ul{padding-left:1.2em;}li{margin-bottom:.35em;}' +
      'p{margin:.3em 0;}.muted{color:#666;font-size:.9em;font-style:italic;margin-top:0;}</style>' +
      '</head><body>' + bodyHtml + '</body></html>');
    w.document.close(); w.focus();
    setTimeout(function () { w.print(); }, 350);
  };

  /* ================= Kernel → paragraph (drag & drop) =========================
     Shows a paragraph GROWING from one noticing (the "kernel"): kernel → claim →
     proof. The proof is assembled by dragging each piece of reasoning to the
     quote it explains. Quick-hitting example, not a drafting space; nothing saved.
     Click-to-place is the primary interaction (keyboard + touch friendly);
     native drag is layered on for mouse users. */
  GX.Kernel = {
    mount: function (el) {
      var id = el.getAttribute('data-model') || el.getAttribute('data-kernel');
      GX.data.load(el.getAttribute('data-file') || 'writing/tours').then(function (data) {
        var model = (data.kernels || []).find(function (m) { return m.id === id; });
        if (!model) throw new Error('Unknown kernel model: ' + id);
        initKernel(el, model);
      }).catch(function (err) { GX.fail(el, err); });
    }
  };

  function initKernel(el, model) {
    var uid = 'k' + Math.random().toString(36).slice(2, 7);
    var pairs = model.pairs || [];
    var n = pairs.length;
    var placed = pairs.map(function () { return null; });   // slot index -> reason index
    var order = GX.util.shuffle(pairs.map(function (_, i) { return i; }));  // tray display order
    var selected = null;                                     // picked-up reason index (click mode)
    var solved = false;

    el.innerHTML =
      '<div class="panel-card kernelpad">' +
      '  <div class="panel-top-bar"><div class="panel-label">From a kernel to a paragraph</div>' +
      '    <span class="practice-kind-tag">drag &amp; drop · nothing saved</span></div>' +
      '  <div class="kernel-stage">' +
      '    <div class="kernel-tag kernel-tag-seed">The kernel — what you noticed first</div>' +
      '    <div class="kernel-seed">' + model.kernel + '</div>' +
      (model.kernelNote ? '    <div class="kernel-note">' + model.kernelNote + '</div>' : '') +
      '  </div>' +
      '  <div class="kernel-grow" aria-hidden="true"><span>ask “so what?” →</span></div>' +
      '  <div class="kernel-stage">' +
      '    <div class="kernel-tag kernel-tag-claim">The argument — your topic sentence</div>' +
      '    <div class="kernel-claim">' + model.claim + '</div>' +
      (model.claimNote ? '    <div class="kernel-note">' + model.claimNote + '</div>' : '') +
      '  </div>' +
      '  <div class="kernel-grow" aria-hidden="true"><span>now prove it ↓</span></div>' +
      '  <div class="kernel-stage">' +
      '    <div class="kernel-tag kernel-tag-proof">The proof — pair each quote with its reasoning</div>' +
      (model.assembleNote ? '    <div class="kernel-note">' + model.assembleNote + '</div>' : '') +
      '    <div class="kernel-slots" id="' + uid + '-slots"></div>' +
      '    <div class="kernel-tray-label" id="' + uid + '-traylabel">Reasoning — drag (or tap, then tap a quote) each to the quote it explains:</div>' +
      '    <div class="kernel-tray" id="' + uid + '-tray"></div>' +
      '  </div>' +
      '  <div id="' + uid + '-done" aria-live="polite"></div>' +
      '</div>';

    var slotsEl = el.querySelector('#' + uid + '-slots');
    var trayEl = el.querySelector('#' + uid + '-tray');
    var doneEl = el.querySelector('#' + uid + '-done');

    function place(qi, ri) {
      if (solved) return;
      placed.forEach(function (v, s) { if (v === ri) placed[s] = null; });  // pull chip from any prior slot
      placed[qi] = ri;
      selected = null;
      render();
      checkSolved();
    }
    function pickUp(ri) {
      if (solved) return;
      selected = (selected === ri) ? null : ri;
      // if the chip was sitting in a slot, lift it back out when picked up
      placed.forEach(function (v, s) { if (v === ri && selected === ri) placed[s] = null; });
      render();
    }
    function checkSolved() {
      if (placed.every(function (v, i) { return v === i; })) {
        solved = true;
        render();
        reveal();
      }
    }

    function render() {
      slotsEl.innerHTML = pairs.map(function (p, qi) {
        var ri = placed[qi];
        var state = ri == null ? 'empty' : (ri === qi ? 'correct' : 'wrong');
        var drop = ri == null
          ? '<span class="kernel-drop-hint">drop reasoning here</span>'
          : '<button type="button" class="kernel-chip in-slot ' + state + '" data-ri="' + ri + '"' +
            (solved ? ' disabled' : '') + '>' + pairs[ri].reason +
            (state === 'correct' ? '<span class="kernel-mark">✓</span>' : '<span class="kernel-mark">↺</span>') +
            '</button>';
        return '<div class="kernel-slot ' + state + '">' +
          '<div class="kernel-evi"><span class="kernel-evi-tag">evidence</span>' +
          '<span class="kernel-quote">&ldquo;' + p.quote + '&rdquo;</span></div>' +
          '<div class="kernel-drop ' + state + '" data-qi="' + qi + '" role="button" tabindex="0" ' +
          'aria-label="Drop reasoning for quote ' + (qi + 1) + '">' + drop + '</div>' +
          '</div>';
      }).join('');

      var trayChips = order.filter(function (ri) { return placed.indexOf(ri) < 0; });
      trayEl.innerHTML = trayChips.length
        ? trayChips.map(function (ri) {
            return '<button type="button" class="kernel-chip' + (selected === ri ? ' is-selected' : '') +
              '" data-ri="' + ri + '" draggable="true">' + pairs[ri].reason + '</button>';
          }).join('')
        : '<span class="kernel-tray-empty">All reasoning placed. Check the ✓ marks — every quote should be green.</span>';

      bind();
    }

    function bind() {
      // tray chips + in-slot chips: click to pick up / lift out
      el.querySelectorAll('.kernel-chip').forEach(function (chip) {
        var ri = parseInt(chip.getAttribute('data-ri'), 10);
        chip.addEventListener('click', function () { pickUp(ri); });
        chip.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/plain', String(ri));
          e.dataTransfer.effectAllowed = 'move';
          chip.classList.add('dragging');
        });
        chip.addEventListener('dragend', function () { chip.classList.remove('dragging'); });
      });
      // drop zones: click to place selected, or accept a drag
      el.querySelectorAll('.kernel-drop').forEach(function (zone) {
        var qi = parseInt(zone.getAttribute('data-qi'), 10);
        zone.addEventListener('click', function () { if (selected != null) place(qi, selected); });
        zone.addEventListener('keydown', function (e) {
          if ((e.key === 'Enter' || e.key === ' ') && selected != null) { e.preventDefault(); place(qi, selected); }
        });
        zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('over'); });
        zone.addEventListener('dragleave', function () { zone.classList.remove('over'); });
        zone.addEventListener('drop', function (e) {
          e.preventDefault(); zone.classList.remove('over');
          var ri = parseInt(e.dataTransfer.getData('text/plain'), 10);
          if (!isNaN(ri)) place(qi, ri);
        });
      });
    }

    function reveal() {
      el.querySelector('#' + uid + '-traylabel').textContent = 'Every quote is paired with the reasoning that proves it. Here’s the whole paragraph:';
      doneEl.innerHTML =
        '<div class="kernel-solved">' +
        '  <div class="kernel-tag kernel-tag-done">The finished paragraph — grown from one noticing</div>' +
        '  <div class="annot-para">' + model.paragraph + '</div>' +
        '  <div class="annot-key">' +
        '    <span><i style="background:var(--name)"></i>claim</span>' +
        '    <span><i style="background:var(--desc)"></i>evidence</span>' +
        '    <span><i style="background:var(--sit)"></i>reasoning</span></div>' +
        (model.note ? '  <div class="kernel-note">' + model.note + '</div>' : '') +
        '</div>';
    }

    render();
  }
})();
