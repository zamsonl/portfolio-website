(() => {
  'use strict';
  const root = document.querySelector('#soc-live');
  if (!root || !window.SOC_WORLD) return;
  const $ = id => document.getElementById(id);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const card = document.querySelector('.soc-card');
  const toggle = $('soc-motion-toggle');
  const animations = [];
  const transientAnimations = new Set();
  const routes = new Map();
  const interval = 2000;
  let visible = false, cardVisible = false, userPaused = motion.matches;
  let timer = 0, tick = 0, sequence = 0, mode = 'map';
  let total = 0, matches = 0, blocked = 0;
  let events = [], samples = [], endpoints = new Set();
  const coverage = new Map();
  const templates = [
    { name:'HTTPS session established', city:'london', protocol:'HTTPS', volume:42, verdict:'allowed' },
    { name:'DNS query resolved', city:'tokyo', protocol:'DNS', volume:15, verdict:'allowed' },
    { name:'Repeated outbound SSL', city:'frankfurt', protocol:'TLS', volume:76, verdict:'review', technique:'Command & control' },
    { name:'Endpoint heartbeat', city:'sydney', protocol:'TLS', volume:23, verdict:'allowed' },
    { name:'Credential access detected', city:'new_york', protocol:'HTTPS', volume:60, verdict:'blocked', technique:'Credential access' },
    { name:'Package download verified', city:'san_francisco', protocol:'HTTPS', volume:94, verdict:'allowed' },
    { name:'Script execution matched', city:'london', protocol:'TLS', volume:36, verdict:'review', technique:'Execution' },
    { name:'Outbound session allowed', city:'tokyo', protocol:'HTTPS', volume:57, verdict:'allowed' },
    { name:'Host discovery detected', city:'frankfurt', protocol:'SSH', volume:32, verdict:'review', technique:'Discovery' },
    { name:'Policy blocked connection', city:'new_york', protocol:'SSH', volume:18, verdict:'blocked' },
    { name:'Sensor telemetry received', city:'sydney', protocol:'TLS', volume:48, verdict:'allowed' },
    { name:'Repeated outbound SSL', city:'san_francisco', protocol:'TLS', volume:84, verdict:'review', technique:'Command & control' }
  ];
  const cities = { london:'London', frankfurt:'Frankfurt', tokyo:'Tokyo', sydney:'Sydney', new_york:'New York', san_francisco:'San Francisco' };
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function svg(tag, attributes, parent) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value);
    parent.append(el);
    return el;
  }
  function clock(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  }
  function register(el, frames, duration, group, offset = 0) {
    const animation = el.animate(frames, { duration, iterations:Infinity, easing:'linear', fill:'both' });
    animation.pause();
    animation.currentTime = offset;
    animations.push({ animation, group, offset });
  }
  function makeMap() {
    const points = window.SOC_WORLD.points;
    const hub = points.kuala_lumpur;
    $('soc-land').setAttribute('d', window.SOC_WORLD.path);
    for (const [index, key] of Object.keys(cities).entries()) {
      const from = points[key];
      const control = [(from[0] + hub[0]) / 2, Math.min(from[1],hub[1]) - Math.min(105,Math.abs(from[0]-hub[0])*.2+25)];
      const path = svg('path', { d:`M${from} Q${control} ${hub}`, class:'soc-route' }, $('soc-routes'));
      routes.set(key,path);
      svg('circle',{cx:from[0],cy:from[1],r:3.5,class:'soc-city'},$('soc-locations'));
      if (key !== 'frankfurt') {
        const label=svg('text',{x:from[0],y:from[1]-12,'text-anchor':'middle',class:'soc-city-label'},$('soc-locations'));
        label.textContent=cities[key];
      }
      for (let direction=0;direction<2;direction++) {
        const packet=svg('circle',{r:direction?2.6:3.4,class:`soc-map-packet${direction?' outbound':''}`},$('soc-map-packets'));
        const frames=Array.from({length:41},(_,i)=>{
          const progress=i/40, t=direction?1-progress:progress, u=1-t;
          const x=u*u*from[0]+2*u*t*control[0]+t*t*hub[0];
          const y=u*u*from[1]+2*u*t*control[1]+t*t*hub[1];
          return {transform:`translate(${x}px,${y}px)`,opacity:i===0||i===40?0:.95,offset:progress};
        });
        register(packet,frames,4800+index*320,'map',index*610+direction*2400);
      }
    }
    svg('circle',{cx:hub[0],cy:hub[1],r:16,class:'soc-hub-ring'},$('soc-locations'));
    svg('circle',{cx:hub[0],cy:hub[1],r:8,class:'soc-hub-ring'},$('soc-locations'));
    svg('circle',{cx:hub[0],cy:hub[1],r:4,fill:'#d9c8ff'},$('soc-locations'));
    const label=svg('text',{x:hub[0]-12,y:hub[1]+27,'text-anchor':'end',class:'soc-city-label'},$('soc-locations'));
    label.textContent='KUALA LUMPUR';
  }
  function makeHighway() {
    const protocols=['TLS','DNS','HTTPS','SSH'];
    for(let lane=0;lane<4;lane++) {
      for(let item=0;item<3;item++) {
        const candidates=templates.filter(event=>event.protocol===protocols[lane]);
        const event=candidates[item%candidates.length];
        const size=.6+event.volume/100;
        const packet=svg('rect',{x:-6,y:-3,width:12,height:6,rx:2,class:`soc-highway-packet${event.verdict!=='allowed'?' inspect':''}`},$('soc-highway-packets'));
        const start=[381+lane*46,110], end=[105+lane*230,387];
        const frames=Array.from({length:51},(_,i)=>{
          const progress=i/50;
          const t=Math.pow(lane%2?1-progress:progress,1.65);
          return {transform:`translate(${start[0]+(end[0]-start[0])*t}px,${start[1]+(end[1]-start[1])*t}px) scale(${(.35+t*1.65)*size})`,opacity:i===0||i===50?0:.95,offset:progress};
        });
        register(packet,frames,4600+lane*400,'highway',item*1550+lane*310);
      }
    }
  }
  function ingest() {
    const template=templates[sequence%templates.length];
    const event={...template,host:`lab-ws-${String(sequence%8+1).padStart(2,'0')}`,time:clock(sequence*2)};
    sequence++; total++; endpoints.add(event.host);
    if(event.technique) { matches++; coverage.set(event.technique,(coverage.get(event.technique)||0)+1); }
    if(event.verdict==='blocked') blocked++;
    events.unshift(event); events=events.slice(0,36);
    samples.push(event.volume); samples=samples.slice(-30);
  }
  function render(animateNewEvent=false) {
    $('soc-total').textContent=total.toLocaleString();
    $('soc-endpoints').textContent=endpoints.size;
    $('soc-matches').textContent=matches.toLocaleString();
    $('soc-blocked').textContent=blocked.toLocaleString();
    root.dataset.tick=tick;
    $('soc-stream-clock').textContent=events[0].time;
    const feed=$('soc-event-feed');
    feed.replaceChildren(...events.slice(0,4).map(event=>{
      const row=node('li');
      const dot=node('i',`soc-event-dot ${event.verdict}`);dot.setAttribute('aria-hidden','true');
      const copy=node('div','soc-event-copy');
      copy.append(node('strong','',event.name),node('span','',`${event.host} · ${event.protocol} · ${cities[event.city]}`));
      row.append(dot,copy,node('span','soc-event-time',event.time));return row;
    }));
    for(const animation of transientAnimations) {animation.cancel();transientAnimations.delete(animation);}
    if(animateNewEvent && !motion.matches) {
      const animation=feed.firstElementChild.animate([{opacity:.35,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'cubic-bezier(.23,1,.32,1)'});
      transientAnimations.add(animation);
      animation.onfinish=()=>transientAnimations.delete(animation);
    }
    const values=Array(30-samples.length).fill(0).concat(samples);
    [...$('soc-activity-bars').children].forEach((bar,i)=>bar.firstElementChild.style.transform=`scaleY(${Math.max(.035,values[i]/100)})`);
    $('soc-activity-bars').setAttribute('aria-label',`Recent simulated traffic volume. ${samples.at(-1)||0} relative units in the latest sample.`);
    document.querySelectorAll('[data-technique]').forEach(cell=>{
      const count=coverage.get(cell.dataset.technique)||0;
      cell.querySelector('strong').textContent=count;
      cell.querySelector('i').style.transform=`scaleX(${matches?count/matches:0})`;
    });
    const detections=events.filter(event=>event.technique).slice(0,4);
    const latest=detections[0];
    $('soc-rule-name').textContent=latest.name;
    $('soc-rule-verdict').textContent=latest.verdict==='blocked'?'Blocked':'Review';
    $('soc-rule-detail').textContent=`${latest.host} · ${latest.protocol} · ${latest.technique}`;
    $('soc-detection-list').replaceChildren(...detections.slice(0,3).map(event=>{
      const row=node('div','soc-detection-row');
      row.append(node('span','',event.time),node('strong','',event.name),node('span','',event.host));return row;
    }));
    routes.forEach((route,key)=>route.classList.toggle('soc-route-active',key===events[0].city));
  }
  function seed() {
    tick=0;sequence=0;total=0;matches=0;blocked=0;events=[];samples=[];endpoints=new Set();coverage.clear();
    for(let i=0;i<12;i++) ingest();
    render();
  }
  function syncPlayback() {
    const available=!document.hidden && !document.body.classList.contains('dialog-open');
    const running=visible && !userPaused && available;
    root.dataset.running=String(running);
    card.dataset.flow=String(cardVisible && !userPaused && available && !motion.matches);
    toggle.setAttribute('aria-pressed',String(userPaused));
    toggle.setAttribute('aria-label',`${userPaused?'Resume':'Pause'} simulated activity`);
    toggle.querySelector('span').textContent=userPaused?'Resume':'Pause';
    toggle.querySelector('path').setAttribute('d',userPaused?'M5 3 12 8 5 13Z':'M5 3v10M11 3v10');
    $('soc-playback-state').textContent=userPaused?'Simulation paused':running?'Simulation running':'Simulation ready';
    for(const entry of animations) {
      if(running && !motion.matches && entry.group===mode) entry.animation.play();
      else entry.animation.pause();
    }
    for(const animation of transientAnimations) {
      if(motion.matches) {animation.cancel();transientAnimations.delete(animation);}
      else if(running) animation.play();
      else animation.pause();
    }
    // Freeze brief chart transitions too when the simulation is paused mid-update.
    for(const animation of root.getAnimations({subtree:true})) {
      if(!(animation instanceof CSSTransition)) continue;
      if(running && !motion.matches) animation.play();
      else animation.pause();
    }
    if(running && !timer) timer=setInterval(()=>{tick++;ingest();render(true);},interval);
    else if(!running && timer) { clearInterval(timer);timer=0; }
  }
  window.SOCPreview={select(next){
    if(!['map','alerts','highway'].includes(next)) return;
    mode=next;root.dataset.mode=mode;
    root.querySelectorAll('[data-scene]').forEach(scene=>scene.hidden=scene.dataset.scene!==mode);
    $('soc-scene-label').textContent={map:'Global traffic',alerts:'Detection pipeline',highway:'Packet flow'}[mode];
    $('soc-scene-meta').textContent={map:'INGRESS / EGRESS',alerts:'OBSERVE / CORRELATE',highway:'PROTOCOL LANES'}[mode];
    syncPlayback();
  }};
  toggle.addEventListener('click',()=>{
    userPaused=!userPaused;syncPlayback();
    $('soc-playback-announcement').textContent=userPaused?'Simulated activity paused.':'Simulated activity resumed.';
  });
  $('soc-replay').addEventListener('click',()=>{
    if(timer){clearInterval(timer);timer=0;}
    seed();
    animations.forEach(entry=>entry.animation.currentTime=entry.offset);
    syncPlayback();
    $('soc-playback-announcement').textContent='Simulation reset to the beginning.';
  });
  motion.addEventListener('change',()=>{if(motion.matches)userPaused=true;syncPlayback();});
  document.addEventListener('visibilitychange',syncPlayback);
  new MutationObserver(syncPlayback).observe(document.body,{attributes:true,attributeFilter:['class']});
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries) {
      if(entry.target===root) visible=entry.isIntersecting;
      else if(entry.target===card) cardVisible=entry.isIntersecting;
    }
    syncPlayback();
  },{threshold:0});
  for(let i=0;i<30;i++){const bar=node('span','soc-bar');bar.append(node('i'));$('soc-activity-bars').append(bar);}
  makeMap();makeHighway();
  document.querySelectorAll('.soc-route-step').forEach((step,index)=>register(step,[{transform:'scaleX(.08)',opacity:.3},{transform:'scaleX(1)',opacity:1},{transform:'scaleX(1)',opacity:.3}],2400,'alerts',index*800));
  seed();
  root.hidden=false;
  $('demo-preview').hidden=true;
  observer.observe(root);observer.observe(card);syncPlayback();
})();
