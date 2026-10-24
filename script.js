(() => {
  'use strict';
  const dialog = document.querySelector('#case-dialog');
  const content = document.querySelector('#case-content');
  let opener = null;
  let currentCase = null;
  let toastTimer;

  // Dialogs respond immediately; opening and focus never wait for an animation.
  function finishClose() {
    dialog.close();
    updateScrollLock();
    currentCase = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function renderCase(id) {
    const data = window.PORTFOLIO_CASES?.[id];
    if (!data) return false;
    content.replaceChildren();
    content.append(element('p', 'case-eyebrow', data.eyebrow));
    const title = element('h2', 'case-title', data.title);
    title.id = 'case-title';
    content.append(title);
    if (data.html) {
      const body = element('div', 'case-body');
      body.innerHTML = data.html;
      body.querySelectorAll('pre').forEach(block => {
        block.tabIndex = 0;
        block.setAttribute('role', 'region');
        block.setAttribute('aria-label', 'Detection rule code');
      });
      content.append(body);
      return true;
    }
    content.append(element('p', 'case-summary', data.summary));
    const metadata = element('dl', 'case-meta');
    data.metadata.forEach(item => {
      const block = element('div');
      block.append(element('dt', '', item.label), element('dd', '', item.value));
      metadata.append(block);
    });
    content.append(metadata);
    data.sections.forEach(section => {
      const block = element('section', 'case-section');
      block.append(element('h3', '', section.title), element('p', '', section.body));
      content.append(block);
    });
    const takeaways = element('ul', 'case-takeaways');
    takeaways.setAttribute('aria-label', 'Key takeaways');
    data.takeaways.forEach(item => takeaways.append(element('li', '', item)));
    content.append(takeaways);
    return true;
  }
  function openCase(id, trigger, updateHistory = true) {
    if (!window.PORTFOLIO_CASES?.[id]) return;
    closeImage(false);
    hideEvidence(false);
    if (!renderCase(id)) return;
    if (trigger) opener = trigger;
    currentCase = id;
    if (!dialog.open) {
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }
    dialog.scrollTop = 0;
    dialog.querySelector('.close-dialog').focus({ preventScroll: true });
    if (updateHistory) history.pushState({ portfolioCase: id }, '', `#case-${id}`);
  }
  function closeCase(updateHistory = true) {
    if (!dialog.open) return;
    const section = currentCase?.startsWith('sample-') ? 'samples' : currentCase || 'purple';
    closeImage(false);
    finishClose();
    if (updateHistory && location.hash.startsWith('#case-')) {
      if (history.state?.portfolioCase) history.back();
      else history.replaceState(null, '', `#${section}`);
    }
  }
  document.querySelectorAll('[data-case]').forEach(button => {
    button.addEventListener('click', () => openCase(button.dataset.case, button));
  });
  document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => closeCase()));
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeCase(); });
  // Only a complete click on the backdrop dismisses, so selecting text is safe.
  let backdropPress = false;
  function isOutside(event) {
    const r = dialog.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  }
  dialog.addEventListener('pointerdown', event => { backdropPress = event.target === dialog && isOutside(event); });
  dialog.addEventListener('click', event => {
    if (backdropPress && event.target === dialog && isOutside(event)) closeCase();
    backdropPress = false;
  });
  function syncHash() {
    closeImage(false);
    hideEvidence(false);
    const id = location.hash.replace('#case-', '');
    if (location.hash.startsWith('#case-') && window.PORTFOLIO_CASES?.[id]) {
      const trigger = [...document.querySelectorAll(`[data-case="${id}"]`)].find(button => button.getClientRects().length);
      if (currentCase !== id || !dialog.open) openCase(id, trigger, false);
    } else if (dialog.open) closeCase(false);
  }
  window.addEventListener('popstate', syncHash);
  window.addEventListener('hashchange', syncHash);

  function notify(message) {
    const toast = document.querySelector('.toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  }
  document.querySelector('.copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('zamsonlim@gmail.com');
      notify('Email copied. Let’s talk.');
    } catch {
      notify('Email: zamsonlim@gmail.com');
      const selection = window.getSelection();
      const range = document.createRange();
      const emailLink = document.querySelector('.contact-links a[href^="mailto:"]');
      const address = [...emailLink.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes('zamsonlim@gmail.com'));
      const start = address.textContent.indexOf('zamsonlim@gmail.com');
      range.setStart(address, start);
      range.setEnd(address, start + 'zamsonlim@gmail.com'.length);
      selection.removeAllRanges(); selection.addRange(range);
    }
  });
  const navLinks = [...document.querySelectorAll('[data-section]')];
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        if (link.dataset.section === entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -55% 0px' });
  navLinks.forEach(link => sectionObserver.observe(document.getElementById(link.dataset.section)));
  const heroObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) navLinks.forEach(link => link.removeAttribute('aria-current'));
  }, { threshold: .6 });
  heroObserver.observe(document.querySelector('.hero'));

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  // A wrapping header must not cover section headings when text is enlarged.
  const headerObserver = new ResizeObserver(() => {
    const offset = header.getBoundingClientRect().height + parseFloat(getComputedStyle(header).top) + 16;
    document.documentElement.style.scrollPaddingTop = `${offset}px`;
  });
  headerObserver.observe(header);
  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  }
  menuButton.addEventListener('click', event => {
    const open = !header.classList.contains('menu-open');
    setMenu(open);
    if (open && event.detail === 0) navLinks[0].focus();
  });
  navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      setMenu(false); menuButton.focus();
    }
  });
  document.addEventListener('click', event => { if (!header.contains(event.target)) setMenu(false); });
  matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  let step = 0;
  let ruleTimer = null;
  let rulePlaying = false;
  let ruleVisible = true;
  const ruleDemo = document.querySelector('.rule-demo');
  const playRule = document.querySelector('#play-rule');
  const resetRule = document.querySelector('#reset-rule');
  function updateRulePlaybackControl() {
    playRule.textContent = rulePlaying ? 'Pause sequence' : step > 0 && step < 6 ? 'Resume sequence' : 'Play sequence';
    playRule.setAttribute('aria-pressed', String(rulePlaying));
    ruleDemo.dataset.playing = String(rulePlaying);
  }
  function stopRulePlayback() {
    clearTimeout(ruleTimer);
    ruleTimer = null;
    rulePlaying = false;
    updateRulePlaybackControl();
  }
  function renderRule(announce = false) {
    document.querySelectorAll('[data-beacon]').forEach((node, index) => node.classList.toggle('active', index < step));
    const triggered = step === 6;
    document.querySelector('.rule-output').classList.toggle('triggered', triggered);
    document.querySelector('#rule-status').textContent = triggered ? 'Sixth in the window: Potential beacon: repeated outbound SSL' : 'Each connection: Outbound SSL to a tunnel edge';
    document.querySelector('#rule-level').textContent = triggered ? '100002 · level 12' : '100001 · level 3';
    if (announce) document.querySelector('#rule-announcement').textContent = triggered ? 'Six matches in 60 seconds. Rule 100002, level 12.' : `${step} of 6 connections. Rule 100001, level 3.`;
    ruleDemo.dataset.step = String(step);
    updateRulePlaybackControl();
  }
  function advanceRulePlayback() {
    if (!rulePlaying) return;
    if (document.hidden || !ruleVisible || document.body.classList.contains('dialog-open')) {
      stopRulePlayback();
      return;
    }
    step += 1;
    if (step === 6) stopRulePlayback();
    renderRule(step === 6);
    if (rulePlaying) ruleTimer = setTimeout(advanceRulePlayback, 900);
  }
  playRule.addEventListener('click', () => {
    if (rulePlaying) {
      stopRulePlayback();
      return;
    }
    if (document.hidden || !ruleVisible || document.body.classList.contains('dialog-open')) return;
    if (step === 6) step = 0;
    document.querySelector('#rule-announcement').textContent = '';
    rulePlaying = true;
    advanceRulePlayback();
  });
  document.querySelector('#step-rule').addEventListener('click', () => {
    stopRulePlayback();
    step = (step + 1) % 7;
    renderRule(true);
  });
  resetRule.addEventListener('click', () => {
    stopRulePlayback();
    step = 0;
    renderRule(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopRulePlayback();
  });
  new MutationObserver(() => {
    if (document.body.classList.contains('dialog-open')) stopRulePlayback();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  const ruleObserver = new IntersectionObserver(entries => {
    ruleVisible = entries[0].isIntersecting;
    if (!ruleVisible) stopRulePlayback();
  }, { threshold: 0 });
  ruleObserver.observe(ruleDemo);
  renderRule();

  const imageDialog = document.querySelector('#image-dialog');
  const imageViewport = document.querySelector('.image-viewport');
  document.querySelector('#full-image').decoding = 'async';
  let imageOpener;
  function updateScrollLock() {
    document.body.classList.toggle('dialog-open', dialog.open || imageDialog.open);
  }
  function closeImage(restoreFocus = true) {
    if (!imageDialog.open) return;
    imageDialog.close();
    updateScrollLock();
    if (restoreFocus && imageOpener?.isConnected && imageOpener.getClientRects().length) imageOpener.focus({ preventScroll: true });
    imageOpener = null;
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-image]');
    if (!button) return;
    imageOpener = button;
    document.querySelector('#full-image').src = button.dataset.image;
    document.querySelector('#full-image').alt = button.dataset.caption || 'Portfolio evidence';
    document.querySelector('#image-caption').textContent = button.dataset.caption || 'Portfolio evidence';
    imageViewport.classList.remove('actual');
    document.querySelector('#actual-size').setAttribute('aria-pressed', 'false');
    imageDialog.showModal();
    document.body.classList.add('dialog-open');
    document.querySelector('#close-image').focus();
  });
  document.querySelector('#close-image').addEventListener('click', () => closeImage());
  imageDialog.addEventListener('cancel', event => { event.preventDefault(); closeImage(); });
  document.querySelector('#actual-size').addEventListener('click', event => {
    const actual = imageViewport.classList.toggle('actual');
    event.currentTarget.setAttribute('aria-pressed', String(actual));
  });
  let imageBackdropPress = false;
  function outsideImage(event) {
    const r = imageDialog.getBoundingClientRect();
    return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
  }
  imageDialog.addEventListener('pointerdown', event => { imageBackdropPress = event.target === imageDialog && outsideImage(event); });
  imageDialog.addEventListener('click', event => {
    if (event.target !== imageDialog) return;
    if (imageBackdropPress && outsideImage(event)) closeImage();
    imageBackdropPress = false;
  });

  const evidencePopover = document.querySelector('#skill-popover');
  let evidenceTrigger = null;
  let evidencePositionFrame = 0;
  evidencePopover.setAttribute('role', 'dialog');
  function hideEvidence(restoreFocus = true) {
    if (!evidencePopover.matches(':popover-open')) return;
    evidencePopover.hidePopover();
    evidenceTrigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && evidenceTrigger?.isConnected) evidenceTrigger.focus({ preventScroll: true });
  }
  function positionEvidence() {
    evidencePositionFrame = 0;
    if (!evidencePopover.matches(':popover-open') || !evidenceTrigger) return;
    const r = evidenceTrigger.getBoundingClientRect();
    if (!evidenceTrigger.getClientRects().length || r.bottom < 0 || r.top > innerHeight) {
      hideEvidence(false);
      return;
    }
    const box = evidencePopover.getBoundingClientRect();
    evidencePopover.style.left = `${Math.max(16, Math.min(r.left, innerWidth - box.width - 16))}px`;
    const below = r.bottom + 9;
    const preferred = below + box.height < innerHeight - 16 ? below : r.top - box.height - 9;
    evidencePopover.style.top = `${Math.max(16, Math.min(preferred, innerHeight - box.height - 16))}px`;
  }
  document.querySelectorAll('button.skill-chip').forEach(button => {
    button.setAttribute('aria-controls', 'skill-popover');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      evidenceTrigger?.setAttribute('aria-expanded', 'false');
      evidenceTrigger = button;
      evidencePopover.querySelector('p').textContent = button.dataset.evidence;
      evidencePopover.querySelector('a').href = `#${button.dataset.target}`;
      evidencePopover.setAttribute('aria-label', `${button.textContent.trim()} evidence`);
      evidencePopover.showPopover();
      evidencePopover.scrollTop = 0;
      button.setAttribute('aria-expanded', 'true');
      positionEvidence();
      evidencePopover.querySelector('.popover-close').focus({ preventScroll: true });
    });
  });
  evidencePopover.addEventListener('toggle', event => {
    if (event.newState === 'closed') evidenceTrigger?.setAttribute('aria-expanded', 'false');
  });
  evidencePopover.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); hideEvidence(); }
  });
  evidencePopover.addEventListener('focusout', event => {
    if (!evidencePopover.contains(event.relatedTarget)) hideEvidence(false);
  });
  evidencePopover.querySelector('.popover-close').addEventListener('click', () => hideEvidence());
  evidencePopover.querySelector('a').addEventListener('click', event => {
    const targetId = evidenceTrigger.dataset.target;
    const trigger = evidenceTrigger;
    hideEvidence(false);
    if (targetId.startsWith('case-')) {
      event.preventDefault();
      openCase(targetId.slice(5), trigger);
    } else {
      const section = document.getElementById(targetId);
      if (section) {
        section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
      }
    }
  });
  function queueEvidencePosition() {
    if (!evidencePositionFrame && evidencePopover.matches(':popover-open')) evidencePositionFrame = requestAnimationFrame(positionEvidence);
  }
  window.addEventListener('scroll', queueEvidencePosition, { passive: true });
  window.addEventListener('resize', queueEvidencePosition);
  document.querySelector('#year').textContent = new Date().getFullYear();
  syncHash();
})();
