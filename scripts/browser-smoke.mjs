import { chromium } from '../.local/browser/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const base=process.env.SMOKE_SITE||'http://localhost:3000';
const api=process.env.SMOKE_API||'http://localhost:5001/api';
const catalog=await fetch(api+'/products?pageSize=1').then(r=>r.json());
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/product/'+catalog.items[0].slug,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Enlarge photo 1',exact:true}).click();
 await page.getByRole('dialog').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});
 await page.getByRole('button',{name:'Add to Cart',exact:true}).click();await page.goto(base+'/cart',{waitUntil:'networkidle'});
 assert.ok((await page.locator('body').innerText()).includes(catalog.items[0].name));
 await page.goto(base+'/checkout',{waitUntil:'networkidle'});assert.ok((await page.locator('body').innerText()).includes('Order Summary'));
 for(const path of ['/','/collections','/shop']){await page.goto(base+path,{waitUntil:'networkidle'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Mobile horizontal overflow at '+path);await page.screenshot({path:'.local/mobile-'+(path.replaceAll('/','')||'home')+'.png',fullPage:true});}
 assert.deepEqual(errors,[]);console.log('PASS: mobile layout, photo preview, cart persistence, checkout rendering, no browser runtime errors. No order was submitted.');
}finally{await browser.close();}
