(() => {
  'use strict';
  const notebook = document.querySelector('.lab-notebook');
  if (!notebook) return;
  const choices = [...notebook.querySelectorAll('[data-notebook-choice]')];
  const panels = [...notebook.querySelectorAll('[data-notebook-panel]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let entrance;
  function reveal(element, pointer) {
    entrance?.cancel();
    if (pointer && !motion.matches) {
      entrance = element.animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});
    }
  }
  function select(button, pointer = false) {
    if (button.getAttribute('aria-pressed') === 'true') return;
    choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    const selected = panels.find(panel => panel.dataset.notebookPanel === button.dataset.notebookChoice);
    panels.forEach(panel => {panel.hidden = panel !== selected;});
    reveal(selected, pointer);
  }
  function keyboardGroup(buttons, action) {
    buttons.forEach((button,index) => {
      button.addEventListener('keydown', event => {
        const next = event.key === 'ArrowRight' ? (index+1)%buttons.length : event.key === 'ArrowLeft' ? (index+buttons.length-1)%buttons.length : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length-1 : null;
        if (next === null) return;
        event.preventDefault(); buttons[next].focus(); action(buttons[next]);
      });
    });
  }
  choices.forEach(button => button.addEventListener('click', event => select(button, event.detail > 0)));
  keyboardGroup(choices, button => select(button));
  motion.addEventListener('change', () => { if(motion.matches) entrance?.cancel(); });
})();
