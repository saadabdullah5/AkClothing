// Run only for actual published additions/updates/removals. No requests at build time.
const key=process.env.INDEXNOW_KEY;
if(!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key))throw Error('Configure INDEXNOW_KEY in the frontend host and this process first.');
const urlList=process.argv.slice(2).map(value=>{const url=new URL(value);if(url.origin!=='https://akclothings.shop')throw Error('Only canonical store URLs are allowed');return url.href});
if(!urlList.length || urlList.length>10000)throw Error('Supply 1–10000 changed canonical URLs.');
const response=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:'akclothings.shop',key,keyLocation:'https://akclothings.shop/indexnow-key.txt',urlList})});
console.log('IndexNow HTTP',response.status);if(!response.ok)process.exitCode=1;
