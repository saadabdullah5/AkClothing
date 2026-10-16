import fs from 'node:fs/promises';
const base = process.env.AUDIT_SITE || 'https://akclothings.shop';
const api = process.env.AUDIT_API || 'https://api.akclothings.shop/api';
const out = process.argv[2] || '.local/seo-baseline.json';
async function get(url) { const start = Date.now(); const r = await fetch(url, {signal:AbortSignal.timeout(45000)}); return {status:r.status,robots:r.headers.get("x-robots-tag"),ms:Date.now()-start,text:await r.text()}; }
const products=[];
for(let page=1;;page++){const r=await get(`${api}/products?pageSize=100&page=${page}`);if(r.status!==200)throw Error(r.text);const data=JSON.parse(r.text);products.push(...data.items);if(products.length>=data.total)break;}
const categories=JSON.parse((await get(`${api}/categories`)).text);
const queue=['/']; const seen=new Set(); const pages=[]; const discovered=new Set();
while(queue.length && seen.size<400){
 const batch=queue.splice(0,5).filter(p=>!seen.has(p));batch.forEach(p=>seen.add(p));
 const results=await Promise.all(batch.map(async path=>{try{return {path,...await get(base+path)}}catch(e){return {path,status:0,text:'',error:e.message}}}));
 for(const r of results){
  const hrefs=[...r.text.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
  for(const href of hrefs){let u;try{u=new URL(href,base)}catch{continue}if(u.origin!==base)continue;const path=u.pathname+u.search;if(u.pathname.startsWith('/product/'))discovered.add(u.pathname);if(!/^\/(?:$|shop(?:\?|$)|collections(?:\/|$)|product\/)/.test(path))continue;if([...u.searchParams.keys()].some(k=>!['category','page'].includes(k)))continue;if(!seen.has(path)&&!queue.includes(path))queue.push(path);}
  pages.push({path:r.path,status:r.status,robots:r.robots,ms:r.ms,bytes:Buffer.byteLength(r.text),canonical:r.text.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1],productLinks:[...new Set(hrefs.filter(h=>h.startsWith('/product/')))],noindex:/noindex/.test(r.robots || "") || /name="robots"[^>]*content="[^"]*noindex/.test(r.text)});
 }
}
const probes=await Promise.all(['/cart','/checkout','/wishlist','/account/login','/track','/shop?page=0','/shop?page=99999'].map(async path=>{const r=await get(base+path);return {path,status:r.status,noindex:/noindex/.test((r.robots || "")+r.text)}}));
const sitemap=await get(base+'/sitemap.xml');
const report={date:new Date().toISOString(),base,catalogCount:products.length,categories,products,discoveredCount:discovered.size,orphans:products.filter(p=>!discovered.has('/product/'+p.slug)).map(p=>p.slug),sitemapUrls:[...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]),pages,probes};
await fs.mkdir('.local',{recursive:true});await fs.writeFile(out,JSON.stringify(report,null,2));console.log(JSON.stringify({file:out,products:products.length,crawled:pages.length,orphans:report.orphans.length,sitemap:report.sitemapUrls.length,probes}));

