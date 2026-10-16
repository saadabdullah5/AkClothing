const path=require('node:path');
require('../backend/node_modules/dotenv').config({path:path.resolve('backend/.env')});
const {PrismaClient}=require('../backend/node_modules/@prisma/client');
const assert=require('node:assert/strict');const crypto=require('node:crypto');
assert.equal(new URL(process.env.DATABASE_URL).hostname,'127.0.0.1','Integration fixtures may only use the local database');
const db=new PrismaClient();const api='http://localhost:5001/api';const site='http://localhost:3000';
async function request(url,body){const response=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});assert.ok(response.ok,`${url}: ${response.status} ${await response.clone().text()}`);return response.json()}
(async()=>{let category;let order;
try {
 const id=crypto.randomUUID();category=await db.category.create({data:{name:'Catalog test '+id,slug:'catalog-test-'+id}});
 for(let i=0;i<25;i++)await db.product.create({data:{name:`Test fabric ${i}`,slug:`catalog-test-${id}-${i}`,description:'Test-only fabric listing',basePrice:100,categoryId:category.id,status:'ACTIVE',facts:{construction:'Fabric',condition:'new',fabric:'Test'},images:{create:{url:'https://res.cloudinary.com/demo/image/upload/sample.jpg',position:0}},variants:{create:{size:'Fabric',color:'Red',sku:`${id}-${i}`,stockQty:3,priceOverride:125}}}});
 const first=await request(`${api}/products?category=${category.slug}&page=1`);const second=await request(`${api}/products?category=${category.slug}&page=2`);
 assert.equal(first.items.length,24);assert.equal(second.items.length,1);assert.ok(!first.items.some(p=>p.id===second.items[0].id));
 const html1=await fetch(`${site}/shop?category=${category.slug}`).then(r=>r.text());const html2=await fetch(`${site}/shop?category=${category.slug}&page=2`).then(r=>r.text());
 assert.ok(html1.includes('rel="next"'));assert.ok(html2.includes('rel="prev"'));assert.ok(html2.includes(`category=${category.slug}&amp;page=2`));
 const product=first.items[0];const feed=await fetch(site+'/feeds/products.xml').then(r=>r.text());assert.ok(feed.includes(product.variants[0].id));assert.ok(feed.includes('125.00 PKR'));
 order=await request(api+'/orders',{customerName:'Local integration check',customerPhone:'00000000000',shippingAddress:{address:'Local test only',city:'Test'},items:[{variantId:product.variants[0].id,qty:1}],acquisition:{channel:'ORGANIC',landing:'/shop'},paymentMethod:'COD'});
 assert.equal(Number(order.items[0].unitPrice),125);assert.equal(order.acquisition.channel,'ORGANIC');assert.equal(order.status,'PENDING');
 assert.equal((await db.productVariant.findUnique({where:{id:product.variants[0].id}})).stockQty,2);
 await request(`${api}/orders/${order.id}/cancel`,{phone:'00000000000'});
 assert.equal((await db.productVariant.findUnique({where:{id:product.variants[0].id}})).stockQty,3);
 console.log('PASS: 25-product pagination with HTML next/previous/self-canonical; feed variant pricing; local COD order/acquisition/stock decrement and cancellation restock.');
}finally{if(order)await db.order.delete({where:{id:order.id}});if(category){await db.product.deleteMany({where:{categoryId:category.id}});await db.category.delete({where:{id:category.id}})}await db.$disconnect()}
})().catch(error=>{console.error(error);process.exitCode=1});
