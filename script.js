/* Zamson Lim — portfolio. Dependency-free. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* theme */
  (function () {
    var btns = $$('.theme-toggle'); if (!btns.length) return;
    var meta = $('meta[name="theme-color"]');
    function apply(t) {
      document.documentElement.setAttribute('data-theme', t);
      if (meta) meta.setAttribute('content', t === 'light' ? '#f4f5f8' : '#0b0c12');
      btns.forEach(function (b) { b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); });
      try { localStorage.setItem('zl.theme', t); } catch (e) {}
      document.dispatchEvent(new Event('zl:relayout'));
    }
    apply(document.documentElement.getAttribute('data-theme') || 'dark');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    });
  })();

  /* sticky header + current section */
  (function () {
    var top = $('#top');
    var links = $$('#nav a[href^="#"]');
    var targets = links.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; })
                       .filter(function (t) { return t.el; });
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      if (top) top.classList.toggle('stuck', y > 4);
      var line = y + window.innerHeight * 0.3, cur = null;
      targets.forEach(function (t) { if (t.el.getBoundingClientRect().top + y <= line) cur = t.a; });
      links.forEach(function (a) { a.classList.toggle('on', a === cur); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* mobile menu */
  (function () {
    var burger = $('#burger'), nav = $('#nav'); if (!burger || !nav) return;
    function set(open) {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    burger.addEventListener('click', function () { set(burger.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) set(false); });
  })();

  /* lightbox: the original screenshot only loads when asked for */
  (function () {
    var box = $('#lightbox'); if (!box || typeof box.showModal !== 'function') return;
    var img = $('.lb-stage img', box), cap = $('.lb-cap', box), close = $('.lb-close', box), zoom = $('.lb-zoom', box);
    var opener = null;
    function setZoom(on) {
      box.classList.toggle('zoomed', on);
      zoom.setAttribute('aria-pressed', on ? 'true' : 'false');
      zoom.textContent = on ? 'Fit to screen' : 'Actual size';
    }
    $$('[data-full]').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b;
        setZoom(false);
        img.removeAttribute('src');
        img.width = +b.getAttribute('data-w') || 0;
        img.height = +b.getAttribute('data-h') || 0;
        img.src = b.getAttribute('data-full');
        var t = b.querySelector('img');
        img.alt = t ? t.alt.replace(/^Thumbnail of /, '') : '';
        cap.textContent = b.getAttribute('data-caption') || '';
        box.showModal();
        close.focus();
      });
    });
    zoom.addEventListener('click', function () { setZoom(!box.classList.contains('zoomed')); });
    img.addEventListener('click', function () { setZoom(!box.classList.contains('zoomed')); });
    close.addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('close', function () { setZoom(false); if (opener) opener.focus(); });
  })();

  /* the threshold strip: step through the six connections */
  (function () {
    var strip = $('#strip'), play = $('#stripPlay'), count = $('#stripCount');
    if (!strip || !play) return;
    var marks = $$('.m', strip), diamond = $('.d', strip), timer = null;
    function stop() { if (timer) { clearTimeout(timer); timer = null; } }
    function show(n) {
      marks.forEach(function (m, i) { m.classList.toggle('on', i < n); });
      var hit = n >= marks.length;
      if (diamond) diamond.classList.toggle('on', hit);
      strip.classList.toggle('hit', hit);
      count.textContent = n === 0 ? '' :
        hit ? '6 matches from one source inside 60 seconds. Rule 100002 fires at level 12.'
            : n + (n === 1 ? ' match' : ' matches') + ' so far. Each is a level 3 alert on its own.';
    }
    play.addEventListener('click', function () {
      stop();
      strip.classList.add('stepping');
      play.disabled = true;
      var n = 0;
      show(0);
      (function next() {
        n++;
        show(n);
        if (n < marks.length) timer = setTimeout(next, reduce ? 500 : 650);
        else timer = setTimeout(function () { play.disabled = false; play.lastChild.textContent = ' Step through again'; play.focus(); }, 400);
      })();
    });
  })();

  /* SOC flow: draw the wires between the boxes from their real positions */
  (function () {
    var flow = $('#flow'); if (!flow) return;
    var svg = $('.flow-wires', flow);
    var ins = $$('.n-in', flow), host = $('.n-host', flow), outs = $$('.n-out', flow);
    var NS = 'http://www.w3.org/2000/svg';
    function el(name, attrs) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (getComputedStyle(svg).display === 'none') return;
      var f = flow.getBoundingClientRect(), h = host.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + f.width + ' ' + f.height);
      var hl = h.left - f.left, hr = h.right - f.left, hy = h.top - f.top + h.height / 2;
      function curve(x1, y1, x2, y2, cls) {
        var mx = (x1 + x2) / 2;
        svg.appendChild(el('path', { d: 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2, 'class': cls }));
      }
      function tip(x, y, cls) { svg.appendChild(el('path', { d: 'M' + (x - 7) + ' ' + (y - 4.5) + ' L' + x + ' ' + y + ' L' + (x - 7) + ' ' + (y + 4.5) + ' Z', 'class': cls })); }
      ins.forEach(function (n, i) {
        var r = n.getBoundingClientRect();
        var y2 = hy + (i - (ins.length - 1) / 2) * 14;
        curve(r.right - f.left, r.top - f.top + r.height / 2, hl - 2, y2, 'w-in');
        tip(hl - 1, y2, 'tip-in');
      });
      outs.forEach(function (n, i) {
        var r = n.getBoundingClientRect();
        var y1 = hy + (i - (outs.length - 1) / 2) * 14, x2 = r.left - f.left - 2, y2 = r.top - f.top + r.height / 2;
        curve(hr, y1, x2, y2, 'w-out');
        tip(x2 + 1, y2, 'tip-out');
      });
    }
    var raf = 0;
    function later() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
    window.addEventListener('resize', later);
    document.addEventListener('zl:relayout', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(flow);
    later();
  })();

  /* skills: chips with a dot show where on the page that skill was used */
  (function () {
    $$('.cap').forEach(function (cap) {
      var panel = $('.ev-panel', cap); if (!panel) return;
      var q = $('.ev-q', panel), go = $('.ev-go', panel), open = null;
      var chips = $$('.chip.ev', cap);
      chips.forEach(function (c, i) {
        var id = 'ev-' + Math.abs(hash(cap.textContent.slice(0, 40) + i));
        panel.id = panel.id || id;
        c.setAttribute('aria-expanded', 'false');
        c.setAttribute('aria-controls', panel.id);
        c.addEventListener('click', function () {
          var same = open === c;
          chips.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
          if (same) { panel.hidden = true; open = null; return; }
          q.textContent = c.getAttribute('data-q');
          go.setAttribute('href', c.getAttribute('data-to'));
          c.setAttribute('aria-expanded', 'true');
          panel.hidden = false;
          open = c;
        });
      });
      cap.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && open) { var c = open; panel.hidden = true; c.setAttribute('aria-expanded', 'false'); open = null; c.focus(); }
      });
      go.addEventListener('click', function () {
        var t = document.querySelector(go.getAttribute('href'));
        if (!t) return;
        setTimeout(function () { t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }, reduce ? 0 : 450);
      });
    });
    function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  })();
})();
