'use strict';
const catalogs = {
  games: {label:'Games', items:[], ready:false, error:false},
  printing: {label:'3D Printing', items:[], ready:false, error:false},
  merch: {label:'Merch', items:[], ready:false, error:false}
};
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeURL(value) {
  if (!value || typeof value !== 'string') return '';
  try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function cardFor(item, category, index) {
  const card = document.createElement('article');
  card.className = 'card reveal';
  card.style.setProperty('--delay', `${Math.min(index,5)*55}ms`);
  const image = document.createElement('img');
  image.className = 'card-img'; image.alt = item.name; image.loading = 'lazy'; image.decoding = 'async';
  image.addEventListener('error', () => { const fallback=document.createElement('div'); fallback.className='card-img-placeholder'; fallback.textContent='Image coming soon'; image.replaceWith(fallback); }, {once:true});
  const source = safeURL(item.image);
  if (source) { image.src=source; card.append(image); }
  else { const fallback=document.createElement('div'); fallback.className='card-img-placeholder'; fallback.textContent='Image coming soon'; card.append(fallback); }
  const content=document.createElement('div');content.className='card-content';
  content.innerHTML=`<span class="category-label">${escapeText(catalogs[category].label)}</span><h3>${escapeText(item.name)}</h3><p>${escapeText(item.description)}</p>`;
  if(item.price) {const price=document.createElement('p');price.textContent=item.price;content.append(price);}
  const url=safeURL(item.link);
  if(url){const link=document.createElement('a');link.className='btn';link.href=url;link.textContent=category==='games'?'View game details ↗':(item.linkLabel||'View product ↗');if(new URL(url).origin!==location.origin){link.target='_blank';link.rel='noopener noreferrer';}content.append(link);}
  else {const note=document.createElement('span');note.className='category-label';note.textContent='Coming soon!!!';content.append(note);}
  card.append(content);return card;
}
function matches(item, query, category) {return [item.name,item.description,...(Array.isArray(item.tags)?item.tags:[]),catalogs[category].label].join(' ').toLowerCase().includes(query.toLowerCase().trim());}
function empty(container, heading, message) {
  const panel=document.createElement('div');panel.className='empty-state';
  panel.innerHTML=`<div class="empty-icon" aria-hidden="true">◇</div><h3>${escapeText(heading)}</h3><p>${escapeText(message)}</p>`;container.append(panel);
}

const collection = document.body.dataset.catalog;
const searchForm = document.querySelector('.top-search');
const searchInput = searchForm.querySelector('input');
function featured(items) { return [...items].sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)).slice(0,3); }
function renderCategory(category) {
 const container=document.getElementById(category+'-container');if(!container)return;
 const catalog=catalogs[category], status=document.getElementById(category+'-status');container.replaceChildren();
 if(catalog.error){status.textContent='Catalog unavailable';empty(container,'Unable to load this catalog','Please refresh to try again.');return;}
 if(!catalog.ready){status.textContent='Loading featured items…';return;}
 const items=featured(catalog.items);status.textContent=items.length?'FEATURED / '+items.length+' PICKS':'FEATURED / ON THE WAY';
 if(!items.length)empty(container,'Coming soon!!!','Our '+catalog.label+' collection is on the way. Check back for our first releases.');
 items.forEach((item,i)=>container.append(cardFor(item,category,i)));
}
function renderCollection(){
 if(!collection)return;
 const container=document.getElementById('collection-grid'),query=searchInput.value.trim();container.replaceChildren();
 const categories=collection==='all'?Object.keys(catalogs):[collection];let count=0;
 for(const key of categories) catalogs[key].items.filter(item=>matches(item,query,key)).forEach(item=>container.append(cardFor(item,key,count++)));
 const pending=categories.some(key=>!catalogs[key].ready&&!catalogs[key].error),failed=categories.some(key=>catalogs[key].error),total=categories.reduce((n,key)=>n+catalogs[key].items.length,0);
 document.getElementById('collection-status').textContent=pending?'Loading catalog…':count+' '+(count===1?'result':'results')+(query?' for “'+query+'”':'')+(failed?' · Some items could not be loaded.':'');
 document.getElementById('clear-search').hidden=!query;
 if(!count&&!pending){if(failed)empty(container,'Unable to load this catalog','Please refresh to try again.');else if(!total)empty(container,'Coming soon!!!','This collection is on the way. Visit again for new releases.');else empty(container,'No matches found','Try a different word or clear your search to see all items.');}
}
function renderAll(){Object.keys(catalogs).forEach(renderCategory);renderCollection();}
if(collection){
 searchInput.value=new URLSearchParams(location.search).get('q')||'';
 function updateSearch(){const url=new URL(location.href);if(searchInput.value.trim())url.searchParams.set('q',searchInput.value);else url.searchParams.delete('q');history.replaceState(null,'',url);renderCollection();}
 searchInput.addEventListener('input',updateSearch);
 searchForm.addEventListener('submit',event=>{event.preventDefault();updateSearch();});
 document.getElementById('clear-search').addEventListener('click',()=>{searchInput.value='';updateSearch();searchInput.focus();});
}
async function readJSON(path){const response=await fetch(path);if(!response.ok)throw Error('Catalog failed to load');return response.json();}
readJSON('GameData.json').then(data=>{if(!Array.isArray(data))throw Error('Invalid game catalog');catalogs.games.items=data.map(game=>({name:game.GameTitle,description:game.GameDescriptionShort,image:game.GameIMG,link:'DynamicGame.html?id='+encodeURIComponent(game.GameID),tags:game.tags||[],featured:game.featured}));catalogs.games.ready=true;}).catch(()=>{catalogs.games.error=true;}).finally(renderAll);
readJSON('ProductData.json').then(data=>{for(const category of ['printing','merch']){if(!Array.isArray(data[category])){catalogs[category].error=true;continue;}catalogs[category].items=data[category].filter(item=>item&&typeof item.name==='string');catalogs[category].ready=true;}}).catch(()=>{catalogs.printing.error=true;catalogs.merch.error=true;}).finally(renderAll);
renderAll();
const navLinks=[...document.querySelectorAll('.site-header nav a')];
function highlightNav(){navLinks.forEach(link=>{if(collection ? link.getAttribute('href') === collection+'.html' : link.hash === (location.hash||'#home'))link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
window.addEventListener('hashchange',highlightNav);highlightNav();
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.animate([{opacity:.35,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'ease-out'});
        sectionObserver.unobserve(entry.target);
      }
    });
  }, {threshold:0.04});
  document.querySelectorAll('.studio main > section').forEach(section=>sectionObserver.observe(section));
}
