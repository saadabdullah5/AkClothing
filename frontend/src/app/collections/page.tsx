import Link from "next/link";
import Image from "next/image";
import { getCatalog, getPublicCategories } from "@/lib/catalog";
import { apiFetch } from "@/lib/api";
import type { Collection } from "@/lib/types";
import Breadcrumbs from "@/components/Breadcrumbs";
export const metadata = { title: "Clothing & fabric collections in Pakistan", description: "Browse available clothing and fabric collections, compare current PKR prices and choose your size and color.", alternates: { canonical: "https://akclothings.shop/collections" } };
export default async function CollectionsPage() {
 const [categories, products, curated] = await Promise.all([getPublicCategories(), getCatalog(), apiFetch<Collection[]>("/collections")]);
 return <div><Breadcrumbs items={[{name:"Home",href:"/"},{name:"Collections",href:"/collections"}]} /><h1 className="text-3xl font-bold">Clothing & fabric collections</h1><p className="mt-3 text-ink-soft">Browse our current catalog by category. Check each product for its available colors, sizes and price.</p><div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">{categories.map(c=>{const photo=c.imageUrl || products.find(p=>p.category.id===c.id)?.images[0]?.url;return <Link key={c.id} href={`/shop?category=${encodeURIComponent(c.slug)}`} className="rang-card overflow-hidden">{photo&&<div className="relative aspect-[4/5]"><Image src={photo} alt={c.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" /></div>}<h2 className="p-4 font-semibold">{c.name}</h2></Link>})}{curated.map(c=><Link key={c.id} href={`/collections/${c.slug}`} className="rang-card p-5"><h2 className="font-semibold">{c.name}</h2>{c.description&&<p>{c.description}</p>}</Link>)}</div><Link href="/shop" className="mt-8 inline-block underline">Browse all {products.length} products</Link></div>;
}
