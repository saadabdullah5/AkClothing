import fs from 'node:fs/promises';
import lighthouse from '../.local/browser/node_modules/lighthouse/core/index.js';
import * as chromeLauncher from '../.local/browser/node_modules/chrome-launcher/dist/index.js';
const label=process.argv[2]||'before';
const catalog=await fetch('https://api.akclothings.shop/api/products?pageSize=1').then(r=>r.json());
const urls=['https://akclothings.shop/','https://akclothings.shop/shop?category=dhanak-fabric','https://akclothings.shop/product/'+catalog.items[0].slug];
const chrome=await chromeLauncher.launch({chromePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',chromeFlags:['--headless=new','--no-sandbox']});
const results=[];
try{for(const url of urls){const {lhr}=await lighthouse(url,{port:chrome.port,output:'json',onlyCategories:['performance'],logLevel:'error'});const a=lhr.audits;results.push({url,score:lhr.categories.performance.score,LCP:a['largest-contentful-paint']?.numericValue,CLS:a['cumulative-layout-shift']?.numericValue,TBT:a['total-blocking-time']?.numericValue,transferBytes:a['total-byte-weight']?.numericValue,error:lhr.runtimeError});console.log(JSON.stringify(results.at(-1)));await fs.writeFile(`.local/lab-${label}.json`,JSON.stringify(results,null,2));}}finally{await chrome.kill();}
