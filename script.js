/* Zamson Lim — portfolio interactions */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Theme toggle ---------- */
  var themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#070b14' : '#f6f8fc');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
    applyTheme(root.getAttribute('data-theme') || 'dark');
  }

  /* ---------- Mobile navigation ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('navLinks');

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- Scroll progress, sticky header, floating CTA ---------- */
  var progress = document.getElementById('scrollProgress');
  var header = document.getElementById('siteHeader');
  var floating = document.getElementById('floatingResume');
  var ticking = false;

  function onScroll() {
    var top = window.scrollY || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) {
      progress.style.width = (height > 0 ? (top / height) * 100 : 0) + '%';
    }
    if (header) {
      header.classList.toggle('is-stuck', top > 8);
    }
    if (floating) {
      floating.classList.toggle('is-visible', top > window.innerHeight * 0.6);
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });

  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      revealObserver.observe(el);
    });
  }

  /* ---------- Active section in nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle(
            'is-active',
            link.getAttribute('href') === '#' + entry.target.id
          );
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }
})();


/* ---------------------------------------------------------------
   Project card flip — builds an illustrated back face for each
   project card and toggles it on click or Enter/Space.
   ---------------------------------------------------------------- */
(function () {
  'use strict';

  var cards = document.querySelectorAll('.card.project');
  if (!cards.length) return;

  var A = 'var(--accent)', A2 = 'var(--accent-2)', BS = 'var(--border-strong)',
      BD = 'var(--border)', MU = 'var(--muted)', FT = 'var(--faint)',
      CR = 'var(--crit)', HI = 'var(--high)', ME = 'var(--med)', LO = 'var(--low)';

  function win(title, inner) {
    return '<svg viewBox="0 0 320 176" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="320" height="176" fill="var(--bg-elevated)"/>' +
      '<rect width="320" height="20" fill="var(--surface-solid)"/>' +
      '<circle cx="11" cy="10" r="2.6" fill="' + BS + '"/>' +
      '<circle cx="20" cy="10" r="2.6" fill="' + BS + '"/>' +
      '<circle cx="29" cy="10" r="2.6" fill="' + BS + '"/>' +
      '<text x="40" y="13.5" font-family="monospace" font-size="7.5" fill="' + FT + '">' + title + '</text>' +
      '<line x1="0" y1="20" x2="320" y2="20" stroke="' + BD + '"/>' + inner + '</svg>';
  }
  function box(x, y, w, h, stroke, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + (fill || 'none') + '" stroke="' + stroke + '"/>';
  }
  function label(x, y, t, c, s) {
    return '<text x="' + x + '" y="' + y + '" font-family="monospace" font-size="' + (s || 7) + '" fill="' + (c || MU) + '">' + t + '</text>';
  }
  function arrow(x1, x2, y) {
    return '<line x1="' + x1 + '" y1="' + y + '" x2="' + (x2 - 5) + '" y2="' + y + '" stroke="' + A + '" stroke-width="1.2"/>' +
      '<path d="M' + (x2 - 5) + ' ' + (y - 3) + ' L' + x2 + ' ' + y + ' L' + (x2 - 5) + ' ' + (y + 3) + 'Z" fill="' + A + '"/>';
  }

  var ART = {};

  ART.zeek = win('zeek-cluster', (function () {
    var s = box(14, 36, 62, 26, BS) + label(22, 52, 'SPAN port', MU) +
      arrow(78, 100, 49) + box(100, 36, 62, 26, A, 'var(--accent-soft)') + label(107, 52, 'decap.py', A) +
      arrow(164, 186, 49);
    var names = ['logger', 'manager', 'proxy', 'worker'];
    for (var i = 0; i < 4; i++) {
      s += box(188, 30 + i * 26, 118, 20, BD) + label(196, 44 + i * 26, names[i], i === 3 ? A : MU);
    }
    s += label(14, 88, 'conn.log  dns.log  ssl.log  files.log', FT, 7);
    for (var j = 0; j < 5; j++) {
      s += '<rect x="14" y="' + (98 + j * 13) + '" width="' + (70 + j * 34) + '" height="6" rx="3" fill="' + (j % 2 ? A2 : A) + '" opacity="' + (0.55 - j * 0.07) + '"/>';
    }
    return s;
  })());

  ART.gpo = win('gpo-deployment', (function () {
    var s = '', i, x, y;
    for (i = 0; i < 32; i++) {
      x = 16 + (i % 8) * 37; y = 34 + Math.floor(i / 8) * 26;
      var ok = i < 29;
      s += '<rect x="' + x + '" y="' + y + '" width="28" height="19" rx="3" fill="' + (ok ? 'var(--accent-soft)' : 'none') + '" stroke="' + (ok ? A : BS) + '"/>';
      if (ok) s += '<path d="M' + (x + 10) + ' ' + (y + 10) + ' l3 3 l6 -7" stroke="' + A + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    }
    s += label(16, 158, 'agents deployed  29 / 32   •   3 pending reboot', FT, 7.5);
    return s;
  })());

  ART.ad = win('ad-security-events', (function () {
    var v = [46, 72, 30, 88, 54, 24, 66, 38];
    var lb = ['4624', '4625', '4720', '4740', '4728', '4726', '4672', '5136'];
    var s = '';
    for (var i = 0; i < 8; i++) {
      var h = v[i], x = 20 + i * 37, y = 140 - h;
      s += '<rect x="' + x + '" y="' + y + '" width="22" height="' + h + '" rx="3" fill="' + (i === 3 ? CR : i === 1 ? HI : A) + '" opacity="0.8"/>';
      s += label(x - 1, 152, lb[i], FT, 6.5);
    }
    s += '<line x1="14" y1="140" x2="306" y2="140" stroke="' + BD + '"/>' + label(14, 32, 'Top AD events / 24h', MU, 7.5);
    return s;
  })());

  ART.wifi = win('ap-monitoring', (function () {
    var s = '<circle cx="160" cy="96" r="7" fill="' + A + '"/>';
    for (var r = 20; r <= 62; r += 21) {
      s += '<circle cx="160" cy="96" r="' + r + '" fill="none" stroke="' + A + '" opacity="' + (0.5 - r / 200) + '"/>';
    }
    var pts = [[92, 62], [232, 68], [104, 132], [222, 128], [160, 36]];
    for (var i = 0; i < pts.length; i++) {
      s += '<line x1="160" y1="96" x2="' + pts[i][0] + '" y2="' + pts[i][1] + '" stroke="' + (i === 4 ? CR : BD) + '" stroke-dasharray="2 3"/>';
      s += '<circle cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="4" fill="' + (i === 4 ? CR : A2) + '"/>';
    }
    s += label(14, 34, 'clients 4 assoc  •  1 auth-fail burst', MU, 7.5) + label(14, 166, 'SSID hop detected → alert raised', CR, 7);
    return s;
  })());

  ART.vuln = win('assessment-findings', (function () {
    var rows = [['Critical', 3, CR, 62], ['High', 6, HI, 118], ['Medium', 11, ME, 190], ['Low', 8, LO, 148]];
    var s = '';
    for (var i = 0; i < 4; i++) {
      var y = 40 + i * 27;
      s += label(16, y + 8, rows[i][0], MU, 7.5);
      s += '<rect x="66" y="' + y + '" width="' + rows[i][3] + '" height="11" rx="5" fill="' + rows[i][2] + '" opacity="0.85"/>';
      s += label(70 + rows[i][3], y + 9, String(rows[i][1]), rows[i][2], 7.5);
    }
    s += label(16, 162, '3 reports • technical / management / plain', FT, 7);
    return s;
  })());

  ART.highway = win('packet-highway', (function () {
    var s = '<rect y="20" width="320" height="156" fill="#050810"/>';
    s += '<path d="M110 176 L146 44 L174 44 L210 176 Z" fill="#0b1220" stroke="' + BD + '"/>';
    for (var i = 0; i < 6; i++) {
      var t = i / 6, y = 176 - t * 132, w = 46 - t * 34;
      s += '<rect x="' + (160 - w / 2) + '" y="' + y + '" width="' + w + '" height="' + (5 - t * 3) + '" fill="' + FT + '" opacity="0.35"/>';
    }
    var cars = [[132, 150, 14, 8, A], [176, 120, 11, 7, A2], [148, 92, 9, 5, A], [186, 70, 7, 4, ME], [124, 168, 16, 9, CR]];
    for (var j = 0; j < cars.length; j++) {
      s += '<rect x="' + cars[j][0] + '" y="' + cars[j][1] + '" width="' + cars[j][2] + '" height="' + cars[j][3] + '" rx="2" fill="' + cars[j][4] + '"/>';
    }
    s += '<rect x="212" y="44" width="12" height="132" fill="' + CR + '" opacity="0.1"/>' + label(226, 60, 'emergency', CR, 6.5) + label(226, 70, 'lane', CR, 6.5);
    s += label(14, 34, 'packets in flight', MU, 7.5);
    return s;
  })());

  ART.dashboard = win('soc-wall-display', (function () {
    var s = '<rect x="10" y="28" width="196" height="92" rx="4" fill="none" stroke="' + BD + '"/>';
    for (var i = 0; i < 9; i++) {
      var x = 22 + (i * 47) % 176, y = 40 + (i * 31) % 68;
      s += '<circle cx="' + x + '" cy="' + y + '" r="' + (2 + i % 3) + '" fill="' + (i % 4 === 0 ? CR : A) + '" opacity="0.85"/>';
    }
    s += box(212, 28, 96, 92, BD);
    var sev = [CR, HI, ME, LO, ME, A];
    for (var j = 0; j < 6; j++) {
      s += '<rect x="218" y="' + (36 + j * 14) + '" width="3" height="8" fill="' + sev[j] + '"/>';
      s += '<rect x="225" y="' + (38 + j * 14) + '" width="' + (76 - j * 9) + '" height="4" rx="2" fill="' + BS + '"/>';
    }
    s += label(10, 138, 'agents', FT, 7) + label(10, 152, '82', A, 13) +
         label(78, 138, 'active', FT, 7) + label(78, 152, '79', A, 13) +
         label(150, 138, 'down', FT, 7) + label(150, 152, '3', CR, 13) +
         label(220, 138, 'other', FT, 7) + label(220, 152, '0', MU, 13);
    return s;
  })());

  ART.floor = win('floor-plan-binder', (function () {
    var s = box(14, 30, 292, 108, BD);
    for (var i = 1; i < 6; i++) s += '<line x1="' + (14 + i * 48) + '" y1="30" x2="' + (14 + i * 48) + '" y2="138" stroke="' + BD + '" opacity="0.6"/>';
    for (var j = 1; j < 3; j++) s += '<line x1="14" y1="' + (30 + j * 36) + '" x2="306" y2="' + (30 + j * 36) + '" stroke="' + BD + '" opacity="0.6"/>';
    var pins = [[38, 48], [110, 48], [182, 84], [254, 48], [62, 120], [206, 120], [134, 84]];
    for (var k = 0; k < pins.length; k++) {
      var on = k !== 4;
      s += '<path d="M' + pins[k][0] + ' ' + (pins[k][1] + 8) + ' c-6 -8 -6 -14 0 -14 c6 0 6 6 0 14 Z" fill="' + (on ? A : CR) + '"/>';
      s += label(pins[k][0] - 8, pins[k][1] + 18, 'P' + (101 + k * 37), FT, 5.5);
    }
    s += label(14, 158, '310 port codes mapped by OCR  •  1 host offline', FT, 7);
    return s;
  })());

  ART.response = win('active-response', (function () {
    var s = box(12, 60, 74, 30, BD) + label(20, 79, 'detect', MU) + arrow(88, 108, 75) +
      box(108, 60, 74, 30, A, 'var(--accent-soft)') + label(118, 79, 'decide', A) + arrow(184, 204, 75) +
      box(204, 60, 104, 30, CR) + label(214, 79, 'isolate / block', CR);
    s += label(12, 118, 'canary file touched → mass-rename pattern', ME, 7);
    s += label(12, 132, 'firewall API → src quarantined in 1.4s', A, 7);
    s += '<rect x="12" y="140" width="296" height="5" rx="2.5" fill="' + BS + '"/><rect x="12" y="140" width="212" height="5" rx="2.5" fill="' + A + '"/>';
    return s;
  })());

  ART.dfir = win('volatility3 -f mem.raw', (function () {
    var rows = [['System', 4, 0], ['  services.exe', 668, 1], ['    svch0st.exe', 1204, 2], ['      cmd.exe', 3312, 3], ['  explorer.exe', 2140, 1]];
    var s = '';
    for (var i = 0; i < rows.length; i++) {
      var y = 40 + i * 20, sus = i === 2 || i === 3;
      if (sus) s += '<rect x="12" y="' + (y - 9) + '" width="296" height="13" fill="' + CR + '" opacity="0.09"/>';
      s += label(16 + rows[i][2] * 4, y, rows[i][0], sus ? CR : MU, 8);
      s += label(230, y, String(rows[i][1]), FT, 8);
    }
    s += label(16, 150, 'injected section • unsigned • no parent match', CR, 7);
    return s;
  })());

  ART.cli = win('library-system.py', (function () {
    var lines = [['> login admin', A], ['  auth ok — role: LIBRARIAN', MU], ['> borrow 10432', A], ['  due 2026-08-04', MU], ['> login guest', A], ['  attempt 3/3 — locked', CR]];
    var s = '';
    for (var i = 0; i < lines.length; i++) s += label(16, 40 + i * 19, lines[i][0], lines[i][1], 8);
    return s;
  })());

  ART.net = win('LAN_Lords.pkt', (function () {
    var s = box(126, 30, 68, 22, A, 'var(--accent-soft)') + label(140, 45, 'Router', A);
    s += '<line x1="160" y1="52" x2="90" y2="82" stroke="' + BD + '"/><line x1="160" y1="52" x2="230" y2="82" stroke="' + BD + '"/>';
    s += box(56, 82, 68, 22, BS) + label(68, 97, 'SW-A', MU) + box(196, 82, 68, 22, BS) + label(208, 97, 'SW-B', MU);
    var v = [['V10', 30], ['V20', 100], ['V30', 170], ['V40', 240]];
    for (var i = 0; i < 4; i++) {
      s += '<line x1="' + (i < 2 ? 90 : 230) + '" y1="104" x2="' + (v[i][1] + 22) + '" y2="126" stroke="' + BD + '"/>';
      s += box(v[i][1], 126, 44, 20, BD) + label(v[i][1] + 12, 140, v[i][0], A2, 7);
    }
    s += label(14, 166, 'trunk up • inter-VLAN routing verified', FT, 7);
    return s;
  })());

  ART.java = win('JavaSystemImplementation', (function () {
    var s = box(112, 30, 96, 30, A, 'var(--accent-soft)') + label(126, 49, 'abstract User', A, 7.5);
    s += '<line x1="160" y1="60" x2="160" y2="74" stroke="' + BD + '"/><line x1="62" y1="74" x2="258" y2="74" stroke="' + BD + '"/>';
    var kids = ['Member', 'Staff', 'Admin'];
    for (var i = 0; i < 3; i++) {
      var x = 30 + i * 98;
      s += '<line x1="' + (x + 32) + '" y1="74" x2="' + (x + 32) + '" y2="88" stroke="' + BD + '"/>';
      s += box(x, 88, 64, 42, BS) + label(x + 10, 103, kids[i], MU, 7.5);
      s += '<line x1="' + x + '" y1="110" x2="' + (x + 64) + '" y2="110" stroke="' + BD + '"/>';
      s += label(x + 6, 122, '+ act()', FT, 6.5);
    }
    s += label(14, 158, 'inheritance • encapsulation • polymorphism', FT, 7);
    return s;
  })());

  var MAP = [
    [/zeek/i, 'zeek', 'Mirrored traffic is decapsulated in Python, replayed onto a virtual interface, then processed by a four-node Zeek cluster.'],
    [/gpo|endpoint/i, 'gpo', 'One Group Policy object, one idempotent installer, and the whole Windows estate reports in without a desk visit.'],
    [/active directory/i, 'ad', 'Domain controller event channels ranked by volume, so an unusual lockout spike is visible before anyone reports it.'],
    [/wireless|access point/i, 'wifi', 'Association tracking per access point, with auth-failure bursts and cross-AP SSID hopping raised as alerts.'],
    [/vulnerability assessment/i, 'vuln', 'Findings ranked by severity and written up three ways, so the fix owner and the budget owner both got a readable version.'],
    [/packet-highway/i, 'highway', 'Every vehicle is a packet. Size tracks bytes, colour tracks protocol, and blocked traffic is pushed into the emergency lane.'],
    [/dashboard suite/i, 'dashboard', 'The wall view: GeoIP-plotted firewall traffic, a live severity queue, and a fleet count that stays correct at any agent number.'],
    [/floor-plan/i, 'floor', 'OCR lifted every port code off the building plan, so an alerting agent resolves to a desk instead of a hostname.'],
    [/active response/i, 'response', 'Ransomware behaviour trips a canary, and containment happens through the firewall API rather than a phone call.'],
    [/memory analysis/i, 'dfir', 'Process tree from a memory image, with the injected and unparented processes surfaced for the write-up.'],
    [/library/i, 'cli', 'Role-based command line with attempt limiting, so a guest account locks out before brute force gets anywhere.'],
    [/switching|routing/i, 'net', 'VLANs segmented across two switches, trunked, and routed, then verified end to end with ping and the routing table.'],
    [/java/i, 'java', 'An abstract base with three concrete roles, keeping behaviour where it belongs instead of in one long switch statement.']
  ];

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3H15"/><path d="M18.7 6V3"/><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3H9"/><path d="M5.3 18v3"/></svg>';

  Array.prototype.forEach.call(cards, function (card) {
    var h = card.querySelector('h3');
    var title = h ? h.textContent : '';
    var hit = null;
    for (var i = 0; i < MAP.length; i++) {
      if (MAP[i][0].test(title)) { hit = MAP[i]; break; }
    }
    if (!hit || !ART[hit[1]]) return;

    var inner = document.createElement('div');
    inner.className = 'flip-inner';

    var front = document.createElement('div');
    front.className = 'flip-face flip-front';
    while (card.firstChild) front.appendChild(card.firstChild);

    var hintFront = document.createElement('span');
    hintFront.className = 'flip-hint';
    hintFront.innerHTML = ICON + '<span>Click to flip</span>';
    front.appendChild(hintFront);

    var back = document.createElement('div');
    back.className = 'flip-face flip-back';
    back.innerHTML =
      '<div class="flip-group">' +
        '<div class="flip-art">' + ART[hit[1]] + '</div>' +
        '<h4>' + title + '</h4>' +
        '<p class="flip-cap">' + hit[2] + '</p>' +
      '</div>' +
      '<span class="flip-hint">' + ICON + '<span>Click to go back</span></span>';

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.classList.add('flip');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', title + ' — press to show illustration');

    function toggle() {
      var on = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    card.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) return;
      toggle();
    });
    card.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest && e.target.closest('a')) return;
      e.preventDefault();
      toggle();
    });
  });

  var grid = document.querySelector('#projects .project-grid');
  if (grid && !document.querySelector('.flip-note')) {
    var note = document.createElement('p');
    note.className = 'flip-note';
    note.innerHTML = ICON + '<span>Click any card to flip it over</span>';
    grid.parentNode.insertBefore(note, grid);
  }
})();


/* ---------------------------------------------------------------
   Flagship spotlight flip — turns the SOC build-out card over to
   reveal the real production dashboard.
   ---------------------------------------------------------------- */
(function () {
  'use strict';

  var spot = document.querySelector('.spotlight');
  if (!spot || spot.classList.contains('flip')) return;

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3H15"/><path d="M18.7 6V3"/><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3H9"/><path d="M5.3 18v3"/></svg>';

  var inner = document.createElement('div');
  inner.className = 'flip-inner';

  var front = document.createElement('div');
  front.className = 'spotlight-front';
  while (spot.firstChild) front.appendChild(spot.firstChild);

  var body = front.querySelector('.spotlight-body') || front;
  var hintFront = document.createElement('span');
  hintFront.className = 'flip-hint';
  hintFront.innerHTML = ICON + '<span>Click to see the real dashboard</span>';
  body.appendChild(hintFront);

  var back = document.createElement('div');
  back.className = 'spotlight-back';
  back.innerHTML =
    '<div class="spotlight-shot">' +
      '<img src="soc-dashboard.png" alt="Live traffic overview dashboard from the production SOC, showing session event counts, a severity timeline, a global activity map, top countries, top firewall signatures, targeted services and top applications." loading="lazy" width="1280" height="717" />' +
    '</div>' +
    '<h4>Traffic Overview — running in production</h4>' +
    '<p class="flip-cap">22,246 events in a 30-minute window across 45 countries, rendered live from Wazuh and OpenSearch. Source addresses are external inbound traffic; one signature row naming an internal host has been masked.</p>' +
    '<span class="flip-hint">' + ICON + '<span>Click to go back</span></span>';

  inner.appendChild(front);
  inner.appendChild(back);
  spot.appendChild(inner);

  spot.classList.add('flip');
  spot.setAttribute('tabindex', '0');
  spot.setAttribute('role', 'button');
  spot.setAttribute('aria-pressed', 'false');
  spot.setAttribute('aria-label', 'Enterprise SOC Build-out — press to show the production dashboard');

  function toggle() {
    var on = spot.classList.toggle('is-flipped');
    spot.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  spot.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) return;
    toggle();
  });
  spot.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest && e.target.closest('a')) return;
    e.preventDefault();
    toggle();
  });
})();
