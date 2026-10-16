import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.CHECK_SITE||'https://akclothings.shop';
const api=process.env.CHECK_API||'https://api.akclothings.shop/api';
async function html(path){const r=await fetch(base+path);return {status:r.status,text:await r.text(),robots:r.headers.get('x-robots-tag')}}
const categories=await fetch(api+'/categories?public=1').then(r=>r.json());assert.ok(categories.length<30);assert.ok(categories.every(c=>!c.slug.startsWith('dune-preview-')));
const one=await html('/shop');const two=await html('/shop?page=2');
const links=text=>[...new Set([...text.matchAll(/<a[^>]*href="(\/product\/[^"]+)"/g)].map(m=>m[1]))];
assert.equal(one.status,200);assert.equal(two.status,200);assert.ok(one.text.includes('rel="next"'));assert.ok(two.text.includes('rel="prev"'));assert.ok(!links(one.text).some(link=>links(two.text).includes(link)));assert.ok(two.text.includes('rel="canonical" href="https://akclothings.shop/shop?page=2"'));
for(const path of ['/shop?page=0','/shop?page=99999','/shop?page=999999999999','/product/no-such-product-release-check'])assert.equal((await html(path)).status,404,path);
for(const path of ['/cart','/checkout','/wishlist','/account/login','/track']){const r=await html(path);assert.ok(/noindex/.test(r.text+(r.robots||'')),path)}
const catalog=await fetch(api+'/products?pageSize=100').then(r=>r.json());
let checked=0;
for(let index=0;index<catalog.items.length;index+=5){await Promise.all(catalog.items.slice(index,index+5).map(async product=>{
 const r=await html('/product/'+product.slug);assert.equal(r.status,200);assert.ok(r.text.includes(`rel="canonical" href="https://akclothings.shop/product/${product.slug}"`));
 const schemas=[...r.text.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));
 const schema=schemas.find(s=>s['@type']==='Product');
 if(schema){assert.equal(schema.offers.length,product.variants.length);for(const v of product.variants){const offer=schema.offers.find(o=>o.sku===v.sku);assert.equal(Number(offer.price),Number(v.priceOverride??product.basePrice));assert.equal(offer.priceCurrency,'PKR');assert.equal(offer.availability,!v.isOutOfStock&&v.stockQty>0?'https://schema.org/InStock':'https://schema.org/OutOfStock')}}
 else assert.ok(schemas.some(s=>s['@type']==='ProductGroup'));
 checked++;
}));}
const redirect=await fetch('https://www.akclothings.shop/shop?category=boski&page=1',{redirect:'manual'});assert.ok([301,308].includes(redirect.status));assert.equal(redirect.headers.get('location'),'https://akclothings.shop/shop?category=boski&page=1');
const feed=await html('/feeds/products.xml');assert.equal(feed.status,200);
const result={date:new Date().toISOString(),productSchemasChecked:checked,publicCategories:categories.length,page1Products:links(one.text).length,page2Products:links(two.text).length,overlap:0,hostRedirect:redirect.status,privateNoindex:true,invalid404:true,feedItems:(feed.text.match(/<item>/g)||[]).length};
await fs.writeFile('.local/release-check.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
