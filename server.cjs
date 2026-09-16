'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const ALLOWED_TYPES=new Set(['page_view','section_view','product_view','link_click','outbound_click','gallery_view','detail_tab','search']);
const ROOT=__dirname;
function createServer({dataDir=process.env.ANALYTICS_DATA_DIR||path.join(ROOT,'.analytics'),port=Number(process.env.PORT||5510)}={}){
 fs.mkdirSync(dataDir,{recursive:true});const file=path.join(dataDir,'events.json');let events=[];
 if(fs.existsSync(file)){const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(saved))throw Error('Invalid analytics store');events=saved;}
 const retention=30*86400000,limit=20000,rates=new Map();
 function prune(){events=events.filter(e=>e.time>Date.now()-retention).slice(-limit);}
 function save(){prune();const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(events));fs.renameSync(tmp,file);}
 function cleanPage(value){if(typeof value!=='string'||value.length>240)return null;try{const u=new URL(value,'http://local/');if(u.origin!=='http://local')return null;const name=u.pathname.split('/').pop()||'index.html';if(!/^[a-zA-Z0-9-]+\.html$/.test(name))return null;const params=new URLSearchParams();for(const key of ['category','id'])if(u.searchParams.has(key))params.set(key,u.searchParams.get(key).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,100));return name+(params.size?'?'+params:'');}catch{return null;}}
 function cleanTarget(type,value){if(typeof value!=='string')return '';if(type==='outbound_click'||type==='link_click'){try{const u=new URL(value,'http://local/');if(!['http:','https:'].includes(u.protocol))return '';if(type==='outbound_click')return (u.origin+u.pathname).slice(0,180);return '/'+cleanPage(u.pathname+u.search)+(u.hash.match(/^#[\w-]+$/)?u.hash:'');}catch{return '';}}return value.replace(/[^a-zA-Z0-9_: .-]/g,'').slice(0,180);}
 function aggregate(days){prune();const data=events.filter(e=>e.time>Date.now()-days*86400000),pages=new Map(),sections=new Map(),products=new Map(),links=new Map(),paths=new Map(),daily=new Map(),last=new Map();
 const add=(map,key)=>map.set(key,(map.get(key)||0)+1);
 for(const e of data){if(e.type==='page_view'){add(pages,e.page);const date=new Date(e.time).toISOString().slice(0,10);if(!daily.has(date))daily.set(date,{views:0,visitors:new Set()});daily.get(date).views++;daily.get(date).visitors.add(e.visitor);if(last.has(e.session)&&last.get(e.session)!==e.page)add(paths,last.get(e.session)+' → '+e.page);last.set(e.session,e.page);}if(e.type==='section_view')add(sections,e.target);if(e.type==='product_view')add(products,e.target);if(e.type==='outbound_click'||e.type==='link_click')add(links,e.target);}
 const rank=map=>[...map].sort((a,b)=>b[1]-a[1]).slice(0,30).map(([label,count])=>({label,count}));
 return {generatedAt:new Date().toISOString(),days,retentionDays:30,totals:{visitors:new Set(data.map(e=>e.visitor)).size,sessions:new Set(data.map(e=>e.session)).size,pageViews:data.filter(e=>e.type==='page_view').length,clicks:data.filter(e=>['outbound_click','link_click'].includes(e.type)).length,productViews:data.filter(e=>e.type==='product_view').length,galleryViews:data.filter(e=>e.type==='gallery_view').length,searches:data.filter(e=>e.type==='search').length},pages:rank(pages),sections:rank(sections),products:rank(products),links:rank(links),journeys:rank(paths),daily:[...daily].sort().map(([date,x])=>({date,views:x.views,visitors:x.visitors.size}))};
 }
 const server=http.createServer((req,res)=>{
  const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  const host=req.headers.host,validHosts=new Set(['localhost:'+port,'127.0.0.1:'+port]);if(!validHosts.has(host))return json(403,{error:'Local access only'});
  if(req.headers.origin&&!['http://localhost:'+port,'http://127.0.0.1:'+port].includes(req.headers.origin))return json(403,{error:'Origin not allowed'});
  const u=new URL(req.url,'http://'+host);
  if(u.pathname==='/api/analytics-status'&&req.method==='GET')return json(200,{enabled:true,mode:'local'});
  if(u.pathname==='/api/summary'&&req.method==='GET'){const days=Number(u.searchParams.get('days')||30);return json(200,aggregate([1,7,30].includes(days)?days:30));}
  if(u.pathname==='/api/events'&&req.method==='POST'){
   if(!String(req.headers['content-type']).startsWith('application/json'))return json(415,{error:'JSON required'});
   let raw='',tooLarge=false;req.on('data',chunk=>{if(tooLarge)return;if(Buffer.byteLength(raw)+chunk.length>4096){tooLarge=true;raw='';json(413,{error:'Event too large'});return;}raw+=chunk;});req.on('end',()=>{if(tooLarge)return;
    try{const e=JSON.parse(raw),page=cleanPage(e.page);if(!ALLOWED_TYPES.has(e.type)||!page||!/^[-a-zA-Z0-9]{16,64}$/.test(e.visitor)||!/^[-a-zA-Z0-9]{16,64}$/.test(e.session))return json(400,{error:'Invalid event'});
    const now=Date.now(),rate=rates.get(e.visitor)||{time:now,count:0};if(now-rate.time>60000){rate.time=now;rate.count=0;}if(++rate.count>120)return json(429,{error:'Rate limited'});rates.set(e.visitor,rate);if(rates.size>10000)rates.clear();
    events.push({type:e.type,page,target:cleanTarget(e.type,e.target),visitor:e.visitor,session:e.session,time:now});save();return json(202,{ok:true});
    }catch(error){return json(error instanceof SyntaxError?400:500,{error:error instanceof SyntaxError?'Invalid event':'Unable to save event'});}
   });return;
  }
  if(u.pathname.startsWith('/api/'))return json(404,{error:'Not found'});
  if(!['GET','HEAD'].includes(req.method))return json(405,{error:'Method not allowed'});
  let name;try{name=decodeURIComponent(u.pathname);}catch{return json(400,{error:'Invalid path'});}
  if(name==='/')name='/index.html';
  // Only public website formats. Hidden folders, source servers and analytics data never leave disk.
  if(name.split('/').some(x=>x.startsWith('.')||x==='node_modules')||!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(html|css|js|json|png|jpg|jpeg|gif|webp|svg|ico|pdf)$/i.test(name))return json(404,{error:'Not found'});
  const resolved=path.resolve(ROOT,'.'+name);if(!resolved.startsWith(ROOT+path.sep))return json(404,{error:'Not found'});
  fs.readFile(resolved,(err,body)=>{if(err)return json(404,{error:'Not found'});const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.gif':'image/gif','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.pdf':'application/pdf'};res.writeHead(200,{'Content-Type':mime[path.extname(resolved)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);});
 });
 return server;
}
if(require.main===module){const port=Number(process.env.PORT||5510);createServer({port}).listen(port,'127.0.0.1',()=>console.log('Local website: http://127.0.0.1:'+port+'\nOwner dashboard: http://127.0.0.1:'+port+'/UserTracker.html'));}
module.exports={createServer};

