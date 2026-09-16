'use strict';
// Collector is optional. Static hosting remains fully functional without it.
(async function(){
 if(location.pathname.endsWith('/UserTracker.html'))return;
 const endpoint='/api/events';let enabled=false,visitor='',session='',choice='',available=false;
 const blocked=navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true;
 const read=(storage,key)=>{try{return storage.getItem(key);}catch{return null;}};
 const write=(storage,key,value)=>{try{storage.setItem(key,value);}catch{}};
 const identity=storage=>{let value=read(storage,'vg.analytics.id');if(!value){value=crypto.randomUUID();write(storage,'vg.analytics.id',value);}return value;};
 function page(){const p=location.pathname.split('/').pop()||'index.html',params=new URLSearchParams(location.search);return p+(['Product.html','DynamicGame.html'].includes(p)?'?'+new URLSearchParams([...params].filter(([k])=>['category','id'].includes(k))).toString():'');}
 const seen=new Set();
 function track(type,target=''){
  if(!enabled||blocked||!available||new URLSearchParams(location.search).has('preview'))return;
  const event={type,page:page(),target:String(target).slice(0,180),visitor,session};
  fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),keepalive:true}).catch(()=>{});
 }
 window.UserTracker={track};
 function activate(){enabled=true;visitor=identity(localStorage);session=identity(sessionStorage);track('page_view');if(document.body.dataset.product)track('product_view',document.body.dataset.category+':'+document.body.dataset.product);observeSections();}
 window.addEventListener('product-ready',e=>track('product_view',e.detail.category+':'+e.detail.id));
 let observer;
 function observeSections(){if(observer||!('IntersectionObserver'in window))return;observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&!seen.has(e.target.id)&&document.visibilityState==='visible'){seen.add(e.target.id);track('section_view',e.target.id);}}),{threshold:.15});document.querySelectorAll('main > section[id], #home').forEach(section=>observer.observe(section));}
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;let u;try{u=new URL(a.href);}catch{return;}if(!['http:','https:'].includes(u.protocol))return;let target;if(u.origin===location.origin){const params=new URLSearchParams([...u.searchParams].filter(([k])=>['category','id'].includes(k)));target=u.pathname+(params.size?'?'+params:'')+u.hash;}else target=u.origin+u.pathname;track(u.origin===location.origin?'link_click':'outbound_click',target);});
 document.addEventListener('submit',e=>{if(e.target.matches('.top-search'))track('search',document.body.dataset.catalog||document.body.dataset.category||'all');});
 let searchTimer;document.addEventListener('input',e=>{if(e.target.matches('.top-search input')){clearTimeout(searchTimer);searchTimer=setTimeout(()=>track('search',document.body.dataset.catalog||document.body.dataset.category||'all'),1200);}});
 function preferences(){document.getElementById('analytics-choice')?.remove();const panel=document.createElement('aside');panel.id='analytics-choice';panel.setAttribute('aria-label','Analytics preferences');panel.innerHTML='<strong>Help improve Voltan Games</strong><p>Allow usage statistics about pages, sections and links you explore? A random browser ID helps count visits. No names, search text or trading amounts are collected.</p><div><button data-choice="yes">Allow analytics</button><button data-choice="no">No thanks</button></div>';panel.querySelectorAll('button').forEach(button=>button.onclick=()=>{choice=button.dataset.choice;write(localStorage,'vg.analytics.choice',choice);enabled=false;if(choice==='yes')activate();else{try{localStorage.removeItem('vg.analytics.id');sessionStorage.removeItem('vg.analytics.id');}catch{}}panel.remove();});document.body.append(panel);}
 try{const response=await fetch('/api/analytics-status',{cache:'no-store'});if(!response.ok)return;const status=await response.json();available=status.enabled===true;}catch{return;}
 if(!available||blocked)return;
 const css=document.createElement('link');css.rel='stylesheet';css.href='tracker.css';document.head.append(css);
 const button=document.createElement('button');button.className='analytics-preferences';button.textContent='Analytics preferences';button.onclick=preferences;(document.querySelector('footer')||document.body).append(button);
 choice=read(localStorage,'vg.analytics.choice');if(choice==='yes')activate();else if(choice!=='no')preferences();
})();

