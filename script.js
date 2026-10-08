/* Zamson Lim — portfolio. Dependency-free. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* theme */
  (function () {
    var btns = $$('.theme-toggle'); if (!btns.length) return;
    var meta = $('meta[name="theme-color"]');
    function apply(t) {
      document.documentElement.setAttribute('data-theme', t);
      if (meta) meta.setAttribute('content', t === 'light' ? '#f6f4fb' : '#0a0912');
      btns.forEach(function (b) { b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); });
      try { localStorage.setItem('zl.theme', t); } catch (e) {}
    }
    apply(document.documentElement.getAttribute('data-theme') || 'dark');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    });
  })();

  /* sticky header border + current section */
  (function () {
    var top = $('#top');
    var links = $$('#nav a[href^="#"], .rail-nav a[href^="#"]');
    var targets = links.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; })
                       .filter(function (t) { return t.el; });
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      if (top) top.classList.toggle('stuck', y > 4);
      var line = y + window.innerHeight * 0.3, curEl = null;
      targets.forEach(function (t) { if (t.el.offsetTop <= line) curEl = t.el; });
      links.forEach(function (a) {
        var el = document.getElementById(a.getAttribute('href').slice(1));
        a.classList.toggle('on', !!curEl && el === curEl);
      });
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
    window.addEventListener('resize', function () { if (window.innerWidth > 760) set(false); });
  })();

  /* lightbox: the full-size screenshot only loads when asked for */
  (function () {
    var box = $('#lightbox'); if (!box || typeof box.showModal !== 'function') return;
    var img = $('img', box), cap = $('.lb-cap', box), close = $('.lb-close', box);
    var opener = null;
    $$('[data-full]').forEach(function (b) {
      b.addEventListener('click', function () {
        opener = b;
        img.src = b.getAttribute('data-full');
        img.width = +b.getAttribute('data-w') || 0;
        img.height = +b.getAttribute('data-h') || 0;
        var t = b.querySelector('img');
        img.alt = t ? t.alt.replace(/^Thumbnail of /, '') : '';
        cap.textContent = b.getAttribute('data-caption') || '';
        box.showModal();
        close.focus();
      });
    });
    close.addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('close', function () { if (opener) opener.focus(); });
  })();

  /* desktop: hide / show the command rail */
  (function () {
    var hide = $('#railHide'), reopen = $('#railReopen');
    function set(off) {
      document.documentElement.classList.toggle('rail-off', off);
      try { localStorage.setItem('zl.rail', off ? 'off' : 'on'); } catch (e) {}
    }
    if (hide) hide.addEventListener('click', function () { set(true); if (reopen) reopen.focus(); });
    if (reopen) reopen.addEventListener('click', function () { set(false); if (hide) hide.focus(); });
  })();
})();
