import { getCatalog } from "@/lib/catalog";
import { absoluteUrl, plainText } from "@/lib/seo";
import { variantImages } from "@/lib/product-variants";
export const dynamic = "force-dynamic";
const escape = (value: unknown) => String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function GET() {
 const products = await getCatalog();
 const items = products.flatMap(p => p.variants.flatMap(v => {
   const f=p.facts??{}; const photos=variantImages(p,v);
   // Exclude incomplete listings instead of inventing apparel attributes or identifiers.
   if(!photos.length || !f.condition || !f.construction || /all\s*cl|multi\s*colou?rs?/i.test(v.color)) return [];
   if(f.construction !== "Fabric" && (!f.gender || !f.ageGroup || !v.color.trim())) return [];
   const attributes: Record<string,unknown> = { id:v.id, title:`${p.name} - ${v.color}${/unstitched/i.test(v.size)?"":` - ${v.size}`}`, description:plainText(p.description), link:absoluteUrl(`/product/${p.slug}?variant=${v.id}`), image_link:photos[0].url, price:`${Number(v.priceOverride??p.basePrice).toFixed(2)} PKR`, availability:!v.isOutOfStock&&v.stockQty>0?"in_stock":"out_of_stock", condition:f.condition, item_group_id:p.id, color:v.color.trim(), product_type:p.category.name };
   if(f.construction==="Stitched" && !/unstitched|free|all/i.test(v.size)) attributes.size=v.size;
   for(const [key,field] of Object.entries({brand:"manufacturer",material:"fabric",gender:"gender",age_group:"ageGroup"})) if(f[field])attributes[key]=f[field];
   if(p.variants.length===1)for(const key of ["gtin","mpn"])if(f[key])attributes[key]=f[key];
   return [`<item>${Object.entries(attributes).map(([k,value])=>`<g:${k}>${escape(value)}</g:${k}>`).join("")}${photos.slice(1,11).map(photo=>`<g:additional_image_link>${escape(photo.url)}</g:additional_image_link>`).join("")}</item>`];
 }));
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>ak.shop catalog</title><link>${absoluteUrl("/")}</link><description>Verified product listings</description>${items.join("")}</channel></rss>`,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"no-store","X-Robots-Tag":"noindex"}});
}
