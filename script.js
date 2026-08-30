/* =========================================================================
   Zamson Lim — portfolio behaviour
   Small, dependency-free, and defensive: every block checks its own nodes
   exist before binding, so a missing section can never break the rest.
   ========================================================================= */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Footer year -------------------------------------------------- */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- 2. Theme -------------------------------------------------------- */
  (function theme() {
    var btn = $('#theme');
    if (!btn) return;
    var meta = $('meta[name="theme-color"]');
    var COLOR = { dark: '#08090d', light: '#fbfbfa' };

    function apply(t) {
      document.documentElement.setAttribute('data-theme', t);
      if (meta) meta.setAttribute('content', COLOR[t] || COLOR.dark);
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      try { localStorage.setItem('zl.theme', t); } catch (e) {}
    }
    apply(document.documentElement.getAttribute('data-theme') || 'dark');

    btn.addEventListener('click', function () {
      apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  })();

  /* ---- 3. Header state, scroll progress, active section ---------------- */
  (function chrome() {
    var hdr = $('#hdr');
    var bar = $('#progress');
    var links = $$('#nav a[href^="#"]');
    var targets = links
      .map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; })
      .filter(function (t) { return t.el; });

    var ticking = false;
    function frame() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop;

      if (hdr) hdr.classList.toggle('stuck', y > 8);

      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
      }

      // Active link = the last section whose top has passed the header line.
      var line = y + (window.innerHeight * 0.32);
      var current = null;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].el.offsetTop <= line) current = targets[i];
      }
      links.forEach(function (a) { a.classList.remove('on'); });
      if (current) current.a.classList.add('on');
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  })();

  /* ---- 4. Mobile menu -------------------------------------------------- */
  (function menu() {
    var burger = $('#burger');
    var nav = $('#nav');
    if (!burger || !nav) return;

    function set(open) {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    burger.addEventListener('click', function () {
      set(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) set(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') set(false);
    });
    // A resize past the breakpoint must not leave the panel stuck open.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) set(false);
    });
  })();

  /* ---- 5. Reveal on scroll --------------------------------------------- */
  (function reveal() {
    var items = $$('.rv');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---- 6. Project filter ----------------------------------------------- */
  (function filter() {
    var bar = $('#filters');
    var grid = $('#pgrid');
    var count = $('#fcount');
    if (!bar || !grid) return;

    var items = $$('.item', grid);

    // Label counts are derived from the DOM, so they cannot drift from it.
    $$('.filter', bar).forEach(function (b) {
      var f = b.dataset.f;
      var n = f === 'all'
        ? items.length
        : items.filter(function (i) { return i.dataset.cat === f; }).length;
      var i = b.querySelector('i');
      if (i) i.textContent = n;
      if (!n && f !== 'all') b.hidden = true;
    });

    function run(f) {
      var shown = 0;
      items.forEach(function (el) {
        var hit = f === 'all' || el.dataset.cat === f;
        el.hidden = !hit;
        if (hit) shown++;
      });
      $$('.filter', bar).forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.f === f ? 'true' : 'false');
      });
      if (count) {
        count.textContent = f === 'all'
          ? 'Showing all ' + shown
          : 'Showing ' + shown + ' of ' + items.length;
      }
    }

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.filter');
      if (b) run(b.dataset.f);
    });
    run('all');
  })();

  /* ---- 6b. Expand / collapse all ---------------------------------------- */
  (function expandAll() {
    var btn = $('#toggleAll');
    var grid = $('#pgrid');
    if (!btn || !grid) return;
    var label = btn.querySelector('span');

    function sync() {
      // Only count what the filter is currently showing, so the label matches
      // what the reader can actually see.
      var vis = $$('.item:not([hidden]) > details.more', grid);
      var open = vis.filter(function (d) { return d.open; }).length;
      var all = vis.length && open === vis.length;
      btn.setAttribute('aria-expanded', all ? 'true' : 'false');
      if (label) label.textContent = all ? 'Collapse all' : 'Expand all';
      btn.hidden = vis.length === 0;
    }

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      $$('.item:not([hidden]) > details.more', grid).forEach(function (d) { d.open = open; });
      sync();
    });

    grid.addEventListener('toggle', sync, true);
    // The filter changes which cards are visible, so re-sync after it runs.
    var bar = $('#filters');
    if (bar) bar.addEventListener('click', function () { setTimeout(sync, 0); });
    sync();
  })();

  /* ---- 7. Lightbox ----------------------------------------------------- */
  (function lightbox() {
    var lb = $('#lb'), img = $('#lbimg'), cap = $('#lbcap'), x = $('#lbx');
    if (!lb || !img) return;
    var last = null;

    function open(src, caption, alt) {
      img.src = src;
      img.alt = alt || '';
      if (cap) cap.textContent = caption || '';
      lb.hidden = false;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (x) x.focus();
    }
    function close() {
      lb.classList.remove('open');
      lb.hidden = true;
      document.body.style.overflow = '';
      img.src = '';
      if (last) { last.focus(); last = null; }
    }

    $$('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () {
        last = b;
        var pic = b.parentNode.querySelector('img');
        open(b.dataset.lightbox, b.dataset.caption, pic ? pic.alt : '');
      });
    });
    if (x) x.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('open')) close();
    });
  })();

  /* ---- 8. Live console embed ------------------------------------------- */
  (function embed() {
    var box = $('#embed');
    if (!box) return;
    var frame = box.querySelector('iframe');
    if (!frame) return;

    // The frame is laid out at a desktop width and scaled down, so the preview
    // keeps real desktop proportions instead of collapsing to a phone layout.
    // The container is 16:9 and the frame is 1600x900, so scaling on width
    // fills it exactly -- no empty band underneath.
    var BASE_W = 1600;
    function fit() {
      var w = box.clientWidth;
      if (w > 0) box.style.setProperty('--embed-scale', (w / BASE_W).toFixed(4));
    }

    var loaded = false;
    function load() {
      if (loaded) return;
      loaded = true;
      frame.addEventListener('load', function () {
        box.classList.add('ready');
        fit();
      }, { once: true });
      frame.src = frame.getAttribute('data-src');
      frame.removeAttribute('data-src');
      fit();
    }

    fit();
    window.addEventListener('resize', fit);

    // Only fetch the 600KB console once it is actually about to be seen.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.disconnect();
          load();
        });
      }, { rootMargin: '200px' });
      io.observe(box);
    } else {
      load();
    }
  })();

})();
