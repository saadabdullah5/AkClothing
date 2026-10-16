import { chromium } from '../.local/browser/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const data=await fetch('http://localhost:5001/api/products?pageSize=100').then(r=>r.json());
const product=data.items.find(p=>new Set(p.variants.map(v=>v.color)).size>1 && p.variants.some(v=>!v.isOutOfStock&&v.stockQty>0)) ?? data.items[0];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000/product/'+product.slug,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Enlarge photo 1',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
 for(const color of [...new Set(product.variants.map(v=>v.color))]) {
  await page.locator('.product-color').filter({hasText:color}).first().click();
  assert.equal(await page.locator('.product-color[aria-pressed=true]').count(),1);
  const current=product.variants.find(v=>v.color===color&&!v.isOutOfStock&&v.stockQty>0) ?? product.variants.find(v=>v.color===color);
  assert.ok((await page.locator('.product-price').innerText()).includes(Number(current.priceOverride??product.basePrice).toLocaleString('en-PK')));
 }
 const available=product.variants.find(v=>!v.isOutOfStock&&v.stockQty>0);
 await page.goto('http://localhost:3000/product/'+product.slug+'?variant='+available.id,{waitUntil:'networkidle'});
 assert.ok(await page.locator('.product-mobile-bar').isVisible());
 await page.locator('.product-mobile-bar').getByRole('button',{name:'Add to Cart',exact:true}).click();
 await page.getByRole('status').filter({hasText:'Added to your cart.'}).waitFor();
 await page.locator('.product-mobile-bar').getByRole('link',{name:'View cart'}).click();
 assert.ok((await page.locator('body').innerText()).includes(product.name));
 await page.goto('http://localhost:3000/product/'+product.slug,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Continue to checkout'}).click();await page.waitForURL('**/checkout');
 for(const width of [390,1440]){await page.setViewportSize({width,height:1000});await page.goto('http://localhost:3000/product/'+product.slug,{waitUntil:'networkidle'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.screenshot({path:'.local/product-redesign-'+width+'.png',fullPage:true});}
 assert.deepEqual(errors,[]);console.log('PASS: color selection and prices, preview, mobile CTA, cart persistence, direct checkout, desktop/mobile overflow, no runtime errors. No order submitted.');
} finally {await browser.close();}
