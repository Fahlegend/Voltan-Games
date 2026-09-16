const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer}=require('../server.cjs');
test('analytics stores only bounded, sanitized events and keeps owner data off the public surface',async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'vg-analytics-'));const port=15519;let server=createServer({dataDir,port});await new Promise(r=>server.listen(port,'127.0.0.1',r));
 const base='http://127.0.0.1:'+port,post=(event,headers={})=>fetch(base+'/api/events',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(event)});
 const event={type:'page_view',page:'index.html?q=private-text',visitor:'visitor-000000000001',session:'session-000000000001',email:'DO-NOT-STORE'};
 try{
 assert.equal((await post(event)).status,202);
 assert.equal((await post({...event,page:'Product.html?category=printing&id=stand&email=secret'})).status,202);
 assert.equal((await post({...event,type:'product_view',target:'printing:stand'})).status,202);
 assert.equal((await post({...event,type:'outbound_click',target:'https://makerworld.com/@Voltan_Games?token=SECRET'})).status,202);
 assert.equal((await post({...event,type:'invalid'})).status,400);
 assert.equal((await post(event,{Origin:'https://evil.example'})).status,403);
 const badHost=await new Promise((resolve,reject)=>{require('node:http').get(base+'/api/summary',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);});assert.equal(badHost,403);
 assert.equal((await post({...event,extra:'a'.repeat(5000)})).status,413);
 assert.equal((await fetch(base+'/.analytics/events.json')).status,404);
 assert.equal((await fetch(base+'/.publish-repo/index.html')).status,404);
 assert.equal((await fetch(base+'/server.cjs')).status,404);
 const report=await(await fetch(base+'/api/summary?days=7')).json();assert.equal(report.totals.visitors,1);assert.equal(report.totals.pageViews,2);assert.equal(report.totals.productViews,1);assert.equal(report.totals.clicks,1);assert.equal(report.journeys.length,1);
 const raw=fs.readFileSync(path.join(dataDir,'events.json'),'utf8');for(const secret of ['DO-NOT-STORE','private-text','SECRET','email=secret'])assert.ok(!raw.includes(secret),secret);
 await new Promise(r=>server.close(r));server=createServer({dataDir,port});await new Promise(r=>server.listen(port,'127.0.0.1',r));const persisted=await new Promise((resolve,reject)=>require('node:http').get(base+'/api/summary',{agent:false},res=>{let s='';res.on('data',c=>s+=c);res.on('end',()=>resolve(JSON.parse(s)));}).on('error',reject));assert.equal(persisted.totals.pageViews,2);
 }finally{await new Promise(r=>server.close(r));assert.ok(path.resolve(dataDir).startsWith(path.resolve(os.tmpdir())+path.sep+'vg-analytics-'));fs.rmSync(dataDir,{recursive:true,force:true});}
});


