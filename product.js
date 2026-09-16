'use strict';
(async function () {
 const root=document.getElementById('product-content'),params=new URLSearchParams(location.search),category=params.get('category'),id=params.get('id');
 const labels={printing:'3D Printing',merch:'Merch'};
 const preview=params.get('preview')==='1'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const url=value=>{try{if(!value)return '';const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
 function link(text,href,cls){const a=el('a',cls,text);a.href=href;return a;}
 function failure(title,text){root.replaceChildren(el('h1','',title),el('p','',text),link('← Back to collections',labels[category]?category+'.html':'index.html','btn'));}
 if(!labels[category]||!id){failure('Choose a product','Explore 3D printing or merch to open a product’s details.');return;}
 try{
 const response=await fetch(preview?'ProductPreview.json':'ProductData.json');if(!response.ok)throw Error('load');
 const data=await response.json(),items=(data[category]||[]).filter(x=>x&&typeof x.name==='string').map((x,i)=>({...x,id:x.id||category+'-'+i})),product=items.find(x=>x.id===id);
 if(!product){failure('Product not found','This product may have moved or is not available yet.');return;}
 document.title=product.name+' | Voltan Games';document.body.dataset.product=id;document.body.dataset.category=category;
 const form=document.querySelector('.top-search');form.action=category+'.html';const input=form.querySelector('input');input.placeholder='Search '+labels[category]+'…';input.setAttribute('aria-label','Search '+labels[category]);
 root.removeAttribute('aria-live');root.replaceChildren();
 if(preview)root.append(el('p','preview-notice','LOCAL DESIGN PREVIEW · Example product, images and price. Not listed in your public catalog.'));
 const crumbs=el('nav','breadcrumbs');crumbs.setAttribute('aria-label','Breadcrumb');crumbs.append(link('Home','index.html'),el('span','','/'),link(labels[category],category+'.html'),el('span','','/'),el('span','',product.name));root.append(crumbs);
 const layout=el('div','product-layout'),gallery=el('div','product-gallery'),summary=el('div','product-summary');
 let photos=Array.isArray(product.images)?product.images:[];if(!photos.length&&product.image)photos=[product.image];photos=photos.map(p=>typeof p==='string'?{src:p,alt:product.name}:p).filter(p=>p&&url(p.src));
 const stage=el('div','gallery-stage');stage.tabIndex=0;stage.setAttribute('role','region');stage.setAttribute('aria-label','Product image gallery. Use left and right arrow keys to browse.');
 const strip=el('div','gallery-strip');strip.id='gallery-strip';strip.setAttribute('aria-label','Product thumbnails');
 const controls=el('div','gallery-controls'),previous=el('button','','←'),next=el('button','','→'),count=el('span','gallery-count');count.setAttribute('aria-live','polite');previous.type=next.type='button';previous.setAttribute('aria-label','Previous image');next.setAttribute('aria-label','Next image');
 let current=0;
 function show(index,track=true){if(!photos.length)return;current=(index+photos.length)%photos.length;const photo=photos[current],img=el('img','product-main-image');img.src=url(photo.src);img.alt=photo.alt||product.name;img.addEventListener('error',()=>stage.replaceChildren(el('div','image-unavailable','Image unavailable')),{once:true});stage.replaceChildren(img);count.textContent=(current+1)+' / '+photos.length;[...strip.children].forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===current));if(track&&i===current)strip.scrollTo({left:b.offsetLeft-strip.offsetLeft-(strip.clientWidth-b.clientWidth)/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});if(track)window.UserTracker?.track('gallery_view',category+':'+id+':image-'+(current+1));}
 if(photos.length){photos.forEach((photo,i)=>{const button=el('button','thumbnail');button.type='button';button.setAttribute('aria-label','Show image '+(i+1));button.setAttribute('aria-controls','gallery-strip');const img=el('img');img.src=url(photo.src);img.alt=photo.alt||'Product view '+(i+1);img.addEventListener('error',()=>{button.replaceChildren(el('span','','View '+(i+1)));},{once:true});button.append(img);button.addEventListener('click',()=>show(i));strip.append(button);});}
 else {stage.append(el('div','image-unavailable','Product images coming soon'));count.textContent='No images yet';}
 previous.onclick=()=>show(current-1);next.onclick=()=>show(current+1);previous.disabled=next.disabled=photos.length<2;
 stage.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1));}});
 let touchX=null;stage.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});stage.addEventListener('touchend',e=>{if(touchX!==null&&Math.abs(e.changedTouches[0].clientX-touchX)>45)show(current+(e.changedTouches[0].clientX<touchX?1:-1));touchX=null;},{passive:true});
 controls.append(previous,count,next);gallery.append(stage,controls,strip);
 summary.append(el('p','eyebrow',labels[category]),el('h1','',product.name));
 const pricing=el('div','product-pricing');if(product.originalPrice)pricing.append(el('del','old-price',product.originalPrice));pricing.append(el('strong','product-price',product.price||'Price coming soon'));summary.append(pricing);
 if(product.priceNote)summary.append(el('p','product-price-note',product.priceNote));
 summary.append(el('p','product-lead',product.description||''));
 if(Array.isArray(product.features)&&product.features.length){const list=el('ul','product-highlights');product.features.forEach(f=>list.append(el('li','',f)));summary.append(list);}
 if(product.availability)summary.append(el('p','availability',product.availability));
 const platformURL=url(product.link);if(platformURL){const platformLink=link(product.linkLabel||'View on '+(product.platform||'platform')+' ↗',platformURL,'btn primary platform-link');platformLink.target='_blank';platformLink.rel='noopener noreferrer';summary.append(platformLink,el('p','platform-note','Opens the creator’s listing on '+(product.platform||'an external platform')+'.'));}else summary.append(el('p','platform-note','Platform link coming soon.'));
 summary.append(link('← Explore all '+labels[category],category+'.html','back-link'));
 layout.append(gallery,summary);root.append(layout);
 const detail=el('div','product-details'),tabs=el('div','detail-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Product information');const panels=[];
 const description=el('div','detail-panel');description.append(el('h2','','Description'));
 const blocks=Array.isArray(product.details)?product.details:[];
 if(!blocks.length)description.append(el('p','',product.longDescription||product.description||'More details coming soon.'));
 blocks.forEach(block=>{if(block.heading)description.append(el('h3','',block.heading));if(block.text)description.append(el('p','',block.text));if(url(block.image)){const img=el('img','detail-image');img.src=url(block.image);img.alt=block.alt||product.name;img.loading='lazy';img.onerror=()=>img.replaceWith(el('p','','Image unavailable'));description.append(img);}});
 panels.push(['Description',description]);
 if(product.specifications&&Object.keys(product.specifications).length){const spec=el('div','detail-panel'),table=el('dl','specifications');spec.append(el('h2','','Additional information'));Object.entries(product.specifications).forEach(([key,value])=>table.append(el('dt','',key),el('dd','',String(value))));spec.append(table);panels.push(['Specifications',spec]);}
 if(Array.isArray(product.resources)&&product.resources.some(r=>url(r.url))){const resources=el('div','detail-panel');resources.append(el('h2','','Useful resources'));product.resources.forEach(r=>{if(url(r.url)){const a=link(r.label||'View resource',url(r.url),'btn');a.target='_blank';a.rel='noopener noreferrer';resources.append(a);}});panels.push(['Resources',resources]);}
 function activate(i,focus=false){[...tabs.children].forEach((button,j)=>{button.setAttribute('aria-selected',String(i===j));button.tabIndex=i===j?0:-1;panels[j][1].hidden=i!==j;});if(focus)tabs.children[i].focus();}
 panels.forEach(([name,panel],i)=>{const button=el('button','',name);button.type='button';button.id='detail-tab-'+i;button.setAttribute('role','tab');button.setAttribute('aria-controls','detail-panel-'+i);panel.id='detail-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;button.onclick=()=>{activate(i);window.UserTracker?.track('detail_tab',category+':'+id+':'+name);};button.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();activate(e.key==='Home'?0:e.key==='End'?panels.length-1:(i+(e.key==='ArrowRight'?1:-1)+panels.length)%panels.length,true);}});tabs.append(button);});
 detail.append(tabs,...panels.map(p=>p[1]));root.append(detail);activate(0);if(photos.length)show(0,false);
 window.dispatchEvent(new CustomEvent('product-ready',{detail:{category,id}}));
 }catch{failure('Unable to load this product','Please refresh the page to try again.');}
})();



