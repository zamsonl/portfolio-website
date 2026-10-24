(() => {
  'use strict';
  const buttons=[...document.querySelectorAll('[data-work]')];
  const panels=[...document.querySelectorAll('[data-work-panel]')];
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let entrance;
  function select(button, animate=false) {
    if(button.getAttribute('aria-pressed')==='true')return;
    entrance?.cancel();
    buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    panels.forEach(panel=>panel.hidden=panel.dataset.workPanel!==button.dataset.work);
    document.getElementById('spotlight-position').textContent=`${String(buttons.indexOf(button)+1).padStart(2,'0')} / ${String(buttons.length).padStart(2,'0')}`;
    const panel=panels.find(item=>!item.hidden);
    if(animate&&!motion.matches)entrance=panel.animate([{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'cubic-bezier(.23,1,.32,1)'});
  }
  buttons.forEach((button,index)=>{
    button.addEventListener('click',event=>select(button,event.detail>0));
    button.addEventListener('keydown',event=>{
      const next=event.key==='ArrowRight'?(index+1)%buttons.length:event.key==='ArrowLeft'?(index+buttons.length-1)%buttons.length:event.key==='Home'?0:event.key==='End'?buttons.length-1:null;
      if(next===null)return;
      event.preventDefault();buttons[next].focus();select(buttons[next]);
    });
  });
  motion.addEventListener('change',()=>{if(motion.matches)entrance?.cancel();});
})();
